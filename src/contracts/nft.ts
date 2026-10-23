import { z } from 'zod';
import { ETH_AMOUNT_PATTERN } from '@/lib/eth-math';

export const NftCategorySchema = z.enum([
  'art',
  'collectibles',
  'gaming',
  'photography',
  'music',
  '3d-art',
  'generative',
  'memberships',
  'utility'
]);
export type NftCategory = z.infer<typeof NftCategorySchema>;

export const NftNetworkSchema = z.enum(['ethereum', 'polygon', 'solana']);
export type NftNetwork = z.infer<typeof NftNetworkSchema>;

export const NftRaritySchema = z.enum(['common', 'rare']);
export type NftRarity = z.infer<typeof NftRaritySchema>;

export const NftSchema = z.object({
  id: z.string(),
  name: z.string(),
  collection: z.string(),
  category: NftCategorySchema,
  description: z.string(),
  imageUrl: z.string(),
  priceEth: z.string().regex(ETH_AMOUNT_PATTERN, 'Preço deve ser string decimal em ETH válida'),
  creator: z.object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string(),
    address: z.string()
  }),
  owner: z.object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string(),
    address: z.string()
  }),
  totalEditions: z.number().int().positive(),
  availableEditions: z.number().int().min(0),
  isFeatured: z.boolean().default(false),
  isFavorited: z.boolean().optional(),
  likesCount: z.number().int().optional(),
  network: NftNetworkSchema.optional(),
  networks: z.array(NftNetworkSchema).optional(),
  rarity: NftRaritySchema.optional(),
  version: z.number().int().nonnegative().default(1),
  createdAt: z.string()
});

export type Nft = z.infer<typeof NftSchema>;

export const NftFilterSchema = z.object({
  q: z.string().optional(),
  category: NftCategorySchema.optional(),
  /** `1` retorna apenas NFTs favoritados. */
  favorites: z.enum(['1']).optional(),
  sort: z.enum(['price-asc', 'price-desc', 'newest', 'popular']).default('newest'),
  /** Redes separadas por vírgula (ex.: `ethereum,polygon`). */
  network: z
    .string()
    .regex(/^(ethereum|polygon|solana)(,(ethereum|polygon|solana))*$/)
    .optional(),
  minPrice: z.string().regex(ETH_AMOUNT_PATTERN).optional(),
  maxPrice: z.string().regex(ETH_AMOUNT_PATTERN).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(12)
});

export type NftFilter = z.infer<typeof NftFilterSchema>;

export const NftListResponseSchema = z.object({
  items: z.array(NftSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  categoryCounts: z.record(z.string(), z.number()).optional(),
  networkCounts: z.record(z.string(), z.number()).optional()
});

export type NftListResponse = z.infer<typeof NftListResponseSchema>;
