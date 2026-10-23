import { MoreVertical, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Wallet, Cart } from '@/contracts';

interface MobileCheckoutProps {
  cart: Cart;
  wallets: Wallet[];
  selectedWalletId: string;
  onSelectWallet: (wallet: Wallet) => void;
  selectedProvider: 'WalletConnect' | 'MetaMask' | 'Coinbase Wallet';
  onSelectProvider: (provider: 'WalletConnect' | 'MetaMask' | 'Coinbase Wallet') => void;
  totalEth: string;
  onConfirm: () => void;
  isConfirmPending: boolean;
  isPriceChangedBlocked: boolean;
  realtimeAlert: string | null;
  onAcknowledgeAlert: () => void;
  checkoutError: string | null;
  onBack: () => void;
}

const DEFAULT_FALLBACK_WALLETS: Wallet[] = [
  {
    id: 'wallet-1',
    userId: 'user_1',
    name: 'Reserva',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    network: 'Polygon',
    balanceEth: '50.0',
    isPrimary: false,
    connectedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'wallet-2',
    userId: 'user_1',
    name: 'Principal',
    address: '0xA91F56872D1E0C9B8A7F6E5D4C3B2A1F0EA8E82C',
    network: 'Ethereum Mainnet',
    balanceEth: '50.0',
    isPrimary: true,
    connectedAt: '2026-02-10T00:00:00.000Z'
  }
];

const PROVIDERS: {
  id: 'WalletConnect' | 'MetaMask' | 'Coinbase Wallet';
  name: string;
  type: 'letter' | 'icon';
  char?: string;
}[] = [
  { id: 'WalletConnect', name: 'WalletConnect', type: 'letter', char: 'W' },
  { id: 'MetaMask', name: 'MetaMask', type: 'letter', char: 'M' },
  { id: 'Coinbase Wallet', name: 'Coinbase Wallet', type: 'icon' }
];

