import { Link } from '@tanstack/react-router';
import { Heart, ShoppingCart, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DESKTOP_CARD_TEXT_HEIGHT, MOBILE_CARD_TEXT_HEIGHT } from '@/components/catalog/catalog-layout';
import { eth } from '@/lib/eth-math';
import { cn } from '@/lib/utils';
import { resolveAssetUrl } from '@/lib/assets';
import type { Nft } from '@/contracts';

/** Preço exibido */
export function formatNftPrice(priceEth: string): string {
  return eth(priceEth).format({ locale: 'en-US', minDecimals: 2, maxDecimals: 4, withSymbol: true });
}

interface NftCardProps {
  nft: Nft;
  variant: 'desktop' | 'mobile';
  onAddToCart: (nft: Nft) => void;
  onToggleFavorite: (nft: Nft) => void;
  cartPending: boolean;
}

function RarityBadge() {
  return (
    <span className="absolute left-0 top-3 z-10  bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">
      Raro
    </span>
  );
}

function SoldOutBadge() {
  return (
    <span className="absolute bottom-2 left-2 z-10 rounded-[4px] bg-ink/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-coral">
      Esgotado
    </span>
  );
}

function FavoriteButton({
  nft,
  onToggle,
  className
}: {
  nft: Nft;
  onToggle: (nft: Nft) => void;
  className?: string;
}) {
  const isFavorited = nft.isFavorited ?? false;
  return (
    <button
      type="button"
      aria-pressed={isFavorited}
      aria-label={isFavorited ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
      onClick={() => onToggle(nft)}
      className={cn(
        'absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-primary backdrop-blur-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none cursor-pointer',
        className
      )}
    >
      <Heart
        className="h-4 w-4"
        fill={isFavorited ? 'currentColor' : 'none'}
        strokeWidth={2}
        aria-hidden="true"
      />
    </button>
  );
}

export function NftCard({ nft, variant, onAddToCart, onToggleFavorite, cartPending }: NftCardProps) {
  const soldOut = nft.availableEditions === 0;
  const isFavorited = nft.isFavorited ?? false;
  const priceLabel = formatNftPrice(nft.priceEth);
  const availability = soldOut
    ? 'Esgotado'
    : `${nft.availableEditions} de ${nft.totalEditions} edições disponíveis`;

  if (variant === 'mobile') {
    return (
      <article className="flex flex-col gap-2.5" data-testid="nft-card">
        <div className="relative overflow-hidden rounded-[15px] bg-surface-card px-1 py-3">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            aria-label={`Ver detalhes de ${nft.name}`}
            className="block aspect-square w-full overflow-hidden rounded-[12px] bg-surface-dark"
          >
            <img
              src={resolveAssetUrl(nft.imageUrl)}
              alt={nft.name}
              width={300}
              height={300}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </Link>
          {nft.rarity === 'rare' && <RarityBadge />}
          {soldOut && <SoldOutBadge />}
          <FavoriteButton nft={nft} onToggle={onToggleFavorite} className="right-3 top-3" />
        </div>

        <div className={cn('flex items-end justify-between gap-2 px-1', MOBILE_CARD_TEXT_HEIGHT)}>
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              to="/nft/$nftId"
              params={{ nftId: nft.id }}
              className="block truncate text-sm text-foreground hover:text-text-accent"
            >
              {nft.name}
            </Link>
            <span
              key={nft.priceEth}
              className="animate-in fade-in text-base font-bold text-text-accent motion-reduce:animate-none"
            >
              {priceLabel}
            </span>
            <span className="sr-only">{availability}</span>
          </div>
          {/* <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={cartPending || soldOut}
            onClick={() => onAddToCart(nft)}
            aria-label={`+ Carrinho: ${nft.name}`}
            className="h-9 w-9 shrink-0 rounded-full border-border text-primary"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          </Button> */}
        </div>
      </article>
    );
  }

  return (
    <Card
      data-testid="nft-card"
      className="group relative overflow-hidden flex w-[258px] flex-col gap-3 border-0 p-2 pb-4 transition-all duration-200 motion-reduce:transition-none"
    >
      {/* 1. Borda de destaque no topo (Hover State) */}
      <div
        aria-hidden="true"
        className="absolute top-2 inset-x-0 mx-auto  w-[242px] h-[1px] bg-primary/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-20 pointer-events-none"
      />

      <div className="relative mx-auto h-[242px] w-[242px] overflow-hidden  shadow-sm">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          aria-label={`Ver detalhes de ${nft.name}`}
          className="block h-full w-full cursor-pointer"
        >
          <div className="relative w-full max-w-[258px] aspect-square bg-surface-card py-4 px-1 sm:py-4 sm:px-1 flex items-center justify-center shrink-0 shadow-lg">
            <img
              src={resolveAssetUrl(nft.imageUrl)}
              alt={nft.name}
              width={242}
              height={242}
              loading="lazy"
              decoding="async"
              className="h-full w-full rounded-[15px] object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
            />
          </div>

        </Link>

        {nft.rarity === 'rare' && <RarityBadge />}
        {soldOut && <SoldOutBadge />}

        {/* 2. Barra de Ações Rápidas Flutuante (3 Ícones na Base da Imagem) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-all duration-200 ease-out">
          {/* Botão 1 (Carrinho / ShoppingCart) */}
          <button
            type="button"
            disabled={cartPending || soldOut}
            aria-label="Adicionar ao carrinho"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(nft);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#201612]/90 border border-border/80 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-[#2c1d17] hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </button>

          {/* Botão 2 (Favorito / Heart) */}
          <button
            type="button"
            aria-pressed={isFavorited}
            aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(nft);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#201612]/90 border border-border/80 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-[#2c1d17] hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <Heart
              className={cn('h-5 w-5 transition-colors', isFavorited ? 'fill-primary text-primary' : 'text-foreground')}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>

          {/* Botão 3 (Lupa / Detalhes / Search) */}
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            aria-label="Ver detalhes do NFT"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#201612]/90 border border-border/80 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-[#2c1d17] hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <Search className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className={cn('flex flex-col gap-1 px-1', DESKTOP_CARD_TEXT_HEIGHT)}>
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="block truncate text-base font-normal text-foreground transition-colors hover:text-text-accent"
        >
          {nft.name}
        </Link>
        <span
          key={nft.priceEth}
          className="animate-in fade-in font-mono text-lg font-bold text-text-accent motion-reduce:animate-none"
        >
          {priceLabel}
        </span>

      </div>
    </Card>
  );
}
