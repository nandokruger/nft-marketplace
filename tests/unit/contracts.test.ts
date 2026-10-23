import { describe, expect, it } from 'vitest';
import {
  NftSchema,
  RealtimeEnvelopeSchema
} from '@/contracts';

describe('Zod Contracts — runtime validation', () => {
  it('valida NftSchema com preço em string ETH válida', () => {
    const validNft = {
      id: 'nft-1',
      name: 'Cyber Horizon',
      collection: 'Cyber Horizons',
      category: 'art',
      description: 'Futuristic artwork',
      imageUrl: 'https://example.com/art.jpg',
      priceEth: '0.125',
      creator: {
        id: 'c1',
        name: 'Neo',
        avatarUrl: '',
        address: '0x1111111111111111111111111111111111111111'
      },
      owner: {
        id: 'c1',
        name: 'Neo',
        avatarUrl: '',
        address: '0x1111111111111111111111111111111111111111'
      },
      totalEditions: 10,
      availableEditions: 8,
      isFeatured: false,
      version: 1,
      createdAt: '2026-01-01T00:00:00.000Z'
    };

    const parsed = NftSchema.safeParse(validNft);
    expect(parsed.success).toBe(true);

    // Rejeita preço como number (critério inegociável da governança)
    const invalidNft = { ...validNft, priceEth: 0.125 };
    const invalidParsed = NftSchema.safeParse(invalidNft);
    expect(invalidParsed.success).toBe(false);
  });

  it('valida envelopes de eventos em tempo real com monotonic versioning', () => {
    const envelopeSchema = RealtimeEnvelopeSchema(NftSchema);
    const validEvent = {
      eventId: 'evt_123',
      version: 2,
      timestamp: '2026-01-01T00:00:00.000Z',
      payload: {
        id: 'nft-1',
        name: 'Cyber Horizon',
        collection: 'Cyber Horizons',
        category: 'art',
        description: 'Futuristic artwork',
        imageUrl: 'https://example.com/art.jpg',
        priceEth: '0.2',
        creator: {
          id: 'c1',
          name: 'Neo',
          avatarUrl: '',
          address: '0x1111111111111111111111111111111111111111'
        },
        owner: {
          id: 'c1',
          name: 'Neo',
          avatarUrl: '',
          address: '0x1111111111111111111111111111111111111111'
        },
        totalEditions: 10,
        availableEditions: 7,
        isFeatured: false,
        version: 2,
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    };

    expect(envelopeSchema.safeParse(validEvent).success).toBe(true);
  });
});
