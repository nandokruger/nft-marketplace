import type { NftFilter } from '@/contracts';

export const queryKeys = {
  // Public catalog queries
  catalog: {
    all: ['public', 'nfts'] as const,
    list: (filter: Partial<NftFilter>) => ['public', 'nfts', 'list', filter] as const,
    detail: (id: string) => ['public', 'nfts', 'detail', id] as const,
    featured: () => ['public', 'nfts', 'featured'] as const
  },

  // Private user queries strictly scoped by userId
  user: {
    me: (userId: string) => ['private', userId, 'me'] as const,
    cart: (userId: string | 'guest') => ['private', userId, 'cart'] as const,
    orders: {
      all: (userId: string) => ['private', userId, 'orders'] as const,
      detail: (userId: string, orderId: string) => ['private', userId, 'orders', orderId] as const
    },
    wallets: (userId: string) => ['private', userId, 'wallets'] as const
  },

  // Test and scenario queries
  system: {
    scenario: ['system', 'scenario'] as const
  }
};
