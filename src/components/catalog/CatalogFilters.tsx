import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { NftCategory, NftNetwork } from '@/contracts';
import {
  ethToStep,
  formatStep,
  stepToEth,
  PRICE_SLIDER_MAX_STEP,
  PRICE_SLIDER_MIN_STEP
} from '@/lib/price-steps';
import {
  parseNetworks,
  type CatalogFilterPatch,
  type CatalogSearch
} from '@/components/catalog/catalog-search';

export const CATALOG_COLLECTIONS: { id: NftCategory; label: string }[] = [
  { id: 'art', label: 'Arte digital' },
  { id: 'photography', label: 'Fotografia' },
  { id: 'music', label: 'Música' },
  { id: '3d-art', label: 'Arte 3D' },
  { id: 'collectibles', label: 'Colecionáveis' },
  { id: 'generative', label: 'Generativa' },
  { id: 'gaming', label: 'Jogos' },
  { id: 'memberships', label: 'Assinaturas' },
  { id: 'utility', label: 'Utilidade' }
];

export const CATALOG_NETWORKS: { id: NftNetwork; label: string }[] = [
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'solana', label: 'Solana' }
];

interface CatalogFiltersProps {
  search: CatalogSearch;
  categoryCounts: Record<string, number> | undefined;
  networkCounts: Record<string, number> | undefined;
  onChange: (patch: CatalogFilterPatch) => void;
  /** Prefixo para ids únicos (a mesma UI é usada na aside e no Sheet). */
  idPrefix: string;
}

type Range = [number, number];

function rangeFromSearch(search: Pick<CatalogSearch, 'minPrice' | 'maxPrice'>): Range {
  return [
    ethToStep(search.minPrice, 2),
    ethToStep(search.maxPrice, 1230)
  ];
}

export function CatalogFilters({
  search,
  categoryCounts,
  networkCounts,
  onChange,
  idPrefix
}: CatalogFiltersProps) {
  const [range, setRange] = useState<Range>(() => rangeFromSearch(search));

  // Mantém o rascunho do slider em sincronia com a URL (back/forward, Redefinir, links diretos).
  useEffect(() => {
    const next = rangeFromSearch({ minPrice: search.minPrice, maxPrice: search.maxPrice });
    setRange(next);
  }, [search.minPrice, search.maxPrice]);

  const priceActive = Boolean(search.minPrice || search.maxPrice);
  const selectedNetworks = parseNetworks(search.network);

  const applyPrice = () => {
    onChange({ minPrice: stepToEth(range[0]), maxPrice: stepToEth(range[1]) });
  };

  const toggleNetwork = (network: NftNetwork) => {
    const next = selectedNetworks.includes(network)
      ? selectedNetworks.filter((item) => item !== network)
      : [...selectedNetworks, network];
    onChange({ network: next.length > 0 ? next.join(',') : undefined });
  };

  return (
    <div className="flex flex-col gap-7">
      {/* 1. Coleções */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Coleções</h2>
          {search.category && (
            <button
              type="button"
              onClick={() => onChange({ category: undefined })}
              className="text-xs text-text-accent hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          )}
        </div>

        <div className="flex flex-col px-3">
          {CATALOG_COLLECTIONS.map((col) => {
            const isSelected = search.category === col.id;
            const count = categoryCounts?.[col.id] ?? 0;
            return (
              <button
                key={col.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange({ category: isSelected ? undefined : col.id })}
                className={`flex items-center justify-between h-10 transition-colors cursor-pointer text-left text-[15px] ${isSelected
                  ? 'text-text-accent font-bold'
                  : 'text-text-secondary hover:text-foreground font-normal'
                  }`}
              >
                <span>{col.label}</span>
                <span className="font-semibold">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Faixa de preço */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Faixa de preço</h2>
          {priceActive && (
            <button
              type="button"
              onClick={() => onChange({ minPrice: undefined, maxPrice: undefined })}
              className="text-xs text-text-accent hover:underline cursor-pointer"
            >
              Redefinir
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 pl-3">
          <Slider
            min={PRICE_SLIDER_MIN_STEP}
            max={PRICE_SLIDER_MAX_STEP}
            step={1}
            minStepsBetweenThumbs={0}
            value={range}
            onValueChange={(val) => {
              const [low, high] = val;
              if (low !== undefined && high !== undefined) setRange([low, high]);
            }}
            className="w-full"
            aria-label="Faixa de preço em ETH"
          />

          <span className="text-[15px] text-foreground font-normal">
            Preço: {formatStep(range[0])} - {formatStep(range[1])} ETH
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={applyPrice}
              className="w-fit px-3 py-2 h-auto rounded-[6px] font-bold  text-ink bg-primary hover:bg-[#c27c3e] cursor-pointer shadow-none"
            >
              Aplicar
            </Button>
            {priceActive && <span className="text-[11px] text-primary/50 font-medium">✓ Ativo</span>}
          </div>
        </div>
      </div>

      {/* 3. Rede - multi-seleção */}
      <fieldset className="flex flex-col gap-3 min-w-0">
        <legend className="text-lg font-bold text-foreground mb-3">Rede</legend>
        <div className="flex flex-col pl-3">
          {CATALOG_NETWORKS.map((net) => {
            const checked = selectedNetworks.includes(net.id);
            const inputId = `${idPrefix}-network-${net.id}`;
            return (
              <label
                key={net.id}
                htmlFor={inputId}
                className={`flex items-center justify-between h-10 cursor-pointer text-[15px] transition-colors ${checked ? 'text-primary font-bold' : 'text-text-secondary hover:text-foreground'
                  }`}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleNetwork(net.id)}
                  className="sr-only"
                />
                <span>{net.label}</span>
                <span className="font-semibold">({networkCounts?.[net.id] ?? 0})</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
