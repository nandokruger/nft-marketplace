import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterSlidersIcon } from '@/components/icons';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import {
  countActiveFilters,
  type CatalogFilterPatch,
  type CatalogSearch
} from '@/components/catalog/catalog-search';

interface MobileCatalogBarProps {
  search: CatalogSearch;
  categoryCounts: Record<string, number> | undefined;
  networkCounts: Record<string, number> | undefined;
  totalResults?: number | undefined;
  onChange: (patch: CatalogFilterPatch) => void;
}

export function MobileCatalogBar({
  search,
  categoryCounts,
  networkCounts,
  totalResults,
  onChange
}: MobileCatalogBarProps) {
  const [query, setQuery] = useState(search.q ?? '');
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = countActiveFilters(search);

  // Sync external search.q changes (e.g. history navigation)
  useEffect(() => {
    setQuery(search.q ?? '');
  }, [search.q]);

  // Debounce typing into URL search
  useEffect(() => {
    const trimmed = query.trim();
    const currentQ = (search.q ?? '').trim();
    if (trimmed === currentQ) return;

    const timer = setTimeout(() => {
      onChange({ q: trimmed.length > 0 ? trimmed : undefined });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onChange, search.q]);

  const handleClearAll = () => {
    onChange({
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      network: undefined,
      favorites: undefined
    });
  };

  return (
    <div className="w-full flex items-center gap-3 lg:hidden" role="search">
      {/* Full width search input */}
      <div className="flex-1 flex items-center h-12 rounded-[12px] bg-surface-dark border border-border/40 px-3.5 gap-2.5 shadow-sm focus-within:border-primary/80 transition-colors">
        <Search className="h-5 w-5 text-text-secondary shrink-0" aria-hidden="true" />
        <label htmlFor="mobile-catalog-search-input" className="sr-only">
          Explorar coleções
        </label>
        <input
          id="mobile-catalog-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Explorar coleções"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-text-secondary/70 focus:outline-none font-mono"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange({ q: undefined });
            }}
            className="text-xs text-text-secondary hover:text-foreground cursor-pointer p-1"
            aria-label="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Shortcut Button that triggers Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Abrir filtros"
            className="relative h-12 w-12 rounded-[12px] bg-gradient-to-b from-[#D28A4C]/45 to-[#D28A4C] hover:brightness-95 text-ink flex items-center justify-center shrink-0 cursor-pointer shadow-sm transition-all"
          >
            <FilterSlidersIcon width={22} height={22} className="text-[#140D0A]" />

            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#D28A4C] text-ink font-bold text-[11px] flex items-center justify-center border-2 border-ink">
                {activeCount}
              </span>
            )}
          </button>
        </SheetTrigger>

        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto px-5 py-6">
          <SheetHeader className="pb-3 border-b border-border/40">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>

          <div className="py-4">
            <CatalogFilters
              search={search}
              categoryCounts={categoryCounts}
              networkCounts={networkCounts}
              onChange={onChange}
              idPrefix="sheet"
            />
          </div>

          <SheetFooter className="mt-4 pt-4 border-t border-border/40 flex flex-row items-center justify-between gap-3">
            {activeCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="rounded-[6px] border-border text-foreground hover:bg-surface-card"
              >
                Limpar filtros
              </Button>
            )}
            <SheetClose asChild>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="flex-1 rounded-[6px] bg-primary text-ink font-bold hover:bg-[#c27c3e]"
              >
                {typeof totalResults === 'number'
                  ? `Ver ${totalResults} resultados`
                  : 'Ver resultados'}
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}