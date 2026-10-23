import { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/axios';
import { eth } from '@/lib/eth-math';
import { Button } from '@/components/ui/button';
import { useAuthModal } from '@/context/AuthModalContext';
import { getSocket } from '@/lib/socket';
import { useIsDesktop } from '@/lib/use-media-query';
import { MobileCart } from '@/components/cart/MobileCart';
import { MobileCartSkeleton } from '@/components/skeletons/MobileCartSkeleton';
import { resolveAssetUrl } from '@/lib/assets';
import type { Cart, Nft, QuoteResponse } from '@/contracts';

export const Route = createFileRoute('/cart')({
  component: CartPage
});

const RELATED_NFTS = [
  {
    id: 'nft-04',
    name: 'Cosmic Bloom #118',
    priceEth: '1.29',
    imageUrl: resolveAssetUrl('/assets/nfts/sage-nomad.webp')
  },
  {
    id: 'nft-05',
    name: 'Violet Nomad #314',
    priceEth: '1.39',
    imageUrl: resolveAssetUrl('/assets/nfts/sage-nomad.webp')
  },
  {
    id: 'nft-06',
    name: 'Ivory Baron #088',
    priceEth: '1.79',
    imageUrl: resolveAssetUrl('/assets/nfts/neon-vessel.webp')
  },
  {
    id: 'nft-07',
    name: 'Golden Beat #207',
    priceEth: '0.99',
    imageUrl: resolveAssetUrl('/assets/nfts/golden-beat.webp')
  },
  {
    id: 'nft-09',
    name: 'Golden Signal #160',
    priceEth: '0.39',
    imageUrl: resolveAssetUrl('/assets/nfts/golden-beat.webp')
  }
];

function CartPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const qc = useQueryClient();
  const { openLogin } = useAuthModal();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [realtimeAlert, setRealtimeAlert] = useState<string | null>(null);
  const [blockCheckout, setBlockCheckout] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check user session
  useEffect(() => {
    const checkUser = () => {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      const user = window.localStorage.getItem(AUTH_USER_KEY);
      setIsAuthenticated(Boolean(token && user));
    };
    checkUser();
    window.addEventListener('kurio:auth-changed', checkUser);
    return () => window.removeEventListener('kurio:auth-changed', checkUser);
  }, []);

  // Fetch Cart Query
  const {
    data: cart,
    isLoading,
    isError,
    refetch
  } = useQuery<Cart>({
    queryKey: ['private', 'cart'],
    queryFn: async () => {
      const res = await apiClient.get<Cart>('/api/cart');
      return res.data;
    }
  });

  // Quote Mutation for validating stock, prices, fees
  const quoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<QuoteResponse>('/api/cart/quote');
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(['private', 'cart'], data.cart);
      if (data.warnings.length > 0) {
        setRealtimeAlert(data.warnings.join(' • '));
        if (data.hasStockIssue || data.hasPriceChange) {
          setBlockCheckout(true);
        }
      }
    }
  });

  // Socket.IO Realtime listener for nft.updated
  useEffect(() => {
    const handleNftUpdated = (updatedNft: Nft) => {
      if (!cart || cart.items.length === 0) return;
      const matched = cart.items.find((i) => i.nftId === updatedNft.id);
      if (matched) {
        setRealtimeAlert(
          `Atenção: O NFT "${updatedNft.name}" foi atualizado em tempo real (Preço: ${updatedNft.priceEth} ETH, Disponíveis: ${updatedNft.availableEditions}). Cotação recalculada.`
        );
        setBlockCheckout(true);
        // Automatically request fresh quote
        quoteMutation.mutate();
      }
    };

    // Listen on window custom event dispatched by socket coordinator
    const onWindowEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Nft>;
      if (customEvent.detail) {
        handleNftUpdated(customEvent.detail);
      }
    };
    window.addEventListener('kurio:nft-updated', onWindowEvent);

    // Also attach to socket instance directly if connected
    const socket = getSocket();
    if (socket) {
      socket.on('nft.updated', (event: { payload?: Nft }) => {
        if (event?.payload) handleNftUpdated(event.payload);
      });
    }

    return () => {
      window.removeEventListener('kurio:nft-updated', onWindowEvent);
      if (socket) {
        socket.off('nft.updated');
      }
    };
  }, [cart, quoteMutation]);

  // Update item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ nftId, quantity }: { nftId: string; quantity: number }) => {
      const res = await apiClient.patch(`/api/cart/items/${nftId}`, { quantity });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private', 'cart'] });
    }
  });

  // Remove item
  const removeItemMutation = useMutation({
    mutationFn: async (nftId: string) => {
      const res = await apiClient.delete(`/api/cart/items/${nftId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private', 'cart'] });
    }
  });

  // Clear entire cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete('/api/cart');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private', 'cart'] });
    }
  });

  // Apply Coupon
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiClient.post<Cart>('/api/cart/coupon', { code });
      return res.data;
    },
    onSuccess: () => {
      setCouponError(null);
      setCouponInput('');
      qc.invalidateQueries({ queryKey: ['private', 'cart'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setCouponError(err.response?.data?.message || 'Cupom inválido ou expirado.');
    }
  });

  // Remove Coupon
  const removeCouponMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete<Cart>('/api/cart/coupon');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private', 'cart'] });
    }
  });

  const handleCheckoutClick = () => {
    if (blockCheckout) {
      return;
    }
    if (!isAuthenticated) {
      openLogin('/checkout');
    } else {
      navigate({ to: '/checkout' });
    }
  };

  const handleAcknowledgeAlert = () => {
    setRealtimeAlert(null);
    setBlockCheckout(false);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: '/' });
    }
  };

  // Zero CLS Loading Skeleton
  if (isLoading) {
    if (!isDesktop) {
      return <MobileCartSkeleton />;
    }
    return (
      <div className="max-w-[1200px] mx-auto py-8 lg:py-12 px-4 sm:px-6 lg:px-0 flex flex-col gap-10">
        <div className="h-5 w-48 rounded skeleton-shimmer" />
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          <div className="w-full lg:w-2/3 flex flex-col gap-4">
            <div className="h-8 w-full rounded skeleton-shimmer" />
            <div className="h-24 w-full rounded-[6px] skeleton-shimmer" />
            <div className="h-24 w-full rounded-[6px] skeleton-shimmer" />
            <div className="h-24 w-full rounded-[6px] skeleton-shimmer" />
          </div>
          <div className="w-full lg:w-1/3 h-96 rounded-[8px] skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (isError || !cart) {
    return (
      <div className="max-w-[600px] mx-auto py-24 px-4 text-center flex flex-col items-center gap-4">
        <span className="text-4xl text-text-coral" aria-hidden="true">⚠</span>
        <h1 className="text-2xl font-bold text-foreground">Erro ao carregar o carrinho</h1>
        <p className="text-xs text-text-secondary">
          Não foi possível sincronizar os itens do seu carrinho no momento.
        </p>
        <Button variant="default" onClick={() => refetch()} className="cursor-pointer font-bold">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Mobile viewport (< 1024px)
  if (!isDesktop) {
    return (
      <MobileCart
        cart={cart}
        couponInput={couponInput}
        setCouponInput={setCouponInput}
        couponError={couponError}
        setCouponError={setCouponError}
        onApplyCoupon={(code) => applyCouponMutation.mutate(code)}
        onRemoveCoupon={() => removeCouponMutation.mutate()}
        couponPending={applyCouponMutation.isPending}
        onUpdateQuantity={(nftId, quantity) =>
          updateQuantityMutation.mutate({ nftId, quantity })
        }
        quantityPending={updateQuantityMutation.isPending}
        onRemoveItem={(nftId) => removeItemMutation.mutate(nftId)}
        removePending={removeItemMutation.isPending}
        onClearCart={() => clearCartMutation.mutate()}
        clearPending={clearCartMutation.isPending}
        onCheckout={handleCheckoutClick}
        blockCheckout={blockCheckout}
        quotePending={quoteMutation.isPending}
        isAuthenticated={isAuthenticated}
        realtimeAlert={realtimeAlert}
        onAcknowledgeAlert={handleAcknowledgeAlert}
        onBack={handleBack}
      />
    );
  }

  const isEmpty = cart.items.length === 0;

  return (
    <div className="max-w-[1200px] mx-auto py-8 lg:py-12 px-4 sm:px-6 lg:px-0 flex flex-col gap-14 lg:gap-6">
      {/* Real-time Socket.IO Alert Banner (#aria-live="polite") */}
      {realtimeAlert && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-[6px] border border-primary bg-surface-dark p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl text-primary" aria-hidden="true">⚡</span>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              {realtimeAlert}
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleAcknowledgeAlert}
            className="shrink-0 h-8 text-xs font-bold bg-primary text-ink hover:bg-[#c27c3e] cursor-pointer"
          >
            Entendido, atualizar
          </Button>
        </div>
      )}

      {/* Breadcrumb (#70342:3045) & Semantic Page Heading */}
      <nav aria-label="Breadcrumb" className="text-[15px] font-bold text-foreground flex items-center gap-2">
        <Link to="/" className="hover:text-primary transition-colors">
          Início
        </Link>
        <span className="text-text-secondary">/</span>
        <Link to="/" className="hover:text-primary transition-colors">
          Mercado
        </Link>
        <span className="text-text-secondary">/</span>
        <h1 aria-label="Carrinho de NFTs" className="inline text-[15px] font-bold text-text-secondary m-0 p-0 leading-normal">
          Carrinho
        </h1>
      </nav>

      {/* Main Cart Area */}
      {isEmpty ? (
        <div className="w-full rounded-[8px] border border-border/50 bg-surface-card p-12 sm:p-16 text-center flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold text-foreground">Seu carrinho está vazio</h2>
          <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
            Explore nossa galeria de artefatos raros e adicione itens para iniciar sua coleção digital.
          </p>
          <Link to="/" className="mt-2">
            <Button variant="default" size="lg" className="font-bold text-sm bg-primary text-ink hover:bg-[#c27c3e] cursor-pointer">
              Explorar Catálogo →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          {/* LEFT: Cart Items Table/List */}
          <div className="w-full lg:w-2/3 flex flex-col gap-4">
            {/* Table Header Row */}
            <div className="grid grid-cols-12 items-center text-xs sm:text-[15px] font-bold text-foreground border-b border-primary/30 pb-3 px-0">
              <span className="col-span-5">NFTs</span>
              <span className="col-span-2 text-center sm:text-left">Preço</span>
              <span className="col-span-2 text-center">Edições</span>
              <span className="col-span-2 text-center">Total</span>
            </div>

            {/* Items Rows */}
            <div className="flex flex-col gap-3" role="list" aria-label="Lista de NFTs no carrinho">
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

                return (
                  <div
                    key={item.nftId}
                    role="listitem"
                    className="grid grid-cols-12 items-center p-0 sm:p-0 rounded-[6px] bg-surface-card border border-border/60 hover:border-border transition-colors gap-1 sm:gap-2"
                  >
                    {/* Item Info (Col 1-5): Image + Name + Token ID */}
                    <div className="col-span-5 flex items-center gap-2 sm:gap-3 min-w-0">
                      <img
                        src={resolveAssetUrl(item.nft.imageUrl)}
                        alt={item.nft.name}
                        className="w-[44px] h-[44px] sm:w-[70px] sm:h-[70px] rounded-[6px] object-cover bg-surface-dark border border-border/80 shrink-0"
                      />
                      <div className="flex flex-col min-w-0 truncate">
                        <Link
                          to="/nft/$nftId"
                          params={{ nftId: item.nftId }}
                          className="text-xs sm:text-base font-bold text-foreground hover:text-text-accent transition-colors truncate block"
                        >
                          {item.nft.name}
                        </Link>
                        <span className="text-[10px] sm:text-xs text-text-secondary font-mono truncate">
                          ID do token: {tokenId}
                        </span>
                      </div>
                    </div>

                    {/* Unit Price (Col 6-7) */}
                    <div className="col-span-2 text-[11px] sm:text-[15px] text-text-secondary font-mono text-center sm:text-left truncate">
                      {eth(item.priceSnapshotEth).format({ withSymbol: true, locale: 'en-US' })}
                    </div>

                    {/* Quantity Stepper (Col 8-10) */}
                    <div className="col-span-2 flex items-center justify-center gap-1 sm:gap-2">
                      <button
                        type="button"
                        aria-label={`Diminuir quantidade de ${item.nft.name}`}
                        onClick={() =>
                          updateQuantityMutation.mutate({
                            nftId: item.nftId,
                            quantity: Math.max(1, item.quantity - 1)
                          })
                        }
                        disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                        className="w-[20px] h-[30px] sm:w-[20px] sm:h-[30px] rounded-full bg-primary text-ink font-bold text-[14px]  flex items-center justify-center hover:bg-[#c27c3e] disabled:opacity-30 transition-colors cursor-pointer shrink-0"
                      >
                        -
                      </button>
                      <span className="text-[11px] sm:text-[15px] font-mono font-medium text-foreground w-3.5 sm:w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Aumentar quantidade de ${item.nft.name}`}
                        onClick={() =>
                          updateQuantityMutation.mutate({
                            nftId: item.nftId,
                            quantity: Math.min(item.nft.availableEditions, item.quantity + 1)
                          })
                        }
                        disabled={item.quantity >= item.nft.availableEditions || updateQuantityMutation.isPending}
                        className="w-[20px] h-[30px] sm:w-[20px] sm:h-[30px] rounded-full bg-primary text-ink font-bold text-[14px]  flex items-center justify-center hover:bg-[#c27c3e] disabled:opacity-30 transition-colors cursor-pointer shrink-0"
                      >
                        +
                      </button>
                    </div>

                    {/* Total & Remove Trash (Col 11-12) */}
                    <div className="col-span-3 flex items-center justify-center gap-1 sm:gap-1">
                      <span className="text-[11px] sm:text-[15px] font-bold text-text-accent font-mono truncate">
                        {eth(itemTotalEth).format({ withSymbol: true, locale: 'en-US' })}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remover ${item.nft.name} do carrinho`}
                        onClick={() => removeItemMutation.mutate(item.nftId)}
                        disabled={removeItemMutation.isPending}
                        className="text-text-secondary flex ml-5 text-center hover:text-text-coral transition-colors p-1 cursor-pointer shrink-0"
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

            {/* Clear Cart Action */}
            {/* <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => clearCartMutation.mutate()}
                disabled={clearCartMutation.isPending}
                className="text-xs text-text-secondary hover:text-text-coral transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Limpar carrinho</span>
              </button>
            </div> */}
          </div>

          {/* RIGHT: Resumo da carteira (Order Summary Card) */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6 shrink-0">
            <div className="px-6 sm:px-7 flex flex-col gap-5 rounded-[8px] shadow-none">
              <h2 className="text-lg sm:text-[20px] leading-none font-bold text-foreground tracking-tight border-b border-primary/30 pb-3">
                Resumo da carteira
              </h2>

              {/* Promotional Coupon Input */}
              <div className="flex flex-col gap-2">
                <label htmlFor="coupon-input" className="text-xs text-foreground font-normal">
                  Código promocional
                </label>
                <div className="flex items-center">
                  <input
                    id="coupon-input"
                    type="text"
                    placeholder="Digite o código promocional..."
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError(null);
                    }}
                    aria-invalid={Boolean(couponError)}
                    aria-describedby={couponError ? 'coupon-error' : undefined}
                    className="w-full h-[40px] px-3 bg-[#140D0A] text-[#F5F1EB] antialiased text-xs bg-tr border border-border rounded-l-[6px] text-foreground placeholder:text-secondary/60 focus:outline-none focus:border-primary uppercase"
                  />
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => applyCouponMutation.mutate(couponInput.trim())}
                    disabled={!couponInput.trim() || applyCouponMutation.isPending}
                    className="h-[40px] px-5 rounded-none rounded-r-[6px] bg-primary text-ink font-bold text-xs hover:bg-[#c27c3e] cursor-pointer shadow-none shrink-0"
                  >
                    Aplicar
                  </Button>
                </div>

                {couponError && (
                  <span id="coupon-error" className="text-[11px] text-text-coral font-bold" role="alert">
                    {couponError}
                  </span>
                )}

                {/* Applied Coupon Badge */}
                {cart.couponCode && (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/40 rounded-[4px] p-2 mt-1">
                    <span className="text-xs font-bold text-text-accent">
                      Cupom {cart.couponCode} ({cart.discountPercentage}% OFF)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCouponMutation.mutate()}
                      className="text-xs text-text-coral hover:underline cursor-pointer"
                      aria-label="Remover cupom"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Financial Calculation List with Exact EthDecimal Arithmetic */}
              <div className="flex flex-col gap-3 pt-2 text-xs sm:text-[14px]">
                <div className="flex justify-between items-center text-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono text-foreground font-medium">
                    {eth(cart.subtotalEth).format({ withSymbol: true, locale: 'en-US' })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-foreground">
                  <span>Desconto do lançamento</span>
                  <span className="font-mono text-foreground font-medium">
                    {cart.discountEth && eth(cart.discountEth).gt('0')
                      ? `(-) ${eth(cart.discountEth).format({ withSymbol: true, locale: 'en-US' })}`
                      : '(-) 00.00'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center text-foreground">
                    <span>Taxa de rede</span>
                    <span className="font-mono text-foreground font-medium">
                      {eth(cart.networkFeeEth).format({ withSymbol: true, locale: 'en-US' })}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-accent text-right mt-0.5">
                    Taxa estimada
                  </span>
                </div>

                <div className="h-[1px] w-full bg-primary/10 my-1" />

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-base sm:text-[16px] font-bold text-foreground">
                    Total
                  </span>
                  <span className="text-xl sm:text-[22px] font-bold text-text-accent font-mono">
                    {eth(cart.totalEth).format({ withSymbol: true, locale: 'en-US' })}
                  </span>
                </div>
              </div>

              {/* Checkout Action CTA */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={handleCheckoutClick}
                  disabled={blockCheckout || quoteMutation.isPending}
                  className="w-full h-[45px] rounded-[6px] bg-primary text-ink font-bold text-base hover:bg-[#c27c3e] cursor-pointer shadow-none"
                >
                  {isAuthenticated ? 'Finalizar pedido' : 'Conectar e finalizar'}
                </Button>

                <Link
                  to="/"
                  className="text-base text-text-accent hover:underline text-center cursor-pointer font-normal"
                >
                  Continuar explorando
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Colecionadores também viram (#70364:239) */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-[17px] font-bold text-text-accent">
            Colecionadores também viram
          </h2>
          <div className="h-[1px] w-full bg-primary/30" />
        </div>

        {/* 5 NFT Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 justify-items-center">
          {RELATED_NFTS.map((item) => (
            <Link
              key={item.id}
              to="/nft/$nftId"
              params={{ nftId: item.id }}
              className="w-full max-w-[219px] group flex flex-col gap-2 cursor-pointer"
            >
              <div className="w-full aspect-[219/255] rounded-[8px] bg-surface-card p-3 flex items-center justify-center border border-transparent group-hover:border-primary/50 transition-all duration-200 shadow-sm">
                <img
                  src={resolveAssetUrl(item.imageUrl)}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-[11px] group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="flex flex-col px-1">
                <span className="text-[15px] text-foreground font-normal group-hover:text-text-accent transition-colors truncate">
                  {item.name}
                </span>
                <span className="text-[16px] text-text-accent font-bold font-mono">
                  {eth(item.priceEth).format({ withSymbol: true, locale: 'en-US' })}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Carousel Dots (#70364:240) */}
        <div className="flex items-center justify-center gap-2 pt-2" aria-hidden="true">
          <span className="w-3 h-3 rounded-full border border-primary" />
          <span className="w-3 h-3 rounded-full bg-primary" />
          <span className="w-3 h-3 rounded-full border border-primary" />
        </div>
      </div>
    </div>
  );
}