export function MobileCheckout({
  wallets,
  selectedWalletId,
  onSelectWallet,
  selectedProvider,
  onSelectProvider,
  totalEth,
  onConfirm,
  isConfirmPending,
  isPriceChangedBlocked,
  realtimeAlert,
  onAcknowledgeAlert,
  checkoutError,
  onBack
}: MobileCheckoutProps) {
  const activeWallets = wallets && wallets.length > 0 ? wallets : DEFAULT_FALLBACK_WALLETS;

  return (
    <div className="w-full min-w-[390px] max-w-[480px] md:max-w-[768px] lg:max-w-[1024px] mx-auto min-h-screen flex flex-col font-mono text-foreground bg-ink relative pb-32 overflow-y-auto">
      {/* 1. Header Minimalista */}
      <header className="sticky top-0 z-30 w-full px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between bg-ink/95 backdrop-blur-md border-b border-white/5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full bg-[#2F1D15] border border-white/10 flex items-center justify-center text-foreground hover:bg-[#342820] cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12.9167 15.8332C12.9167 15.8332 7.08335 12.3798 7.08335 9.99984C7.08335 7.62067 12.9167 4.1665 12.9167 4.1665"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke="#CFB28C"
            />
          </svg>
        </button>

        <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground font-mono tracking-tight text-center flex-1">
          Pagamento com carteira
        </h1>

        <div className="w-10 h-10 shrink-0 opacity-0 pointer-events-none" aria-hidden="true" />
      </header>

      {/* Real-time Socket.IO Alert Banner (aria-live="assertive") */}
      {realtimeAlert && (
        <div
          role="alert"
          aria-live="assertive"
          className="mx-4 sm:mx-6 md:mx-8 mt-3 rounded-xl border border-primary bg-surface-dark p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xl animate-in fade-in"
        >
          <div className="flex items-start gap-2.5 flex-1">
            <span className="text-lg text-primary shrink-0" aria-hidden="true">
              ⚡
            </span>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-xs sm:text-sm font-bold text-primary">Aviso de Mercado em Tempo Real</span>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed">{realtimeAlert}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onAcknowledgeAlert}
            className="w-full sm:w-auto sm:px-5 h-8 text-xs font-bold bg-primary text-ink hover:bg-[#c27c3e] cursor-pointer shrink-0"
          >
            Revisar e Aceitar Valores
          </Button>
        </div>
      )}

      {/* Error feedback banner */}
      {checkoutError && (
        <div
          role="alert"
          className="mx-4 sm:mx-6 md:mx-8 mt-3 rounded-xl border border-text-coral bg-[#241612] p-3.5 flex items-center gap-2.5 text-xs sm:text-sm text-text-coral font-bold"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="px-4 sm:px-6 md:px-8 pt-4 flex flex-col gap-6 flex-1 w-full">
        {/* Sections Grid: 1 coluna no mobile (< 768px), 2 colunas no tablet/md (768px - 1024px) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start w-full">
          {/* 2. Secção "Carteira conectada" */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white font-mono">Carteira conectada</h2>
              <button
                type="button"
                onClick={() => {
                  if (activeWallets.length > 1) {
                    const nextWallet = activeWallets.find((w) => w.id !== selectedWalletId) || activeWallets[0];
                    if (nextWallet) onSelectWallet(nextWallet);
                  }
                }}
                className="text-xs font-mono font-medium text-[#C98A4B] hover:text-[#d89656] hover:underline cursor-pointer transition-colors"
              >
                Trocar carteira
              </button>
            </div>

            {/* Cartões de Carteira Guardada (Lista Selecionável) */}
            <div className="flex flex-col gap-3" role="radiogroup" aria-label="Carteiras conectadas">
              {[...activeWallets]
                .sort((a, b) => {
                  if (a.name.toLowerCase().includes('reserva')) return -1;
                  if (b.name.toLowerCase().includes('reserva')) return 1;
                  return 0;
                })
                .map((wallet) => {
                  const isSelected = selectedWalletId
                    ? selectedWalletId === wallet.id
                    : wallet.name.toLowerCase().includes('reserva');
                  const isReserva = wallet.name.toLowerCase().includes('reserva');
                  const displayAddressOrEns = isReserva ? 'nova.kurio.eth' : '0xA91F...E82C';
                  const displayNetworkName =
                    wallet.network === 'Polygon'
                      ? 'Rede Polygon'
                      : wallet.network === 'Ethereum Mainnet'
                        ? 'Rede principal Ethereum'
                        : `Rede ${wallet.network}`;

                  return (
                    <div
                      key={wallet.id}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${wallet.name} - ${displayAddressOrEns} - ${displayNetworkName}`}
                      tabIndex={0}
                      onClick={() => onSelectWallet(wallet)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          onSelectWallet(wallet);
                        }
                      }}
                      className={`w-full bg-[#1A120E] border rounded-2xl p-4 flex items-start justify-between gap-3 shadow-md cursor-pointer transition-all active:scale-[0.99] focus:outline-none focus:ring-1 focus:ring-primary ${
                        isSelected
                          ? 'border-[#C98A4B]/50 ring-1 ring-[#C98A4B]/30'
                          : 'border-[#2D241E] hover:border-white/10'
                      }`}
                    >
                      {/* Seletor estilo Radio Button estilizado à esquerda */}
                      <div className="pt-0.5 shrink-0">
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full border-2 border-[#C98A4B] flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-[#C98A4B]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-[#55321F]" />
                        )}
                      </div>

                      {/* Informações da Carteira */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="font-mono font-bold text-sm text-white">{wallet.name}</span>
                        <span className="font-mono text-xs text-[#A19791] mt-0.5 truncate">
                          {displayAddressOrEns}
                        </span>
                        <span className="font-mono text-xs text-[#8E857E] mt-0.5">{displayNetworkName}</span>
                      </div>

                      {/* Botão de menu contextual com três pontos verticais (⋮) */}
                      <button
                        type="button"
                        aria-label={`Opções da carteira ${wallet.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[#8E857E] hover:text-white transition-colors cursor-pointer shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* 3. Secção "Carteira e rede" */}
          <section className="flex flex-col gap-3 pt-1">
            <h2 className="text-sm font-bold text-white font-mono">Carteira e rede</h2>

            <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Provedores de carteira e rede">
              {PROVIDERS.map((provider) => {
                const isSelected = selectedProvider === provider.id;

                return (
                  <div
                    key={provider.id}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={provider.name}
                    tabIndex={0}
                    onClick={() => onSelectProvider(provider.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        onSelectProvider(provider.id);
                      }
                    }}
                    className={`w-full bg-[#1A120E] border rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md cursor-pointer transition-all active:scale-[0.99] focus:outline-none focus:ring-1 focus:ring-primary ${
                      isSelected ? 'border-[#C98A4B]/50 ring-1 ring-[#C98A4B]/20' : 'border-[#2D241E] hover:border-white/10'
                    }`}
                  >
                    {/* Ícone circular do provedor */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#271E18] border border-white/5 flex items-center justify-center text-[#C98A4B] font-mono font-bold text-[14px] shrink-0">
                        {provider.type === 'letter' ? (
                          <span>{provider.char}</span>
                        ) : (
                          <svg
                            width="21"
                            height="19"
                            viewBox="0 0 21 19"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M19.2071 11.7116H15.3204C13.9052 11.7116 12.7576 10.564 12.7576 9.14782C12.7576 7.73258 13.9052 6.58496 15.3204 6.58496H19.1766"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              stroke="#D28A4C"
                            />
                            <path
                              d="M15.7579 9.08898H15.4608"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              stroke="#D28A4C"
                            />
                            <path
                              d="M5.64209 5.1798H9.70209"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              stroke="#D28A4C"
                            />
                            <path
                              d="M0.75 9.28905C0.75 2.88429 3.07476 0.75 10.051 0.75C17.0262 0.75 19.351 2.88429 19.351 9.28905C19.351 15.6929 17.0262 17.8281 10.051 17.8281C3.07476 17.8281 0.75 15.6929 0.75 9.28905Z"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              stroke="#D28A4C"
                            />
                          </svg>
                        )}
                      </div>

                      <span className="font-mono text-sm text-foreground truncate">{provider.name}</span>
                    </div>

                    {/* Botão de rádio circular posicionado à direita */}
                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[#C98A4B] flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-[#C98A4B]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-[#55321F]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* 4. Ação Inferior: Total Financeiro + Botão Confirmar */}
        <div className="flex flex-col gap-3 pt-6 w-full">
          <div className="flex items-baseline justify-end gap-3">
            <span className="font-mono font-bold text-base text-white">Total:</span>
            <span className="font-mono font-bold text-xl sm:text-2xl text-[#C98A4B]">{totalEth} ETH</span>
          </div>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isConfirmPending || isPriceChangedBlocked}
            aria-label="Confirmar compra"
            className="w-full h-[54px] rounded-full bg-[#C98A4B] hover:bg-[#d89656] text-[#140D0A] font-mono font-bold text-base tracking-wide transition-all cursor-pointer shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isConfirmPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando compra...
              </span>
            ) : (
              'Confirmar compra'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
