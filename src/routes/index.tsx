import { useState, useRef } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useIsDesktop } from '@/lib/use-media-query';
import { resolveAssetUrl } from '@/lib/assets';
import { ChevronDownIcon } from '@/components/icons';
import {
  CatalogSearchSchema,
  compactSearch,
  effectiveSort,
  CATALOG_PAGE_SIZE,
  CATALOG_TABS,
  type CatalogFilterPatch,
  type CatalogSort,
  type CatalogTab
} from '@/components/catalog/catalog-search';
import { HomeHero } from '@/components/catalog/HomeHero';
import { MobileCatalogBar } from '@/components/catalog/MobileCatalogBar';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { NftCard } from '@/components/catalog/NftCard';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { EditorialSections } from '@/components/catalog/EditorialSections';
import { MobileBottomNav } from '@/components/catalog/MobileBottomNav';
import { CatalogGridSkeleton } from '@/components/skeletons/CatalogGridSkeleton';
import {
  DESKTOP_GRID_CLASS,
  MOBILE_GRID_CLASS
} from '@/components/catalog/catalog-layout';
import { useFavoriteNft } from '@/components/catalog/use-favorite-nft';
import type { Nft, NftListResponse } from '@/contracts';

export const Route = createFileRoute('/')({
  validateSearch: (search) => CatalogSearchSchema.parse(search),
  component: HomePage
});

const TAB_LABELS: Record<CatalogTab, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta'
};

function HomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: '/' });
  const isDesktop = useIsDesktop();
  const qc = useQueryClient();
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const catalogColumnRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string) => {
    setToastNotice(message);
    setTimeout(() => setToastNotice(null), 3000);
  };

  const setFilters = (patch: CatalogFilterPatch, options?: { replace?: boolean }) => {
    navigate({
      search: (prev) => compactSearch({ ...prev, ...patch, page: undefined }),
      replace: options?.replace ?? false,
      resetScroll: false
    });
  };

  const setPage = (newPage: number) => {
    navigate({
      search: (prev) => compactSearch({ ...prev, page: newPage === 1 ? undefined : newPage }),
      resetScroll: false
    });
    if (catalogColumnRef.current) {
      const headerOffset = isDesktop ? 80 : 20;
      const elementPosition = catalogColumnRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
  };

  // Build filter query params sent to MSW
  const sort = effectiveSort(search);
  const filterParams = {
    q: search.q,
    category: search.category,
    network: search.network,
    sort,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    favorites: search.favorites,
    page: search.page ?? 1,
    limit: CATALOG_PAGE_SIZE
  };

  const { data, isLoading, isError, refetch } = useQuery<NftListResponse>({
    queryKey: queryKeys.catalog.list(filterParams),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterParams.q) params.set('q', filterParams.q);
      if (filterParams.category) params.set('category', filterParams.category);
      if (filterParams.network) params.set('network', filterParams.network);
      if (filterParams.sort) params.set('sort', filterParams.sort);
      if (filterParams.minPrice) params.set('minPrice', filterParams.minPrice);
      if (filterParams.maxPrice) params.set('maxPrice', filterParams.maxPrice);
      if (filterParams.favorites) params.set('favorites', filterParams.favorites);
      params.set('page', String(filterParams.page));
      params.set('limit', String(filterParams.limit));
      const res = await apiClient.get<NftListResponse>(`/api/nfts?${params.toString()}`);
      return res.data;
    }
  });

  const favoriteMutation = useFavoriteNft((notice) => showToast(notice));

  const addToCartMutation = useMutation({
    mutationFn: async (nft: Nft) => {
      const res = await apiClient.post('/api/cart/items', { nftId: nft.id, quantity: 1 });
      return res.data;
    },
    onSuccess: (_, nft) => {
      qc.invalidateQueries({ queryKey: ['private'] });
      showToast(`✓ "${nft.name}" adicionado ao carrinho!`);
    }
  });

  const activeTab: CatalogTab = search.tab ?? 'all';
  const currentSort: CatalogSort = search.sort ?? 'newest';

  return (
    <div className="w-full flex flex-col items-center gap-12 sm:gap-16 lg:gap-24 py-4 sm:py-6 px-4 sm:px-6 lg:px-0 lg:pt-9 max-w-[1200px] mx-auto font-mono pb-28 lg:pb-0">
      {/* Toast Notice */}
      {toastNotice && (
        <div
          role="status"
          className="fixed top-20 right-4 z-50 rounded-[6px] border border-primary bg-ink px-4 py-3 text-sm font-bold text-primary shadow-2xl backdrop-blur animate-in fade-in motion-reduce:animate-none"
        >
          {toastNotice}
        </div>
      )}

      {/* Mobile Search & Filter Sheet Bar */}
      <MobileCatalogBar
        search={search}
        categoryCounts={data?.categoryCounts}
        networkCounts={data?.networkCounts}
        totalResults={data?.total}
        onChange={setFilters}
      />

      {/* SECTION 1: HERO BANNER (Single h1 for A11y & SEO) */}
      <HomeHero variant={isDesktop ? 'desktop' : 'mobile'} />

      {/* SECTION 2: PRODUCTS (Desktop Sidebar + 3 Col Grid | Mobile 2 Col Grid) */}
      <section
        id="catalog"
        aria-label="Catálogo e Filtros de NFTs"
        className="w-full flex flex-col lg:flex-row items-start gap-8 lg:gap-12"
      >
        {/* DESKTOP SIDEBAR DE FILTROS (310px) */}
        {isDesktop && (
          <aside
            aria-label="Filtros laterais do catálogo"
            className="w-full lg:w-[310px] shrink-0 flex flex-col gap-6"
          >
            <Card className="w-full  bg-surface-card p-5 flex flex-col gap-7 border-0">
              <CatalogFilters
                search={search}
                categoryCounts={data?.categoryCounts}
                networkCounts={data?.networkCounts}
                onChange={setFilters}
                idPrefix="desktop"
              />
            </Card>

            {/* Featured NFT Promo Banner (#70410:3791, 310x470px) */}
            <Link
              to="/nft/$nftId"
              params={{ nftId: 'nft-02' }}
              className="w-full  p-1 pt-6 pb-4 flex flex-col items-center gap-2 text-center  bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent relative overflow-hidden group cursor-pointer"
            >
              <span className="text-2xl font-bold tracking-wide text-text-accent uppercase">
                NFT EM DESTAQUE
              </span>
              <span className="text-[22px] font-bold text-foreground uppercase leading-5">
                OFERTA LIMITADA
              </span>

              <div className="w-full h-[368px] rounded-[22px] overflow-hidden mt-3 shadow-lg">
                <img
                  src={resolveAssetUrl('/assets/nfts/sage-nomad.png')}
                  alt="NFT em destaque - Oferta limitada"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  width={262}
                  height={368}
                />
              </div>
            </Link>
          </aside>
        )}

        {/* RIGHT COLUMN: TOOLBAR + NFT GRID + PAGINATION */}
        <div ref={catalogColumnRef} className="w-full flex-1 flex flex-col gap-6 lg:gap-8 scroll-mt-24">
          {/* Toolbar: Quick Tabs & Sort Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4 border-b border-transparent pb-1">
            {/* Quick Tabs: Todos os NFTs / Novos lançamentos / Em alta */}
            <div className="flex items-start gap-4 sm:gap-6 text-sm sm:text-[15px] font-medium overflow-x-auto pb-1" role="tablist">
              {CATALOG_TABS.map((tabKey) => {
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setFilters({
                        tab: tabKey === 'all' ? undefined : tabKey,
                        sort: undefined
                      });
                    }}
                    className={`relative pb-2 cursor-pointer transition-colors shrink-0 ${isActive
                      ? 'text-text-accent font-bold'
                      : 'text-foreground hover:text-primary font-medium'
                      }`}
                  >
                    {TAB_LABELS[tabKey]}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown (hidden on mobile, visible on desktop/tablet) */}
            <div className="hidden lg:flex items-start gap-2 text-sm sm:text-[15px] text-foreground self-end sm:self-auto">
              <label htmlFor="sort-select" className="text-foreground shrink-0">
                Ordenar por:
              </label>
              <div className="relative inline-flex items-center">
                <select
                  id="sort-select"
                  value={currentSort}
                  onChange={(e) => {
                    setFilters({
                      sort: e.target.value as CatalogSort,
                      tab: undefined
                    });
                  }}
                  className="bg-transparent text-sm sm:text-[15px] text-foreground appearance-none pr-6 cursor-pointer focus:outline-none"
                >
                  <option value="newest" className="bg-surface-dark text-foreground">
                    Listados recentemente
                  </option>
                  <option value="price-asc" className="bg-surface-dark text-foreground">
                    Preço: menor para maior
                  </option>
                  <option value="price-desc" className="bg-surface-dark text-foreground">
                    Preço: maior para menor
                  </option>
                  <option value="popular" className="bg-surface-dark text-foreground">
                    Mais populares
                  </option>
                </select>
                <ChevronDownIcon
                  className="w-4 h-4 pointer-events-none absolute right-0 text-white"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* NFT Grid Content: Loading / Error / Empty / Items */}
          {isLoading ? (
            <CatalogGridSkeleton variant={isDesktop ? 'desktop' : 'mobile'} count={CATALOG_PAGE_SIZE} />
          ) : isError ? (
            <div
              role="alert"
              className="rounded-[8px] border border-text-coral/50 bg-surface-card p-12 text-center flex flex-col items-center gap-3"
            >
              <span className="text-3xl text-text-coral" aria-hidden="true">⚠</span>
              <p className="text-base font-bold">Falha ao carregar catálogo</p>
              <Button
                variant="default"
                size="sm"
                onClick={() => refetch()}
                className="rounded-[6px] bg-primary text-ink font-bold hover:bg-[#c27c3e]"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="rounded-[8px] border border-border bg-surface-card p-12 text-center flex flex-col items-center gap-3">
              <p className="text-sm text-text-secondary">
                Nenhum NFT encontrado com os filtros selecionados.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    q: undefined,
                    category: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    network: undefined,
                    favorites: undefined,
                    tab: undefined,
                    sort: undefined
                  })
                }
                className="rounded-[6px] border-border text-foreground hover:bg-surface-dark"
              >
                Limpar todos os filtros
              </Button>
            </div>
          ) : (
            <div className={isDesktop ? DESKTOP_GRID_CLASS : MOBILE_GRID_CLASS}>
              {data.items.map((nft) => (
                <NftCard
                  key={nft.id}
                  nft={nft}
                  variant={isDesktop ? 'desktop' : 'mobile'}
                  onAddToCart={() => addToCartMutation.mutate(nft)}
                  onToggleFavorite={() => favoriteMutation.mutate(nft)}
                  cartPending={
                    addToCartMutation.isPending &&
                    addToCartMutation.variables?.id === nft.id
                  }
                />
              ))}
            </div>
          )}

          {/* Numbered Pagination */}
          {data && data.totalPages > 1 && (
            <CatalogPagination
              currentPage={data.page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </section>

      {/* SECTION 3 & 4: PROMOS & DIÁRIO DA CUNHAGEM (Desktop only) */}
      <EditorialSections onExplorePromos={() => setFilters({ tab: 'new' })} />

      {/* Floating Bottom Navigation Bar (Mobile only) */}
      <MobileBottomNav
        search={search}
        onFilterFavorites={() => setFilters({ favorites: '1' })}
        onClearFavorites={() => setFilters({ favorites: undefined })}
      />
    </div>
  );
}