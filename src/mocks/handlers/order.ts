import { http, HttpResponse, delay } from 'msw';
import { dbManager, createEmptyCart } from '../db';
import { scenarioManager } from '../scenarios';
import { emitNftUpdated, emitOrderUpdated } from '../socket-handlers';
import { CreateOrderRequestSchema, type Order } from '@/contracts';
import { eth } from '@/lib/eth-math';

export const orderHandlers = [
  http.post('/api/orders', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request, true);
    if (chaos) return chaos;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer mock-token-')) {
      return HttpResponse.json({ error: 'UNAUTHORIZED', message: 'Sessão necessária para checkout' }, { status: 401 });
    }
    const userId = authHeader.replace('Bearer mock-token-', '').split('-')[0]!;

    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return HttpResponse.json(
        { error: 'BAD_REQUEST', message: 'Header Idempotency-Key é obrigatório para realizar pedido.' },
        { status: 400 }
      );
    }

    const db = dbManager.getDb();

    // Idempotency check: if order with this key already exists for this user, return it directly!
    const existingOrder = db.orders.find((o) => o.userId === userId && o.idempotencyKey === idempotencyKey);
    if (existingOrder) {
      return HttpResponse.json(existingOrder, { status: 200 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = CreateOrderRequestSchema.safeParse({ ...body, idempotencyKey });
    if (!parsed.success) {
      return HttpResponse.json({ error: 'BAD_REQUEST', details: parsed.error.format() }, { status: 400 });
    }

    const { walletAddress, network } = parsed.data;
    const cart = db.carts[userId];

    if (!cart || cart.items.length === 0) {
      return HttpResponse.json({ error: 'BAD_REQUEST', message: 'Carrinho vazio.' }, { status: 400 });
    }

    const scenario = scenarioManager.getScenario();

    // Scenario: price-changed-on-checkout
    if (scenario === 'price-changed-on-checkout') {
      const firstItem = cart.items[0]!;
      const targetNft = db.nfts.find((n) => n.id === firstItem.nftId);
      if (targetNft) {
        // Increase price by 0.5 ETH
        const newPrice = eth(targetNft.priceEth).add('0.5').toString();
        targetNft.priceEth = newPrice;
        targetNft.version += 1;
        emitNftUpdated(targetNft);
      }
      return HttpResponse.json(
        {
          error: 'PRICE_CHANGED',
          message: 'O preço de um ou mais itens mudou durante o checkout. O carrinho foi atualizado.'
        },
        { status: 409 }
      );
    }

    // Scenario: edition-exhausted
    if (scenario === 'edition-exhausted') {
      const firstItem = cart.items[0]!;
      const targetNft = db.nfts.find((n) => n.id === firstItem.nftId);
      if (targetNft) {
        targetNft.availableEditions = 0;
        targetNft.version += 1;
        emitNftUpdated(targetNft);
      }
      return HttpResponse.json(
        {
          error: 'EDITION_EXHAUSTED',
          message: 'As edições disponíveis deste NFT se esgotaram antes da confirmação.'
        },
        { status: 400 }
      );
    }

    // Check availability of each item
    for (const item of cart.items) {
      const liveNft = db.nfts.find((n) => n.id === item.nftId);
      if (!liveNft || liveNft.availableEditions < item.quantity) {
        return HttpResponse.json(
          {
            error: 'INSUFFICIENT_EDITIONS',
            message: `Edições insuficientes para o NFT ${item.nft.name}.`
          },
          { status: 400 }
        );
      }
    }

    const isDeclined = scenario === 'payment-declined';
    const orderId = `ord_${Date.now()}`;
    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newOrder: Order = {
      id: orderId,
      userId,
      idempotencyKey,
      items: cart.items.map((i) => ({
        ...i,
        executedPriceEth: i.nft.priceEth
      })),
      couponCode: cart.couponCode,
      discountPercentage: cart.discountPercentage,
      subtotalEth: cart.subtotalEth,
      discountEth: cart.discountEth,
      networkFeeEth: cart.networkFeeEth,
      totalEth: cart.totalEth,
      walletAddress,
      network,
      status: isDeclined ? 'DECLINED' : 'CONFIRMED',
      statusReason: isDeclined ? 'Transação rejeitada pelo nó blockchain da rede.' : undefined,
      txHash: isDeclined ? undefined : txHash,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Decrement available editions if confirmed
    if (!isDeclined) {
      for (const item of cart.items) {
        const liveNft = db.nfts.find((n) => n.id === item.nftId);
        if (liveNft) {
          liveNft.availableEditions = Math.max(0, liveNft.availableEditions - item.quantity);
          liveNft.version += 1;
          emitNftUpdated(liveNft);
        }
      }
    }

    // Persist order in database
    dbManager.updateDb((d) => {
      d.orders.push(newOrder);
      if (!isDeclined) {
        d.carts[userId] = createEmptyCart(); // Clear user cart upon successful purchase
      }
    });

    // Broadcast order event
    emitOrderUpdated(newOrder);

    // Scenario: order-timeout-idempotent
    if (scenario === 'order-timeout-idempotent') {
      await delay(3000);
      return HttpResponse.json(
        {
          error: 'GATEWAY_TIMEOUT',
          message: 'Timeout ao conectar com o nó blockchain da carteira.'
        },
        { status: 504 }
      );
    }

    return HttpResponse.json(newOrder, { status: 201 });
  }),

  http.get('/api/orders/:id', async ({ params, request }) => {
    const chaos = await scenarioManager.handleChaos(request, true);
    if (chaos) return chaos;

    const { id } = params;
    const db = dbManager.getDb();
    const order = db.orders.find((o) => o.id === id);

    if (!order) {
      return HttpResponse.json({ error: 'NOT_FOUND', message: 'Pedido não encontrado' }, { status: 404 });
    }

    return HttpResponse.json(order);
  }),

  http.get('/api/orders', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request, true);
    if (chaos) return chaos;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer mock-token-')) {
      return HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const userId = authHeader.replace('Bearer mock-token-', '').split('-')[0]!;

    const db = dbManager.getDb();
    const userOrders = db.orders.filter((o) => o.userId === userId);

    return HttpResponse.json(userOrders);
  })
];
