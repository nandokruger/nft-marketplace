import { describe, expect, it } from 'vitest';
import { calculateCartTotals, createEmptyCart } from '@/mocks/db';
import type { CartItem } from '@/contracts';

const sampleNft = {
  id: 'nft-test-1',
  name: 'Test NFT',
  collection: 'Test Collection',
  category: 'art' as const,
  description: 'Test Description',
  imageUrl: 'https://example.com/test.jpg',
  priceEth: '0.5',
  creator: {
    id: 'creator_1',
    name: 'Alice',
    avatarUrl: '',
    address: '0x1111111111111111111111111111111111111111'
  },
  owner: {
    id: 'creator_1',
    name: 'Alice',
    avatarUrl: '',
    address: '0x1111111111111111111111111111111111111111'
  },
  totalEditions: 10,
  availableEditions: 5,
  isFeatured: false,
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z'
};

describe('calculateCartTotals — exact ETH math & coupons', () => {
  it('carrinho vazio tem totais zerados', () => {
    const empty = createEmptyCart();
    expect(empty.items).toEqual([]);
    expect(empty.subtotalEth).toBe('0');
    expect(empty.discountEth).toBe('0');
    expect(empty.networkFeeEth).toBe('0');
    expect(empty.totalEth).toBe('0');
  });

  it('calcula subtotal com quantidade e adiciona taxa de rede', () => {
    const items: CartItem[] = [
      {
        nftId: 'nft-test-1',
        nft: sampleNft,
        quantity: 2,
        priceSnapshotEth: '0.5'
      }
    ];

    const totals = calculateCartTotals(items, null);
    // Subtotal: 0.5 * 2 = 1.0 ETH
    expect(totals.subtotalEth).toBe('1');
    expect(totals.discountEth).toBe('0');
    expect(totals.networkFeeEth).toBe('0.016');
    // Total: 1.0 + 0.016 = 1.016 ETH
    expect(totals.totalEth).toBe('1.016');
  });

  it('aplica cupom válido KURIO10 (10% de desconto)', () => {
    const items: CartItem[] = [
      {
        nftId: 'nft-test-1',
        nft: sampleNft,
        quantity: 1,
        priceSnapshotEth: '2.5'
      }
    ];

    const totals = calculateCartTotals(items, 'KURIO10');
    // Subtotal: 2.5 ETH
    expect(totals.subtotalEth).toBe('2.5');
    // Desconto 10%: 0.25 ETH
    expect(totals.discountEth).toBe('0.25');
    expect(totals.discountPercentage).toBe('10');
    expect(totals.networkFeeEth).toBe('0.016');
    // Total: 2.5 - 0.25 + 0.016 = 2.266 ETH
    expect(totals.totalEth).toBe('2.266');
  });

  it('rejeita ou ignora cupom expirado EXPIRED50', () => {
    const items: CartItem[] = [
      {
        nftId: 'nft-test-1',
        nft: sampleNft,
        quantity: 1,
        priceSnapshotEth: '1.0'
      }
    ];

    const totals = calculateCartTotals(items, 'EXPIRED50');
    expect(totals.discountEth).toBe('0');
    expect(totals.discountPercentage).toBe('0');
    expect(totals.totalEth).toBe('1.016');
  });
});
