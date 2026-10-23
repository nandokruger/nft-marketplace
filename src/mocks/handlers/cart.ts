import { http, HttpResponse } from 'msw';
import { dbManager, calculateCartTotals, createEmptyCart } from '../db';
import { scenarioManager } from '../scenarios';
import { z } from 'zod';

function resolveCartKey(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer mock-token-')) {
    const userId = authHeader.replace('Bearer mock-token-', '').split('-')[0];
    if (userId) return userId;
  }
  return 'guest';
}

const AddItemSchema = z.object({
  nftId: z.string(),
  quantity: z.number().int().positive().default(1)
});

const UpdateItemSchema = z.object({
  quantity: z.number().int().min(0)
});

const ApplyCouponSchema = z.object({
  code: z.string().min(1)
});

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const cartKey = resolveCartKey(request);
    const db = dbManager.getDb();
    const cart = db.carts[cartKey] || createEmptyCart();

    return HttpResponse.json(cart);
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const body = await request.json();
    const parsed = AddItemSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'BAD_REQUEST', details: parsed.error.format() }, { status: 400 });
    }

    const { nftId, quantity } = parsed.data;
    const db = dbManager.getDb();
    const nft = db.nfts.find((n) => n.id === nftId);
    if (!nft) {
      return HttpResponse.json({ error: 'NOT_FOUND', message: 'NFT não encontrado' }, { status: 404 });
    }
    if (nft.availableEditions <= 0) {
      return HttpResponse.json({ error: 'BAD_REQUEST', message: 'Este NFT está esgotado.' }, { status: 400 });
    }

    const cartKey = resolveCartKey(request);
    let updatedCart = db.carts[cartKey] || createEmptyCart();

    const existingIndex = updatedCart.items.findIndex((i) => i.nftId === nftId);
    if (existingIndex >= 0) {
      const existing = updatedCart.items[existingIndex]!;
      const newQty = existing.quantity + quantity;
      if (newQty > nft.availableEditions) {
        return HttpResponse.json(
          { error: 'BAD_REQUEST', message: `Quantidade excede as edições disponíveis (${nft.availableEditions}).` },
          { status: 400 }
        );
      }
      existing.quantity = newQty;
      existing.priceSnapshotEth = nft.priceEth; // Refresh price snapshot
      existing.nft = nft;
    } else {
      updatedCart.items.push({
        nftId: nft.id,
        nft,
        quantity,
        priceSnapshotEth: nft.priceEth
      });
    }

    const totals = calculateCartTotals(updatedCart.items, updatedCart.couponCode);
    updatedCart = { ...updatedCart, ...totals };

    dbManager.updateDb((d) => {
      d.carts[cartKey] = updatedCart;
    });

    return HttpResponse.json(updatedCart);
  }),

  http.patch('/api/cart/items/:nftId', async ({ params, request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const nftId = String(params.nftId || params.itemId || params.id);
    const body = await request.json();
    const parsed = UpdateItemSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'BAD_REQUEST', details: parsed.error.format() }, { status: 400 });
    }

    const { quantity } = parsed.data;
    const cartKey = resolveCartKey(request);
    const db = dbManager.getDb();
    let cart = db.carts[cartKey] || createEmptyCart();

    if (quantity === 0) {
      cart.items = cart.items.filter((i) => i.nftId !== nftId);
    } else {
      const item = cart.items.find((i) => i.nftId === nftId);
      if (!item) {
        return HttpResponse.json({ error: 'NOT_FOUND', message: 'Item não encontrado no carrinho' }, { status: 404 });
      }
      if (quantity > item.nft.availableEditions) {
        return HttpResponse.json(
          { error: 'BAD_REQUEST', message: `Quantidade excede as edições disponíveis.` },
          { status: 400 }
        );
      }
      item.quantity = quantity;
    }

    const totals = calculateCartTotals(cart.items, cart.couponCode);
    cart = { ...cart, ...totals };

    dbManager.updateDb((d) => {
      d.carts[cartKey] = cart;
    });

    return HttpResponse.json(cart);
  }),

  http.delete('/api/cart/items/:nftId', async ({ params, request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const nftId = String(params.nftId || params.itemId || params.id);
    const cartKey = resolveCartKey(request);
    const db = dbManager.getDb();
    let cart = db.carts[cartKey] || createEmptyCart();

    cart.items = cart.items.filter((i) => i.nftId !== nftId);
    const totals = calculateCartTotals(cart.items, cart.couponCode);
    cart = { ...cart, ...totals };

    dbManager.updateDb((d) => {
      d.carts[cartKey] = cart;
    });

    return HttpResponse.json(cart);
  }),

  http.delete('/api/cart', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const cartKey = resolveCartKey(request);
    const empty = createEmptyCart();
    dbManager.updateDb((d) => {
      d.carts[cartKey] = empty;
    });

    return HttpResponse.json(empty);
  }),

  http.post('/api/cart/coupon', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const body = await request.json();
    const parsed = ApplyCouponSchema.safeParse(body);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'BAD_REQUEST', details: parsed.error.format() }, { status: 400 });
    }

    const { code } = parsed.data;
    const db = dbManager.getDb();
    const coupon = db.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());

    if (!coupon || !coupon.isValid) {
      return HttpResponse.json(
        { error: 'BAD_REQUEST', message: 'Cupom inválido ou expirado.' },
        { status: 400 }
      );
    }

    const cartKey = resolveCartKey(request);
    let cart = db.carts[cartKey] || createEmptyCart();
    const totals = calculateCartTotals(cart.items, coupon.code);
    cart = { ...cart, ...totals };

    dbManager.updateDb((d) => {
      d.carts[cartKey] = cart;
    });

    return HttpResponse.json(cart);
  }),

  http.delete('/api/cart/coupon', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const cartKey = resolveCartKey(request);
    const db = dbManager.getDb();
    let cart = db.carts[cartKey] || createEmptyCart();
    const totals = calculateCartTotals(cart.items, null);
    cart = { ...cart, ...totals };

    dbManager.updateDb((d) => {
      d.carts[cartKey] = cart;
    });

    return HttpResponse.json(cart);
  }),

  http.post('/api/cart/quote', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const cartKey = resolveCartKey(request);
    const db = dbManager.getDb();
    let cart = db.carts[cartKey] || createEmptyCart();

    const warnings: string[] = [];
    let hasPriceChange = false;
    let hasStockIssue = false;

    // Refresh snapshots and validate against active DB
    for (const item of cart.items) {
      const liveNft = db.nfts.find((n) => n.id === item.nftId);
      if (!liveNft) {
        warnings.push(`NFT "${item.nft.name}" não está mais disponível.`);
        hasStockIssue = true;
        continue;
      }

      if (liveNft.priceEth !== item.priceSnapshotEth) {
        warnings.push(
          `O preço de "${liveNft.name}" foi atualizado de ${item.priceSnapshotEth} para ${liveNft.priceEth} ETH.`
        );
        item.priceSnapshotEth = liveNft.priceEth;
        item.nft = liveNft;
        hasPriceChange = true;
      }

      if (item.quantity > liveNft.availableEditions) {
        if (liveNft.availableEditions <= 0) {
          warnings.push(`"${liveNft.name}" está esgotado.`);
          hasStockIssue = true;
        } else {
          warnings.push(
            `Apenas ${liveNft.availableEditions} edições de "${liveNft.name}" estão disponíveis.`
          );
          item.quantity = liveNft.availableEditions;
          hasStockIssue = true;
        }
      }
    }

    const totals = calculateCartTotals(cart.items, cart.couponCode);
    cart = { ...cart, ...totals };

    dbManager.updateDb((d) => {
      d.carts[cartKey] = cart;
    });

    return HttpResponse.json({
      cart,
      warnings,
      hasPriceChange,
      hasStockIssue,
      isValid: !hasStockIssue
    });
  }),

  http.post('/api/cart/sync', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request, true);
    if (chaos) return chaos;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer mock-token-')) {
      return HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const userId = authHeader.replace('Bearer mock-token-', '').split('-')[0]!;

    const db = dbManager.getDb();
    const guestCart = db.carts['guest'] || createEmptyCart();
    let userCart = db.carts[userId] || createEmptyCart();

    // Merge guest items into user cart
    for (const gItem of guestCart.items) {
      const existing = userCart.items.find((u) => u.nftId === gItem.nftId);
      if (existing) {
        existing.quantity += gItem.quantity;
      } else {
        userCart.items.push(gItem);
      }
    }

    const totals = calculateCartTotals(userCart.items, userCart.couponCode || guestCart.couponCode);
    userCart = { ...userCart, ...totals };

    dbManager.updateDb((d) => {
      d.carts[userId] = userCart;
      d.carts['guest'] = createEmptyCart(); // Clear guest cart once synced
    });

    return HttpResponse.json(userCart);
  }),

  http.post('/api/cart/merge', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request, true);
    if (chaos) return chaos;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer mock-token-')) {
      return HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const userId = authHeader.replace('Bearer mock-token-', '').split('-')[0]!;

    const db = dbManager.getDb();
    const guestCart = db.carts['guest'] || createEmptyCart();
    let userCart = db.carts[userId] || createEmptyCart();

    // Merge guest items into user cart
    for (const gItem of guestCart.items) {
      const existing = userCart.items.find((u) => u.nftId === gItem.nftId);
      if (existing) {
        existing.quantity += gItem.quantity;
      } else {
        userCart.items.push(gItem);
      }
    }

    const totals = calculateCartTotals(userCart.items, userCart.couponCode || guestCart.couponCode);
    userCart = { ...userCart, ...totals };

    dbManager.updateDb((d) => {
      d.carts[userId] = userCart;
      d.carts['guest'] = createEmptyCart();
    });

    return HttpResponse.json(userCart);
  })
];
