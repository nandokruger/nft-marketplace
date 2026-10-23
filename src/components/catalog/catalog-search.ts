import { z } from 'zod';
import { NftCategorySchema, NftNetworkSchema, type NftNetwork } from '@/contracts';
import { ETH_AMOUNT_PATTERN } from '@/lib/eth-math';

export const CATALOG_SORTS = ['newest', 'price-asc', 'price-desc', 'popular'] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const CATALOG_TABS = ['all', 'new', 'trending'] as const;
export type CatalogTab = (typeof CATALOG_TABS)[number];

export const CATALOG_PAGE_SIZE = 9;

/**
 * Search state da rota `/`. Cada campo usa `.catch(undefined)` para que uma URL
 * adulterada/antiga nunca quebre a página: o filtro inválido é simplesmente ignorado.
 * `auth`/`redirect` são preservados porque a modal de login usa `/?auth=login`.
 */
export const CatalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: NftCategorySchema.optional().catch(undefined),
  minPrice: z.string().regex(ETH_AMOUNT_PATTERN).optional().catch(undefined),
  maxPrice: z.string().regex(ETH_AMOUNT_PATTERN).optional().catch(undefined),
  network: z
    .string()
    .regex(/^(ethereum|polygon|solana)(,(ethereum|polygon|solana))*$/)
    .optional()
    .catch(undefined),
  sort: z.enum(CATALOG_SORTS).optional().catch(undefined),
  tab: z.enum(CATALOG_TABS).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
  favorites: z.enum(['1']).optional().catch(undefined),
  auth: z.enum(['login', 'register']).optional().catch(undefined),
  redirect: z.string().optional().catch(undefined)
});

export type CatalogSearch = z.infer<typeof CatalogSearchSchema>;

/** Campos que, ao mudar, reiniciam a paginação para a página 1. */
export type CatalogFilterPatch = Partial<
  Pick<CatalogSearch, 'q' | 'category' | 'minPrice' | 'maxPrice' | 'network' | 'sort' | 'tab' | 'favorites'>
>;

export function parseNetworks(value: string | undefined): NftNetwork[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => NftNetworkSchema.safeParse(item))
    .flatMap((result) => (result.success ? [result.data] : []));
}

export function effectiveSort(search: CatalogSearch): CatalogSort {
  if (search.tab === 'new') return 'newest';
  if (search.tab === 'trending') return 'popular';
  return search.sort ?? 'newest';
}

export function countActiveFilters(search: CatalogSearch): number {
  let count = 0;
  if (search.category) count += 1;
  if (search.minPrice || search.maxPrice) count += 1;
  if (search.network) count += 1;
  if (search.favorites === '1') count += 1;
  return count;
}

/** Remove chaves `undefined`/vazias para que `exactOptionalPropertyTypes` e a URL permaneçam limpos. */
export function compactSearch(search: CatalogSearch): CatalogSearch {
  const entries = Object.entries(search).filter(([, value]) => value !== undefined && value !== '');
  return Object.fromEntries(entries) as CatalogSearch;
}
