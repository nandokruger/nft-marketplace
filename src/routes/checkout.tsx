import { useState, useEffect, useRef, useId } from 'react';
import { createFileRoute, useNavigate, useRouter, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Wallet as WalletIcon
} from 'lucide-react';
import { useIsDesktop } from '@/lib/use-media-query';
import { MobileCheckout } from '@/components/checkout/MobileCheckout';
import { MobileCheckoutSkeleton } from '@/components/skeletons/MobileCheckoutSkeleton';

import { apiClient, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/axios';
import { queryKeys } from '@/lib/query-keys';
import { eth } from '@/lib/eth-math';
import { resolveAssetUrl } from '@/lib/assets';
import { getSocket } from '@/lib/socket';
import { useAuthModal } from '@/context/AuthModalContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  WalletNetworkSchema,
  type Cart,
  type Wallet,
  type Order,
  type User,
  type Nft,
  type WalletNetwork,
  type QuoteResponse
} from '@/contracts';

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage
});

const DRAFT_STORAGE_KEY = 'kurio_checkout_collector_draft';

// Network Estimated Fees
const NETWORK_FEES: Record<WalletNetwork, string> = {
  'Ethereum Mainnet': '0.016',
  'Polygon': '0.002',
  'Arbitrum': '0.005'
};

const CollectorFormSchema = z.object({
  displayName: z.string().min(2, 'Nome de exibição é obrigatório'),
  username: z.string().min(2, 'Nome de usuário é obrigatório'),
  network: WalletNetworkSchema,
  profileName: z.string().min(2, 'Nome do perfil é obrigatório'),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço 0x da carteira inválido (40 hexadecimais)'),
  secondaryWalletOrEns: z.string().optional(),
  walletType: z.enum(['MetaMask', 'Coinbase Wallet', 'WalletConnect']),
  referralCode: z.string().min(1, 'Código de indicação é obrigatório'),
  email: z.string().email('E-mail inválido'),
  ensName: z.string().min(1, 'Nome ENS é obrigatório'),
  useOtherWallet: z.boolean(),
  notes: z.string().optional()
});

type CollectorFormData = z.infer<typeof CollectorFormSchema>;

