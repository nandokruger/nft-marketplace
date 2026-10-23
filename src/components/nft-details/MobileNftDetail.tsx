import { Heart } from 'lucide-react';
import { eth } from '@/lib/eth-math';
import { resolveAssetUrl } from '@/lib/assets';
import type { Nft } from '@/contracts';

interface MobileNftDetailProps {
  nft: Nft;
  selectedEdition: string;
  onSelectEdition: (edition: string) => void;
  quantity: number;
  onIncreaseQuantity: () => void;
  onDecreaseQuantity: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  favoritePending: boolean;
  onBuyNow: () => void;
  onAddToCart: () => void;
  cartPending: boolean;
  onBack: () => void;
}

const MOBILE_EDITIONS = ['1/10', '1/10', '1/50', 'ABERTA'] as const;

export function MobileNftDetail({
  nft,
  selectedEdition,
  onSelectEdition,
  quantity,
  onIncreaseQuantity,
  onDecreaseQuantity,
  isFavorited,
  onToggleFavorite,
  favoritePending,
  onBuyNow,
  onAddToCart,
  cartPending,
  onBack
}: MobileNftDetailProps) {
  const isSoldOut = nft.availableEditions <= 0;
  const totalPrice = eth(nft.priceEth)
    .mulInt(quantity)
    .format({ withSymbol: true, locale: 'en-US' });

  const tokenMatch = nft.name.match(/#0*(\d+)/);
  const tokenIdFormatted = tokenMatch ? `#00${tokenMatch[1]}` : `#${nft.id.replace('nft-', '00')}`;
  const collectionName = nft.collection === 'Emerald Apes' ? 'Kurio Apes' : nft.collection;

  return (
    <div className="w-full  mx-auto min-h-screen flex flex-col font-mono text-foreground bg-ink relative pb-36">
      {/* Floating Top Header (Minimalist Navigation) */}
      <div className="sticky top-0 z-30 w-full flex items-center justify-between px-4 py-3 bg-gradient-to-b from-ink/90 via-ink/60 to-transparent backdrop-blur-[2px]">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="w-11 h-11 rounded-full bg-surface-card/80 hover:bg-surface-dark border border-border/40 text-foreground flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer shadow-md"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.9167 15.8332C12.9167 15.8332 7.08335 12.3798 7.08335 9.99984C7.08335 7.62067 12.9167 4.1665 12.9167 4.1665" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#CFB28C" />
          </svg>
        </button>

        {/* Favorite Button with Optimistic Update */}
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={favoritePending}
          aria-label={isFavorited ? 'Remover dos favoritos' : 'Favoritar'}
          aria-pressed={isFavorited}
          className="w-11 h-11 rounded-full bg-surface-card/80 hover:bg-surface-dark border border-border/40 text-primary flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-md disabled:opacity-50"
        >
          <Heart
            className="w-5 h-5 text-primary"
            fill={isFavorited ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Main NFT Artwork Card (rounded-[2rem], CLS = 0) */}
      <div className="px-4 w-full">
        <div className="w-full mx-auto max-w-[500px] aspect-square rounded-[2rem] overflow-hidden bg-surface-dark shadow-2xl relative border border-border/30">
          <img
            src={resolveAssetUrl(nft.imageUrl)}
            alt={nft.name}
            className="w-full h-full object-cover"
            fetchPriority="high"
            width={358}
            height={358}
          />
        </div>
      </div>

      {/* Info & Metadata Card */}
      <div className="mt-4 px-4 w-full">
        <div className="w-full rounded-[2rem] bg-surface-card border border-border/40 p-5 flex flex-col gap-4 shadow-xl">
          {/* Title & Rating */}
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
              {nft.name}
            </h1>

            {/* Rating Badge ★ 4.8(19) */}
            <div className="flex items-center gap-1 rounded-full bg-surface-dark/90 border border-primary/40 px-1.5 py-1 text-xs text-text-accent font-bold shrink-0">
              <span className="text-primary text-sm leading-none" aria-hidden="true">★</span>
              <span>4.8</span>
              <span className="text-text-secondary font-normal">(19)</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-mono">
            {nft.description && nft.description.length > 20
              ? nft.description
              : 'Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na Ethereum.'}
          </p>

          {/* Edition Selector */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-sm font-bold text-foreground">
              Edição:
            </span>
            <div className="flex items-center gap-2" role="group" aria-label="Selecione a edição">
              {MOBILE_EDITIONS.map((edition, idx) => {
                const isSelected = selectedEdition === edition && (edition !== '1/10' || idx === 1);
                return (
                  <button
                    key={`${edition}-${idx}`}
                    type="button"
                    onClick={() => onSelectEdition(edition)}
                    className={`h-[30px] px-3.5 rounded-[50%] text-xs font-mono transition-all cursor-pointer ${isSelected
                      ? 'border border-primary text-text-accent font-bold bg-primary/10 shadow-[0_0_12px_rgba(210,138,76,0.25)]'
                      : 'border border-border/60 text-text-secondary hover:text-foreground hover:border-primary/50 bg-surface-dark/40 font-normal'
                      }`}
                  >
                    {edition}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technical Sheet / Properties */}
          <div className="flex flex-col gap-2 pt-2 text-sm text-text-secondary font-mono border-t border-border/20">
            <p>
              <span className="text-text-secondary">ID do token: </span>
              <span className="text-secondary">{tokenIdFormatted}</span>
            </p>
            <p>
              <span className="text-text-secondary">Coleção: </span>
              <span className="text-secondary">{collectionName}</span>
            </p>
            <p>
              <span className="text-text-secondary">Atributos: </span>
              <span className="text-secondary">Óculos, Esmeralda, Raro</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="w-full  gap-3 mx-auto fixed bottom-0 bg-surface-card border-t rounded-t-[2rem] border-border/50 shadow-[0_-12px_32px_rgba(0,0,0,0.85)] px-5 pt-3.5 pb-6">
        <div className=" inset-x-0 z-40 max-w-[690px] mx-auto  flex flex-col gap-3 font-mono">
          {/* Top Line: Stepper + Price */}
          <div className="flex items-center justify-between">
            {/* Stepper */}
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-text-secondary font-mono">Qtd.</span>
              <button
                type="button"
                aria-label="Diminuir quantidade"
                onClick={onDecreaseQuantity}
                disabled={quantity <= 1 || isSoldOut}
                className="w-6 h-9 rounded-full bg-primary hover:bg-[#c27c3e] text-ink font-bold flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer text-sm shadow-base"
              >
                -
              </button>
              <span className="text-base font-bold text-foreground w-6 text-center font-mono">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                onClick={onIncreaseQuantity}
                disabled={quantity >= nft.availableEditions || isSoldOut}
                className="w-6 h-9 rounded-full bg-primary hover:bg-[#c27c3e] text-ink font-bold flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer text-base shadow-sm"
              >
                +
              </button>
            </div>

            {/* Price */}
            <span className="text-xl font-bold text-text-accent font-mono">
              {totalPrice}
            </span>
          </div>

          {/* Bottom Line: Buy Button + Circular Cart Button */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onBuyNow}
              disabled={isSoldOut || cartPending}
              className="flex-1 h-12 rounded-[24px] max-w-[260px] bg-primary hover:bg-[#c27c3e] text-ink font-bold text-base tracking-wide flex items-center justify-center shadow-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSoldOut ? 'Esgotado' : 'Comprar NFT'}
            </button>

            <button
              type="button"
              onClick={onAddToCart}
              disabled={isSoldOut || cartPending}
              aria-label="Adicionar ao carrinho"
              className="w-12 h-12 rounded-full bg-surface-dark border border-border/60 hover:border-primary/40  text-foreground hover:text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-lg disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.3334 6.80118L17.3897 12.7776C17.2182 13.9561 16.2745 14.7136 15.0736 14.7136H6.83828C5.72308 14.7136 4.69367 13.8719 4.5221 12.7776L3.49269 5.79108L3.23533 3.85506C3.14955 3.35001 2.72063 3.01331 2.12014 3.01331H1.51965C1.17651 3.01331 0.833374 2.6766 0.833374 2.3399C0.833374 2.0032 1.17651 1.6665 1.51965 1.6665H2.12014C3.32112 1.6665 4.35053 2.50825 4.43632 3.68671L4.60788 5.03351H16.7893C17.2182 5.03351 17.6471 5.20186 17.9045 5.53856C18.2476 5.87526 18.3334 6.38031 18.3334 6.80118Z" fill="#B39463" />
                <path d="M15.2451 18.3332C15.7189 18.3332 16.103 17.9563 16.103 17.4914C16.103 17.0265 15.7189 16.6497 15.2451 16.6497C14.7714 16.6497 14.3873 17.0265 14.3873 17.4914C14.3873 17.9563 14.7714 18.3332 15.2451 18.3332Z" fill="#B39463" />
                <path d="M6.66671 18.3332C7.14048 18.3332 7.52455 17.9563 7.52455 17.4914C7.52455 17.0265 7.14048 16.6497 6.66671 16.6497C6.19293 16.6497 5.80886 17.0265 5.80886 17.4914C5.80886 17.9563 6.19293 18.3332 6.66671 18.3332Z" fill="#B39463" />
              </svg>

            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
