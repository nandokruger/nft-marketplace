import { http, HttpResponse } from 'msw';
import { dbManager, enrichNft } from '../db';
import { scenarioManager } from '../scenarios';
import { NftFilterSchema } from '@/contracts';
import { eth } from '@/lib/eth-math';

export const catalogHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const parsed = NftFilterSchema.safeParse(searchParams);
    if (!parsed.success) {
      return HttpResponse.json({ error: 'BAD_REQUEST', details: parsed.error.format() }, { status: 400 });
    }

    const { q, category, network, sort, minPrice, maxPrice, page, limit, favorites } = parsed.data;
    const db = dbManager.getDb();
    const enriched = db.nfts.map(enrichNft);
    let results = [...enriched];

    // Filter by favorites
    if (favorites === '1') {
      results = results.filter((nft) => Boolean(nft.isFavorited));
    }

    // Filter by query (name, collection, description)
    if (q && q.trim().length > 0) {
      const lower = q.toLowerCase();
      results = results.filter(
        (nft) =>
          nft.name.toLowerCase().includes(lower) ||
          nft.collection.toLowerCase().includes(lower) ||
          nft.description.toLowerCase().includes(lower)
      );
    }

    // Filter by category
    if (category) {
      results = results.filter((nft) => nft.category === category);
    }

    // Filter by network (multi-select, comma separated)
    if (network) {
      const allowed = new Set(network.split(','));
      results = results.filter((nft) => {
        if (nft.networks && nft.networks.some((n) => allowed.has(n))) return true;
        return nft.network !== undefined && allowed.has(nft.network);
      });
    }

    // Filter by min/max price using strict EthDecimal
    if (minPrice) {
      const min = eth(minPrice);
      results = results.filter((nft) => eth(nft.priceEth).gte(min));
    }
    if (maxPrice) {
      const max = eth(maxPrice);
      results = results.filter((nft) => eth(nft.priceEth).lte(max));
    }

    // Sorting
    results.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return eth(a.priceEth).cmp(b.priceEth);
        case 'price-desc':
          return eth(b.priceEth).cmp(a.priceEth);
        case 'popular':
          return b.availableEditions - a.availableEditions;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const items = results.slice(startIndex, startIndex + limit);

    // Dynamic real counts for all categories / networks from db
    const categoryCounts: Record<string, number> = {};
    const networkCounts: Record<string, number> = {};
    for (const nft of enriched) {
      categoryCounts[nft.category] = (categoryCounts[nft.category] || 0) + 1;
      if (nft.networks && nft.networks.length > 0) {
        for (const net of nft.networks) {
          networkCounts[net] = (networkCounts[net] || 0) + 1;
        }
      } else if (nft.network) {
        networkCounts[nft.network] = (networkCounts[nft.network] || 0) + 1;
      }
    }

    return HttpResponse.json({
      items,
      total,
      page,
      totalPages,
      categoryCounts,
      networkCounts
    });
  }),

  http.get('/api/nfts/:id', async ({ params, request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const { id } = params;
    const db = dbManager.getDb();
    const idStr = String(id).toLowerCase();
    const nft = db.nfts.find(
      (n) =>
        n.id.toLowerCase() === idStr ||
        n.id.toLowerCase() === `nft-${idStr}` ||
        n.id.toLowerCase() === `nft-0${idStr}` ||
        n.id.toLowerCase().replace('nft-', '') === idStr.replace('nft-', '') ||
        n.name.toLowerCase().includes(`#${idStr}`) ||
        n.name.toLowerCase().includes(`#0${idStr}`)
    );

    if (!nft) {
      return HttpResponse.json({ error: 'NOT_FOUND', message: 'NFT não encontrado' }, { status: 404 });
    }

    return HttpResponse.json(enrichNft(nft));
  }),

  http.post('/api/nfts/:id/favorite', async ({ params, request }) => {
    const chaos = await scenarioManager.handleChaos(request);
    if (chaos) return chaos;

    const { id } = params;
    const db = dbManager.getDb();
    const idStr = String(id).toLowerCase();
    const nft = db.nfts.find(
      (n) =>
        n.id.toLowerCase() === idStr ||
        n.id.toLowerCase() === `nft-${idStr}` ||
        n.id.toLowerCase() === `nft-0${idStr}` ||
        n.id.toLowerCase().replace('nft-', '') === idStr.replace('nft-', '') ||
        n.name.toLowerCase().includes(`#${idStr}`) ||
        n.name.toLowerCase().includes(`#0${idStr}`)
    );

    if (!nft) {
      return HttpResponse.json({ error: 'NOT_FOUND', message: 'NFT não encontrado' }, { status: 404 });
    }

    const nextFavorited = !nft.isFavorited;
    const currentLikes = nft.likesCount ?? 19;
    const nextLikes = nextFavorited ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    dbManager.updateDb((d) => {
      const target = d.nfts.find((n) => n.id === nft.id);
      if (target) {
        target.isFavorited = nextFavorited;
        target.likesCount = nextLikes;
      }
    });

    return HttpResponse.json({
      id: nft.id,
      isFavorited: nextFavorited,
      likesCount: nextLikes
    });
  })
];
