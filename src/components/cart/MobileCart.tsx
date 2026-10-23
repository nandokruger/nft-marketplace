import { Link } from '@tanstack/react-router';
import { eth } from '@/lib/eth-math';
import { Button } from '@/components/ui/button';
import { resolveAssetUrl } from '@/lib/assets';
import type { Cart } from '@/contracts';

interface MobileCartProps {
  cart: Cart;
  couponInput: string;
  setCouponInput: (val: string) => void;
  couponError: string | null;
  setCouponError: (val: string | null) => void;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  couponPending: boolean;
  onUpdateQuantity: (nftId: string, quantity: number) => void;
  quantityPending: boolean;
  onRemoveItem: (nftId: string) => void;
  removePending: boolean;
  onClearCart?: () => void;
  clearPending?: boolean;
  onCheckout: () => void;
  blockCheckout: boolean;
  quotePending: boolean;
  isAuthenticated: boolean;
  realtimeAlert: string | null;
  onAcknowledgeAlert: () => void;
  onBack: () => void;
}

export function MobileCart({
  cart,
  couponInput,
  setCouponInput,
  couponError,
  setCouponError,
  onApplyCoupon,
  onRemoveCoupon,
  couponPending,
  onUpdateQuantity,
  quantityPending,
  onRemoveItem,
  removePending,
  onClearCart: _onClearCart,
  clearPending: _clearPending,
  onCheckout,
  blockCheckout,
  quotePending,
  isAuthenticated,
  realtimeAlert,
  onAcknowledgeAlert,
  onBack
}: MobileCartProps) {
  const isEmpty = cart.items.length === 0;

  return (
    <div className="w-full min-w-[390px] max-w-[1024px] mx-auto min-h-screen flex flex-col font-mono text-foreground bg-ink relative pb-6">
      {/* 1. Header Minimalista */}
      <header className="w-full px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between bg-ink/95 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full bg-[#2F1D15] border border-white/10 flex items-center justify-center text-foreground hover:bg-[#342820] cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.9167 15.8332C12.9167 15.8332 7.08335 12.3798 7.08335 9.99984C7.08335 7.62067 12.9167 4.1665 12.9167 4.1665" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#CFB28C" />
          </svg>

        </button>


        <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground font-mono tracking-tight text-center flex-1">
          Carrinho de NFTs
        </h1>

        <div className="w-10 h-10 shrink-0 opacity-0 pointer-events-none" aria-hidden="true" />
      </header>

      {/* Real-time Socket.IO Alert Banner (aria-live="polite") */}
      {realtimeAlert && (
        <div
          role="alert"
          aria-live="polite"
          className="mx-4 sm:mx-6 md:mx-8 mt-3 rounded-xl border border-primary bg-surface-dark p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xl animate-in fade-in"
        >
          <div className="flex items-start gap-2.5 flex-1">
            <span className="text-lg text-primary shrink-0" aria-hidden="true">
              ⚡
            </span>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed flex-1">
              {realtimeAlert}
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onAcknowledgeAlert}
            className="w-full sm:w-auto sm:px-5 h-8 text-xs font-bold bg-primary text-ink hover:bg-[#c27c3e] cursor-pointer shrink-0"
          >
            Entendido, atualizar
          </Button>
        </div>
      )}

      {/* 2. Main Content: Empty State ou Lista de Itens */}
      {isEmpty ? (
        <div className="flex-1 w-full px-6 py-20 flex flex-col items-center justify-center text-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">
            Seu carrinho está vazio
          </h2>
          <p className="text-xs sm:text-sm text-[#8E857E] max-w-[320px] leading-relaxed">
            Explore nossa galeria de artefatos raros e adicione itens para iniciar sua coleção digital.
          </p>
          <Link to="/" className="mt-4">
            <Button
              type="button"
              className="rounded-full px-6 py-2.5 sm:px-8 sm:py-3 bg-[#C98A4B] hover:bg-[#d89656] text-[#140D0A] font-mono font-bold text-xs sm:text-sm cursor-pointer shadow-md"
            >
              Explorar Catálogo →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start w-full px-4 sm:px-6 md:px-8 pt-3 flex-1 pb-[380px] md:pb-6">
          {/* Lista de Itens do Carrinho */}
          <div className="w-full md:flex-1 flex flex-col gap-3.5">
            <div
              className="flex flex-col gap-3.5"
              role="list"
              aria-label="Lista de NFTs no carrinho"
            >
              {cart.items.map((item) => {
                const itemTotalEth = eth(item.priceSnapshotEth).mulInt(item.quantity).toString();
                const tokenId =
                  item.nft.id === 'nft-01'
                    ? '#0042'
                    : item.nft.id === 'nft-05'
                      ? '#0009'
                      : item.nft.id === 'nft-06'
                        ? '#0552'
                        : `#${item.nft.id.replace('nft-', '00')}`;

                // Deriva a edição conforme os dados e o layout de referência
                const editionText =
                  item.nft.id === 'nft-01'
                    ? '1/50'
                    : item.nft.id === 'nft-05'
                      ? '1/1'
                      : item.nft.id === 'nft-06'
                        ? '1/10'
                        : item.nft.id === 'nft-07'
                          ? '1/50'
                          : `1/${item.nft.totalEditions || 50}`;

                // Identifica se atingiu o limite de edições ou estado especial do mockup (ex: card 3)
                const isMaxedOut =
                  item.quantity >= item.nft.availableEditions ||
                  (item.nft.id === 'nft-06' && item.quantity >= 2);

                return (
                  <div
                    key={item.nftId}
                    role="listitem"
                    className="bg-[#1C1714] border border-[#2D241E] rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-4 shadow-md hover:border-primary/40 transition-colors"
                  >
                    {/* Thumbnail da Arte */}
                    <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-xl overflow-hidden shrink-0 bg-surface-dark border border-white/5 relative">
                      <img
                        src={resolveAssetUrl(item.nft.imageUrl)}
                        alt={item.nft.name}
                        className="w-full h-full object-cover"
                        width={80}
                        height={80}
                        loading="lazy"
                      />
                    </div>

                    {/* Informações do Item */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                      <div className="flex flex-col min-w-0">
                        <Link
                          to="/nft/$nftId"
                          params={{ nftId: item.nftId }}
                          className="font-bold text-[13px] sm:text-[15px] leading-tight text-white hover:text-primary transition-colors truncate block"
                        >
                          {item.nft.name}
                        </Link>
                        <span className="sr-only">Token: {tokenId}</span>
                        <span className="text-[11px] sm:text-xs text-[#8E857E] font-medium leading-none mt-1">
                          Edição: {editionText}
                        </span>
                      </div>

                      <span className="text-[13px] sm:text-[15px] font-bold text-[#C98A4B] font-mono leading-tight mt-1.5">
                        {eth(itemTotalEth).format({ withSymbol: true, locale: 'en-US' })}
                      </span>
                    </div>

                    {/* Controle de Quantidade e Exclusão */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 self-center">
                      {/* Botão Decremento (-) */}
                      <button
                        type="button"
                        aria-label={`Diminuir quantidade de ${item.nft.name}`}
                        onClick={() =>
                          onUpdateQuantity(item.nftId, Math.max(1, item.quantity - 1))
                        }
                        disabled={quantityPending || item.quantity <= 1}
                        className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full bg-[#2F1D15] hover:bg-[#382B22] text-[#F5F1EB] flex items-center justify-center font-mono text-xs border border-white/5 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -
                      </button>

                      {/* Número da Quantidade */}
                      <span className="font-mono text-xs sm:text-sm font-medium text-foreground w-3.5 sm:w-5 text-center select-none">
                        {item.quantity}
                      </span>

                      {/* Botão Incremento (+) */}
                      <button
                        type="button"
                        aria-label={`Aumentar quantidade de ${item.nft.name}`}
                        onClick={() =>
                          onUpdateQuantity(
                            item.nftId,
                            Math.min(item.nft.availableEditions, item.quantity + 1)
                          )
                        }
                        disabled={quantityPending || isMaxedOut}
                        className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full bg-[#2F1D15] hover:bg-[#382B22] text-[#F5F1EB] flex items-center justify-center font-mono text-xs border border-white/5 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        +
                      </button>

                      {/* Botão de Exclusão (Lixeira) ao lado da quantidade */}
                      <button
                        type="button"
                        aria-label={`Remover ${item.nft.name} do carrinho`}
                        onClick={() => onRemoveItem(item.nftId)}
                        disabled={removePending}
                        className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] rounded-full bg-transparent text-[#C98A4B] hover:text-text-coral hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer hover:border-text-coral/50 active:scale-95 shrink-0"
                        title={`Remover ${item.nft.name} do carrinho`}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.8894 9.55409C18.8894 17.5731 20.0437 21.1979 12.2799 21.1979C4.51515 21.1979 5.69324 17.5731 5.69324 9.55409" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#B39463" />
                          <path d="M20.3653 6.47981H4.21484" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#B39463" />
                          <path d="M15.7148 6.47981C15.7148 6.47981 16.2434 2.7141 12.2891 2.7141C8.33578 2.7141 8.86435 6.47981 8.86435 6.47981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#B39463" />
                        </svg>

                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Card Inferior de Resumo Financeiro (Bottom Summary Card) */}
          <div className="w-full fixed bottom-0 inset-x-0 z-20 max-w-[1024px] mx-auto md:static md:sticky md:top-20 md:bottom-auto md:z-auto md:w-[340px] lg:w-[380px] shrink-0 rounded-t-[2.5rem] md:rounded-2xl bg-[#181310] border-t md:border border-[#3F2319]/40 p-5 sm:p-6 pt-6 sm:pt-7 md:p-6 flex flex-col gap-4 sm:gap-5 shadow-[0_-12px_32px_rgba(0,0,0,0.85)] md:shadow-2xl max-h-[85vh] overflow-y-auto md:max-h-none">
            {/* Campo de Cupom Promocional (Pílula) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center bg-[#1E1713] shadow-[0px_6px_20px_0px_#0A060473] border border-[#3F2319] rounded-full p-1 pl-4 focus-within:border-[#C98A4B] transition-colors">
                <input
                  id="coupon-input"
                  type="text"
                  placeholder="Digite o código promocional..."
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  aria-invalid={Boolean(couponError)}
                  aria-describedby={couponError ? 'coupon-error' : undefined}
                  className="bg-transparent text-xs text-foreground placeholder:text-[#8E857E] font-mono outline-none flex-1 min-w-0 pr-2"
                />
                <button
                  type="button"
                  onClick={() => onApplyCoupon(couponInput.trim())}
                  disabled={!couponInput.trim() || couponPending}
                  aria-label="Aplicar cupom promocional"
                  className="relative overflow-hidden rounded-full px-5 py-2.5 hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {/* Camada de fundo com gradiente e opacidade controlada */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(93.11deg,rgba(210,138,76,0.54)_-0.94%,#D28A4C_105.02%)] pointer-events-none"
                  />
                  <span className="relative z-10 text-white font-mono font-medium text-sm tracking-wide">
                    {couponPending ? 'Aplicando...' : 'Aplicar'}
                  </span>
                </button>
              </div>

              {couponError && (
                <span
                  id="coupon-error"
                  role="alert"
                  className="text-[11px] text-text-coral font-bold px-3 pt-0.5"
                >
                  {couponError}
                </span>
              )}

              {/* Tag de Cupom Ativo com Remoção */}
              {cart.couponCode && (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mt-1">
                  <span className="text-xs font-bold text-text-accent font-mono">
                    Cupom {cart.couponCode} ({cart.discountPercentage}% OFF)
                  </span>
                  <button
                    type="button"
                    onClick={onRemoveCoupon}
                    aria-label="Remover cupom"
                    className="text-xs text-text-coral hover:text-white font-bold p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Linhas do Demonstrativo de Valores (Aritmética exata BigInt) */}
            <div className="flex flex-col gap-2.5 pt-1 text-xs">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-[#F5F1EB]">
                <span>Subtotal</span>
                <span className="font-mono text-foreground font-medium">
                  {eth(cart.subtotalEth).format({ withSymbol: true, locale: 'en-US' })}
                </span>
              </div>

              {/* Desconto do lançamento */}
              <div className="flex justify-between items-center text-[#F5F1EB]">
                <span>Desconto do lançamento</span>
                <span className="font-mono text-foreground font-medium">
                  {cart.discountEth && eth(cart.discountEth).gt('0')
                    ? `(-) ${eth(cart.discountEth).format({ withSymbol: true, locale: 'en-US' })}`
                    : '(-) 00.00'}
                </span>
              </div>

              {/* Taxa de rede */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center text-[#F5F1EB]">
                  <span>Taxa de rede</span>
                  <span className="font-mono text-foreground font-medium">
                    {eth(cart.networkFeeEth).format({ withSymbol: true, locale: 'en-US' })}
                  </span>
                </div>
                <span className="text-[11px] text-[#C98A4B] text-right font-mono mt-0.5">
                  Taxa estimada
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
                <span className="text-base font-bold text-white font-mono">
                  Total
                </span>
                <span className="text-[19px] font-bold text-[#C98A4B] font-mono">
                  {eth(cart.totalEth).format({ withSymbol: true, locale: 'en-US' })}
                </span>
              </div>
            </div>

            {/* Botão de Ação Primário (CTA) */}
            <div className="flex flex-col items-center gap-3 pt-1">
              <Button
                type="button"
                onClick={onCheckout}
                disabled={blockCheckout || quotePending}
                className="w-full h-[52px] rounded-full bg-[#C98A4B] hover:bg-[#d89656] text-[#140D0A] font-mono font-bold text-sm tracking-wide transition-colors cursor-pointer shadow-lg active:scale-[0.99]"
              >
                {isAuthenticated ? 'Finalizar pedido' : 'Conectar e finalizar'}
              </Button>

              {/* <Link
                to="/"
                className="text-xs text-[#8E857E] hover:text-text-accent text-center font-mono transition-colors"
              >
                Continuar explorando
              </Link> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