function formatTokenId(nft: { id: string; name: string }): string {
  const match = nft.name.match(/#(\d+)/);
  if (match && match[1]) return `#${match[1].padStart(4, '0')}`;
  const num = nft.id.replace(/\D/g, '');
  return `#${num.padStart(4, '0')}`;
}

export const DEFAULT_CHECKOUT_WALLETS: Wallet[] = [
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

function CheckoutPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const qc = useQueryClient();
  const { openLogin } = useAuthModal();

  const [selectedMobileProvider, setSelectedMobileProvider] = useState<
    'WalletConnect' | 'MetaMask' | 'Coinbase Wallet'
  >('Coinbase Wallet');

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const userRaw = window.localStorage.getItem(AUTH_USER_KEY);
    if (token && userRaw) {
      try {
        return JSON.parse(userRaw);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [selectedWalletMethod, setSelectedWalletMethod] = useState<'all' | 'metamask' | 'coinbase'>('coinbase');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [realtimeAlert, setRealtimeAlert] = useState<string | null>(null);
  const [isPriceChangedBlocked, setIsPriceChangedBlocked] = useState<boolean>(false);
  const [isPromoOpen, setIsPromoOpen] = useState<boolean>(false);
  const [promoInput, setPromoInput] = useState<string>('');
  const [promoError, setPromoError] = useState<string | null>(null);

  // Persistent Idempotency Key across timeouts & retry attempts
  const idempotencyKeyRef = useRef<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `idem_${crypto.randomUUID()}`
      : `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );

  const errorIds = {
    displayName: useId(),
    username: useId(),
    network: useId(),
    profileName: useId(),
    walletAddress: useId(),
    walletType: useId(),
    referralCode: useId(),
    email: useId(),
    ensName: useId()
  };

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CollectorFormData>({
    resolver: zodResolver(CollectorFormSchema),
    defaultValues: {
      displayName: 'Colecionador Kurio',
      username: 'kurio_collector',
      network: 'Ethereum Mainnet',
      profileName: 'Perfil Principal',
      walletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
      secondaryWalletOrEns: '',
      walletType: 'Coinbase Wallet',
      referralCode: 'KURIO2026',
      email: 'collector@kurio.art',
      ensName: '.eth',
      useOtherWallet: false,
      notes: ''
    }
  });

  const selectedNetwork = watch('network') || 'Ethereum Mainnet';
  const watchUseOtherWallet = watch('useOtherWallet');

  // Load and save drafts in sessionStorage to preserve form inputs across login/reload
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            if (k === 'ensName' && !['.eth', '.crypto', '.xyz', '.id'].includes(v as string)) {
              setValue('ensName', '.eth');
            } else {
              setValue(k as keyof CollectorFormData, v as never);
            }
          }
        });
      }
    } catch {
      // Ignore parse error
    }
  }, [setValue]);

  // Persist form values whenever changed
  useEffect(() => {
    const subscription = watch((value) => {
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(value));
      } catch {
        // Ignore storage error
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Auth checking and listener
  useEffect(() => {
    const checkAuth = () => {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      const userRaw = window.localStorage.getItem(AUTH_USER_KEY);
      if (!token || !userRaw) {
        openLogin('/checkout');
        return;
      }
      try {
        const u = JSON.parse(userRaw);
        setCurrentUser(u);
        if (u.name) setValue('displayName', u.name);
        if (u.email) setValue('email', u.email);
        if (u.primaryWalletAddress) setValue('walletAddress', u.primaryWalletAddress);
      } catch {
        openLogin('/checkout');
      }
    };

    checkAuth();
    window.addEventListener('kurio:auth-changed', checkAuth);
    return () => window.removeEventListener('kurio:auth-changed', checkAuth);
  }, [openLogin, setValue]);

  // Fetch Cart (TanStack Query)
  const { data: cart, isLoading: isCartLoading } = useQuery<Cart>({
    queryKey: ['private', 'cart'],
    queryFn: async () => {
      const res = await apiClient.get<Cart>('/api/cart');
      return res.data;
    },
    enabled: Boolean(currentUser)
  });

  // Fetch Connected Wallets (TanStack Query)
  const { data: fetchedWallets, isLoading: isWalletsLoading } = useQuery<Wallet[]>({
    queryKey: currentUser ? queryKeys.user.wallets(currentUser.id) : ['private', 'wallets'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<Wallet[]>('/api/wallets');
        return res.data;
      } catch {
        return DEFAULT_CHECKOUT_WALLETS;
      }
    }
  });

  const wallets = fetchedWallets && fetchedWallets.length > 0 ? fetchedWallets : DEFAULT_CHECKOUT_WALLETS;

  // Synchronize wallet selection with form
  useEffect(() => {
    if (wallets.length > 0) {
      if (!selectedWalletId) {
        const defaultWallet =
          (!isDesktop ? wallets.find((w) => w.name.toLowerCase().includes('reserva')) : null) ||
          wallets.find((w) => w.isPrimary) ||
          wallets[0];
        if (defaultWallet) {
          setSelectedWalletId(defaultWallet.id);
          setValue('walletAddress', defaultWallet.address);
          setValue('network', defaultWallet.network);
        }
      }
    }
  }, [wallets, selectedWalletId, setValue]);

  // Revalidate Quote via POST /api/cart/quote on mount
  useEffect(() => {
    if (currentUser) {
      apiClient
        .post<QuoteResponse>('/api/cart/quote')
        .then((res) => {
          if (res.data.hasPriceChange || res.data.hasStockIssue) {
            setIsPriceChangedBlocked(true);
            setRealtimeAlert(
              res.data.warnings.join(' ') ||
              'Valores ou disponibilidade foram alterados. Por favor, revise os valores atualizados.'
            );
          }
        })
        .catch(() => {
          // MSW or network error handled quietly
        });
    }
  }, [currentUser]);

  // Real-time listener for Socket.IO nft.updated
  useEffect(() => {
    const socket = getSocket();

    const handleNftUpdated = (raw: unknown) => {
      const event = raw as { payload?: Nft } | Nft;
      const updatedNft = 'payload' in event && event.payload ? event.payload : (event as Nft);

      if (!updatedNft || !cart) return;

      const affectsCart = cart.items.some((item) => item.nftId === updatedNft.id);
      if (affectsCart) {
        setRealtimeAlert(
          `Aviso de Mercado em Tempo Real: O NFT "${updatedNft.name}" teve seu preço ou disponibilidade alterado para ${updatedNft.priceEth} ETH. A cotação do seu carrinho foi recalculada.`
        );
        setIsPriceChangedBlocked(true);

        // Revalidate quote immediately
        apiClient.post<QuoteResponse>('/api/cart/quote').then(() => {
          qc.invalidateQueries({ queryKey: ['private', 'cart'] });
        });
      }
    };

    if (socket) {
      socket.on('nft.updated', handleNftUpdated);
    }

    const handleCustomEvent = (e: Event) => {
      const ce = e as CustomEvent<Nft>;
      if (ce.detail) handleNftUpdated(ce.detail);
    };

    window.addEventListener('kurio:nft-updated', handleCustomEvent);

    return () => {
      if (socket) {
        socket.off('nft.updated', handleNftUpdated);
      }
      window.removeEventListener('kurio:nft-updated', handleCustomEvent);
    };
  }, [cart, qc]);

  // Re-quote / acknowledge alert mutation
  const acknowledgeQuoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<QuoteResponse>('/api/cart/quote');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private', 'cart'] });
      setRealtimeAlert(null);
      setIsPriceChangedBlocked(false);
    }
  });

  // Apply Coupon Mutation
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      setPromoError(null);
      const res = await apiClient.post<Cart>('/api/cart/coupon', { code });
      return res.data;
    },
    onSuccess: () => {
      setPromoError(null);
      setPromoInput('');
      qc.invalidateQueries({ queryKey: ['private', 'cart'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setPromoError(err.response?.data?.message || 'Cupom promocional inválido ou expirado.');
    }
  });

  // Checkout Mutation (POST /api/orders)
  const checkoutMutation = useMutation({
    mutationFn: async (formData: CollectorFormData) => {
      setCheckoutError(null);

      // 1. Pre-submission quote validation
      const quoteRes = await apiClient.post<QuoteResponse>('/api/cart/quote');
      if (quoteRes.data.hasPriceChange || quoteRes.data.hasStockIssue) {
        setIsPriceChangedBlocked(true);
        throw new Error(
          quoteRes.data.warnings[0] ||
          'O preço ou estoque de um item foi alterado. Revise os novos valores antes de confirmar.'
        );
      }

      // 2. Submit order with persistent Idempotency-Key
      const res = await apiClient.post<Order>(
        '/api/orders',
        {
          walletAddress: formData.walletAddress,
          network: formData.network,
          couponCode: cart?.couponCode || undefined
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKeyRef.current
          }
        }
      );
      return res.data;
    },
    onSuccess: (order) => {
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }
      qc.invalidateQueries({ queryKey: ['private'] });
      navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
    },
    onError: (err: { response?: { status?: number; data?: { message?: string } }; message?: string }) => {
      const msg = err.response?.data?.message || err.message || 'Falha ao processar o pedido. Tente novamente.';
      setCheckoutError(msg);
      qc.invalidateQueries({ queryKey: ['private', 'cart'] });
    }
  });

  const onSubmitForm = (data: CollectorFormData) => {
    if (isPriceChangedBlocked) {
      setRealtimeAlert('Por favor, revise e aceite as alterações de preço antes de confirmar a compra.');
      return;
    }
    checkoutMutation.mutate(data);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: '/cart' });
    }
  };

  // Zero CLS Shimmer Skeleton
  if (isCartLoading || isWalletsLoading) {
    if (!isDesktop) {
      return <MobileCheckoutSkeleton />;
    }
    return (
      <div className="max-w-[1200px] mx-auto py-8 sm:py-10 px-4 sm:px-8 flex flex-col gap-8">
        <div className="h-5 w-48 rounded skeleton-shimmer" />
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          <div className="w-full lg:flex-1 flex flex-col gap-6">
            <div className="h-6 w-56 rounded skeleton-shimmer" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 rounded-[6px] skeleton-shimmer" />
              ))}
            </div>
            <div className="h-32 rounded-[6px] skeleton-shimmer" />
          </div>
          <div className="w-full lg:w-[405px] flex flex-col gap-4">
            <div className="h-6 w-32 rounded skeleton-shimmer" />
            <div className="h-64 rounded-[8px] skeleton-shimmer" />
            <div className="h-36 rounded-[8px] skeleton-shimmer" />
            <div className="h-[45px] rounded-[6px] skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  // Empty cart redirect / feedback
  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-[600px] mx-auto py-24 px-4 text-center flex flex-col items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-surface-dark border border-border flex items-center justify-center text-text-secondary">
          <WalletIcon className="h-8 w-8 text-primary opacity-80" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Seu carrinho está vazio</h1>
        <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
          Você não possui nenhum NFT selecionado para pagamento. Explore nosso catálogo e adicione itens ao carrinho.
        </p>
        <Link to="/">
          <Button variant="default" className="mt-2 h-[42px] px-6 font-bold text-xs">
            Voltar ao Catálogo
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate dynamic network fee and final total
  const estimatedNetworkFeeEth = NETWORK_FEES[selectedNetwork] || '0.016';
  const effectiveTotalEth = eth(cart.subtotalEth)
    .sub(cart.discountEth)
    .add(estimatedNetworkFeeEth)
    .toString();

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const hasSufficientFunds = selectedWallet
    ? eth(selectedWallet.balanceEth).gte(effectiveTotalEth)
    : true;

  // Mobile layout (< 1024px)
  if (!isDesktop) {
    return (
      <MobileCheckout
        cart={cart}
        wallets={wallets}
        selectedWalletId={selectedWalletId}
        onSelectWallet={(wallet) => {
          setSelectedWalletId(wallet.id);
          setValue('walletAddress', wallet.address);
          setValue('network', wallet.network);
        }}
        selectedProvider={selectedMobileProvider}
        onSelectProvider={(p) => {
          setSelectedMobileProvider(p);
          setValue('walletType', p);
        }}
        totalEth={effectiveTotalEth}
        onConfirm={handleSubmit(onSubmitForm)}
        isConfirmPending={checkoutMutation.isPending}
        isPriceChangedBlocked={isPriceChangedBlocked}
        realtimeAlert={realtimeAlert}
        onAcknowledgeAlert={() => acknowledgeQuoteMutation.mutate()}
        checkoutError={checkoutError}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto py-8 sm:py-10 px-4 sm:px-8 flex flex-col gap-6 sm:gap-8 font-mono">
      {/* Top Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-[15px] font-bold">
        <Link to="/" className="text-foreground hover:text-primary transition-colors">
          Início
        </Link>
        <span className="text-text-secondary">/</span>
        <Link to="/" className="text-primary hover:underline pb-0.5 border-b-2 border-primary">
          Mercado
        </Link>
        <span className="text-text-secondary">/</span>
        <span className="text-foreground">Pagamento</span>
      </nav>

      {/* Real-time Alert (Assertive for screen readers & visual banner) */}
      {realtimeAlert && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-[6px] border border-primary bg-primary/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Aviso de Mercado em Tempo Real
              </span>
              <p className="text-xs text-foreground leading-relaxed">{realtimeAlert}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => acknowledgeQuoteMutation.mutate()}
            disabled={acknowledgeQuoteMutation.isPending}
            className="shrink-0 h-[36px] px-4 font-bold text-xs bg-primary text-ink hover:bg-[#c27c3e] cursor-pointer shadow-none"
          >
            {acknowledgeQuoteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Revisar e Aceitar Valores'
            )}
          </Button>
        </div>
      )}

      {/* Transaction / Timeout Error Feedback */}
      {checkoutError && (
        <div
          role="alert"
          className="rounded-[6px] border border-text-coral bg-text-coral/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in text-xs text-text-coral"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Falha no processamento da transação</p>
              <p className="text-[11px] opacity-90">{checkoutError}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSubmit(onSubmitForm)}
            disabled={checkoutMutation.isPending}
            className="shrink-0 border-text-coral text-text-coral hover:bg-text-coral/20 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <form
        onSubmit={handleSubmit(onSubmitForm)}
        noValidate
        className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-between w-full"
      >
        {/* LEFT COLUMN: Perfil do colecionador */}
        <section aria-labelledby="collector-profile-heading" className="w-full lg:flex-1 flex flex-col">
          <h1
            id="collector-profile-heading"
            className="text-base sm:text-[17px] font-bold text-foreground mb-3"
          >
            Perfil do colecionador
          </h1>

          {/* Form Two-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
            {/* ROW 1: Nome de exibição* | Nome de usuário* */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="displayName"
                className="text-xs sm:text-[14px] text-foreground font-normal flex items-center"
              >
                <span>Nome de exibição</span>
                <span className="text-text-coral ml-0.5">*</span>
              </label>
              <Input
                id="displayName"
                {...register('displayName')}
                error={Boolean(errors.displayName)}
                aria-invalid={Boolean(errors.displayName)}
                aria-describedby={errors.displayName ? errorIds.displayName : undefined}
                className="h-[40px] px-3.5 text-xs bg-transparent border-border rounded-[5px]"
              />
              {errors.displayName && (
                <span id={errorIds.displayName} className="text-[10px] text-text-coral" role="alert">
                  {errors.displayName.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-xs sm:text-[14px] text-foreground font-normal flex items-center"
              >
                <span>Nome de usuário</span>
                <span className="text-text-coral ml-0.5">*</span>
              </label>
              <Input
                id="username"
                {...register('username')}
                error={Boolean(errors.username)}
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? errorIds.username : undefined}
                className="h-[40px] px-3.5 text-xs bg-transparent border-border rounded-[5px]"
              />
              {errors.username && (
                <span id={errorIds.username} className="text-[10px] text-text-coral" role="alert">
                  {errors.username.message}
                </span>
              )}
            </div>

            {/* ROW 2: Rede * | Nome do perfil* */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="network-select"
                className="text-xs sm:text-[14px] text-foreground font-normal flex items-center"
              >
                <span>Rede </span>
                <span className="text-text-coral ml-0.5">*</span>
              </label>
              <Controller
                control={control}
                name="network"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val as WalletNetwork)}
                  >
                    <SelectTrigger
                      id="network-select"
                      error={Boolean(errors.network)}
                      className="h-[40px] px-3.5 text-xs bg-transparent border-border rounded-[5px]"
                    >
                      <SelectValue placeholder="Selecione uma rede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ethereum Mainnet">Ethereum Mainnet</SelectItem>
                      <SelectItem value="Polygon">Polygon</SelectItem>
                      <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.network && (
                <span id={errorIds.network} className="text-[10px] text-text-coral" role="alert">
                  {errors.network.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="profileName"
                className="text-xs sm:text-[14px] text-foreground font-normal flex items-center"
              >
                <span>Nome do perfil</span>
                <span className="text-text-coral ml-0.5">*</span>
              </label>
              <Input
                id="profileName"
                {...register('profileName')}
                error={Boolean(errors.profileName)}
                aria-invalid={Boolean(errors.profileName)}
                aria-describedby={errors.profileName ? errorIds.profileName : undefined}
                className="h-[40px] px-3.5 text-xs bg-transparent border-border rounded-[5px]"
              />
              {errors.profileName && (
                <span id={errorIds.profileName} className="text-[10px] text-text-coral" role="alert">
                  {errors.profileName.message}
                </span>
              )}
            </div>

            {/* ROW 3: Endereço da carteira* | ENS ou carteira secundária (opcional) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="walletAddress"
                className="text-xs sm:text-[14px] text-foreground font-normal flex items-center"
              >
                <span>Endereço da carteira</span>
                <span className="text-text-coral ml-0.5">*</span>
              </label>
              <Input
                id="walletAddress"
                placeholder="Endereço 0x da carteira"
                {...register('walletAddress')}
                error={Boolean(errors.walletAddress)}
                aria-invalid={Boolean(errors.walletAddress)}
                aria-describedby={errors.walletAddress ? errorIds.walletAddress : undefined}
                className="h-[40px] px-3.5 text-xs bg-transparent border-border rounded-[5px] font-mono"
              />
              {errors.walletAddress && (
                <span id={errorIds.walletAddress} className="text-[10px] text-text-coral" role="alert">
                  {errors.walletAddress.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="secondaryWalletOrEns"
                className="text-xs sm:text-[14px] text-text-secondary font-normal"
              >
                ENS ou carteira secundária (opcional)
              </label>
              <Input
                id="secondaryWalletOrEns"
                placeholder="ENS ou carteira secundária (opcional)"
                {...register('secondaryWalletOrEns')}
                className="h-[40px] px-3.5 text-xs bg-transparent border-border rounded-[5px] font-mono"
              />
            </div>

            {/* ROW 4: Tipo de carteira* | Código de indicação* */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="walletType-select"
                className="text-xs sm:text-[14px] text-foreground font-normal flex items-center"
              >
                <span>Tipo de carteira</span>
                <span className="text-text-coral ml-0.5">*</span>
              </label>
              <Controller
                control={control}
                name="walletType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      if (val === 'MetaMask') setSelectedWalletMethod('metamask');
                      else if (val === 'Coinbase Wallet') setSelectedWalletMethod('coinbase');
                      else setSelectedWalletMethod('all');
                    }}
                  >
                    <SelectTrigger
                      id="walletType-select"
                      error={Boolean(errors.walletType)}
                      className="h-[40px] px-3.5 text-xs bg-transparent border-border rounded-[5px]"
                    >
                      <SelectValue placeholder="Selecione uma carteira" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MetaMask">MetaMask</SelectItem>
                      <SelectItem value="Coinbase Wallet">Coinbase Wallet</SelectItem>
                      <SelectItem value="WalletConnect">WalletConnect</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.walletType && (
                <span id={errorIds.walletType} className="text-[10px] text-text-coral" role="alert">
                  {errors.walletType.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="referralCode"
                className="text-xs sm:text-[14px] text-foreground font-normal flex items-center"
              >
                <span>Código de indicação</span>
                <span className="text-text-coral ml-0.5">*</span>
              </label>
              <Input
                id="referralCode"
                {...register('referralCode')}
                error={Boolean(errors.referralCode)}
                aria-invalid={Boolean(errors.referralCode)}
                aria-describedby={errors.referralCode ? errorIds.referralCode : undefined}
                className="h-[40px] px-3.5 text-xs bg-transparent border-border rounded-[5px]"
              />
              {errors.referralCode && (
                <span id={errorIds.referralCode} className="text-[10px] text-text-coral" role="alert">
                  {errors.referralCode.message}
                </span>
              )}
            </div>

            {/* ROW 5: E-mail* | Nome ENS * */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs sm:text-[14px] text-foreground font-normal flex items-center"
              >
                <span>E-mail</span>
                <span className="text-text-coral ml-0.5">*</span>
              </label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                error={Boolean(errors.email)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? errorIds.email : undefined}
                className="h-[40px] px-3.5 text-xs bg-transparent border-border rounded-[5px]"
              />
              {errors.email && (
                <span id={errorIds.email} className="text-[10px] text-text-coral" role="alert">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                id="ensName-label"
                htmlFor="ensName-trigger"
                className="text-xs sm:text-[14px] text-foreground font-normal flex items-center"
              >
                <span>Nome ENS </span>
                <span className="text-text-coral ml-0.5">*</span>
              </label>
              <Controller
                control={control}
                name="ensName"
                render={({ field }) => (
                  <Select
                    value={field.value || '.eth'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="ensName-trigger"
                      aria-labelledby="ensName-label"
                      error={Boolean(errors.ensName)}
                      aria-invalid={Boolean(errors.ensName)}
                      aria-describedby={errors.ensName ? errorIds.ensName : undefined}
                      className="w-[78px] h-[40px] px-3 text-xs bg-transparent border-border rounded-[5px]"
                    >
                      <SelectValue placeholder=".eth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=".eth">.eth</SelectItem>
                      <SelectItem value=".crypto">.crypto</SelectItem>
                      <SelectItem value=".xyz">.xyz</SelectItem>
                      <SelectItem value=".id">.id</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ensName && (
                <span id={errorIds.ensName} className="text-[10px] text-text-coral" role="alert">
                  {errors.ensName.message}
                </span>
              )}
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex flex-col gap-4 mt-6">
            {/* Toggle: Usar outra carteira? */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group w-fit">
              <input
                type="checkbox"
                {...register('useOtherWallet')}
                className="sr-only"
              />
              <span
                className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${watchUseOtherWallet
                  ? 'border-primary bg-primary/20'
                  : 'border-border group-hover:border-border-soft'
                  }`}
              >
                {watchUseOtherWallet && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <span className="text-xs sm:text-[14px] text-foreground group-hover:text-primary transition-colors">
                Usar outra carteira?
              </span>
            </label>

            {/* Observação do colecionador (opcional) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="notes"
                className="text-xs sm:text-[14px] text-foreground font-normal"
              >
                Observação do colecionador (opcional)
              </label>
              <textarea
                id="notes"
                rows={5}

                {...register('notes')}
                className="w-[300px] h-[152px] p-3 text-xs bg-transparent border border-border rounded-[5px] text-foreground placeholder:text-text-secondary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none font-mono"
              />
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Seus NFTs & Resumo de Pagamento (w: 405px on desktop) */}
        <aside
          aria-labelledby="summary-heading"
          className="w-full lg:w-[405px] shrink-0 flex flex-col gap-5"
        >
          <div className="flex flex-col">
            <h2
              id="summary-heading"
              className="text-base sm:text-[17px] font-bold text-foreground mb-3"
            >
              Seus NFTs
            </h2>

            {/* Subheader: NFTs | Subtotal */}
            <div className="flex items-center justify-between text-xs text-foreground pb-2 border-b border-primary/30">
              <span>NFTs</span>
              <span>Subtotal</span>
            </div>

            {/* Items List */}
            <div className="flex flex-col divide-y divide-border/40" role="list" aria-label="NFTs no pedido">
              {cart.items.map((item) => {
                const itemTotal = eth(item.priceSnapshotEth).mulInt(item.quantity).toString();
                return (
                  <div
                    key={item.nftId}
                    role="listitem"
                    className="flex items-center justify-between gap-3 py-1 pr-4 bg-surface-card/30 mb-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 ">
                      <img
                        src={resolveAssetUrl(item.nft.imageUrl)}
                        alt={item.nft.name}
                        className="h-[70px] w-[70px] rounded-[6px] object-cover border border-border/50 shrink-0"
                      />
                      <div className="flex flex-col truncate">
                        <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {item.nft.name}
                        </span>
                        <span className="text-[11px] text-text-secondary mt-0.5">
                          ID do token: {formatTokenId(item.nft)} <span className="ml-1">(x {item.quantity})</span>
                        </span>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-mono font-bold text-primary shrink-0">
                      {itemTotal} ETH
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Promo Code Trigger */}
            <div className="pt-3 pb-1 border-t border-border/40">
              {!isPromoOpen ? (
                <button
                  type="button"
                  onClick={() => setIsPromoOpen(true)}
                  className="text-xs sm:text-[13px] text-foreground hover:text-primary transition-colors cursor-pointer text-left"
                >
                  Tem um código promocional? Aplique aqui
                </button>
              ) : (
                <div className="flex flex-col gap-2 animate-in fade-in">
                  <div className="flex items-center">
                    <Input
                      placeholder="Código do cupom..."
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="h-[36px] px-3 text-xs bg-surface-dark border-border rounded-l-[5px] rounded-r-none uppercase"
                    />
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => applyCouponMutation.mutate(promoInput.trim())}
                      disabled={!promoInput.trim() || applyCouponMutation.isPending}
                      className="h-[36px] px-4 font-bold text-xs bg-primary text-ink hover:bg-[#c27c3e] rounded-l-none rounded-r-[5px] shrink-0"
                    >
                      {applyCouponMutation.isPending ? 'Aplicando...' : 'Aplicar'}
                    </Button>
                  </div>
                  {promoError && (
                    <span className="text-[10px] text-text-coral" role="alert">
                      {promoError}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="flex flex-col gap-2.5 pt-3 text-xs">
              <div className="flex justify-between items-center text-foreground">
                <span>Subtotal</span>
                <span className="font-mono text-sm">{cart.subtotalEth} ETH</span>
              </div>

              <div className="flex justify-between items-center text-foreground">
                <span>Desconto do lançamento</span>
                <span className="font-mono text-xs">
                  {eth(cart.discountEth).gt('0')
                    ? `(-) ${eth(cart.discountEth).toString()}`
                    : '(-) 00.00'}
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center text-foreground">
                  <span>Taxa de rede</span>
                  <span className="font-mono text-xs">{estimatedNetworkFeeEth} ETH</span>
                </div>
                <span className="text-[10px] text-text-accent text-center mt-0.5">
                  Taxa estimada
                </span>
              </div>

              <div className="h-[1px] w-full bg-primary/30 my-1" />

              <div className="flex justify-between items-baseline pt-1 px-8">
                <span className="text-base font-bold text-foreground">Total</span>
                <span className="text-xl sm:text-[16px] font-bold text-text-accent font-mono">
                  {effectiveTotalEth} ETH
                </span>
              </div>
            </div>

            {/* Section: Carteira e rede */}
            <div className="flex flex-col gap-2.5 mt-5">
              <h3 className="text-sm sm:text-[15px] text-center font-normal text-foreground">
                Carteira e rede
              </h3>

              {/* Option 1: Multi-Provider Badge */}
              <div
                onClick={() => {
                  setSelectedWalletMethod('all');
                  setValue('walletType', 'WalletConnect');
                }}
                className={`h-[45px] px-3.5 rounded-[6px] border flex items-center gap-3 cursor-pointer transition-colors ${selectedWalletMethod === 'all'
                  ? 'border-primary bg-transparent'
                  : 'border-border bg-transparent hover:border-border-soft'
                  }`}
              >
                <span
                  className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selectedWalletMethod === 'all'
                    ? 'border-primary'
                    : 'border-border'
                    }`}
                >
                  {selectedWalletMethod === 'all' && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                <div className="text-[10px] sm:text-[11px] font-mono tracking-wider text-text-accent truncate bg-surface-dark px-3 py-1 rounded-[8px]">
                  METAMASK • WALLETCONNECT • COINBASE
                </div>
              </div>

              {/* Option 2: MetaMask */}
              <div
                onClick={() => {
                  setSelectedWalletMethod('metamask');
                  setValue('walletType', 'MetaMask');
                  const mw = wallets.find((w) => w.name.toLowerCase().includes('metamask'));
                  if (mw) {
                    setSelectedWalletId(mw.id);
                    setValue('walletAddress', mw.address);
                  }
                }}
                className={`h-[45px] px-3.5 rounded-[6px] border flex items-center gap-3 cursor-pointer transition-colors ${selectedWalletMethod === 'metamask'
                  ? 'border-primary bg-transparent'
                  : 'border-border bg-transparent hover:border-border-soft'
                  }`}
              >
                <span
                  className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selectedWalletMethod === 'metamask'
                    ? 'border-primary'
                    : 'border-border'
                    }`}
                >
                  {selectedWalletMethod === 'metamask' && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                <span className="text-xs sm:text-[14px] text-foreground">
                  MetaMask
                </span>
              </div>

              {/* Option 3: Coinbase Wallet (Selected by default in mockup) */}
              <div
                onClick={() => {
                  setSelectedWalletMethod('coinbase');
                  setValue('walletType', 'Coinbase Wallet');
                  const cw = wallets.find((w) => w.name.toLowerCase().includes('coinbase'));
                  if (cw) {
                    setSelectedWalletId(cw.id);
                    setValue('walletAddress', cw.address);
                  }
                }}
                className={`h-[45px] px-3.5 rounded-[6px] border flex items-center gap-3 cursor-pointer transition-colors ${selectedWalletMethod === 'coinbase'
                  ? 'border-primary bg-transparent'
                  : 'border-border bg-transparent hover:border-border-soft'
                  }`}
              >
                <span
                  className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selectedWalletMethod === 'coinbase'
                    ? 'border-primary'
                    : 'border-border'
                    }`}
                >
                  {selectedWalletMethod === 'coinbase' && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                <span className="text-xs sm:text-[14px] text-foreground">
                  Coinbase Wallet
                </span>
              </div>
            </div>

            {/* Insufficient funds warning if active */}
            {selectedWallet && !hasSufficientFunds && (
              <div
                role="alert"
                className="mt-3 p-3 rounded-[5px] border border-text-coral bg-text-coral/10 text-[11px] text-text-coral leading-tight"
              >
                Saldo insuficiente na carteira ({selectedWallet.balanceEth} ETH disponível, necessário {effectiveTotalEth} ETH).
              </div>
            )}

            {/* Confirm Purchase Primary CTA */}
            <Button
              type="submit"
              variant="default"
              disabled={
                checkoutMutation.isPending ||
                isPriceChangedBlocked ||
                (Boolean(selectedWallet) && !hasSufficientFunds)
              }
              className="w-full h-[45px] mt-4 rounded-[6px] bg-primary text-ink font-bold text-[15px] hover:bg-[#c27c3e] cursor-pointer shadow-none transition-colors"
            >
              {checkoutMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processando compra...</span>
                </div>
              ) : (
                'Confirmar compra'
              )}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}
