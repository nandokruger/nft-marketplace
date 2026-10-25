import { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { queryKeys } from '@/lib/query-keys';
import { eth } from '@/lib/eth-math';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useIsDesktop } from '@/lib/use-media-query';
import { MobileNftDetail } from '@/components/nft-details/MobileNftDetail';
import { MobileNftDetailSkeleton } from '@/components/skeletons/MobileNftDetailSkeleton';
import { resolveAssetUrl } from '@/lib/assets';
import {
  SearchIcon,
  StarIcon,
  HeartIcon,
  LinkedInShareIcon,
  MailShareIcon,
  TwitterXIcon
} from '@/components/icons';
import type { Nft } from '@/contracts';

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailPage
});

// Mock related collection NFTs
const RELATED_COLLECTION_NFTS = [
  {
    id: 'nft-04',
    name: 'Cosmic Bloom #118',
    priceEth: '1.29',
    imageUrl: resolveAssetUrl('/assets/nfts/sage-nomad.png')
  },
  {
    id: 'nft-05',
    name: 'Violet Nomad #314',
    priceEth: '1.39',
    imageUrl: resolveAssetUrl('/assets/nfts/sage-nomad.png')
  },
  {
    id: 'nft-06',
    name: 'Ivory Baron #088',
    priceEth: '1.79',
    imageUrl: resolveAssetUrl('/assets/nfts/neon-vessel.png')
  },
  {
    id: 'nft-07',
    name: 'Golden Beat #207',
    priceEth: '0.99',
    imageUrl: resolveAssetUrl('/assets/nfts/golden-beat.png')
  },
  {
    id: 'nft-09',
    name: 'Golden Signal #160',
    priceEth: '0.39',
    imageUrl: resolveAssetUrl('/assets/nfts/golden-beat.png')
  }
];

const REVIEWS_DATA = [
  {
    id: 'rev-1',
    collector: 'CyberNomad',
    rating: 5,
    date: '18 de outubro, 2026',
    comment: 'Uma das melhores peças da coleção Kurio Apes. A resolução da arte desbloqueável é inacreditável!'
  },
  {
    id: 'rev-2',
    collector: 'Elena_V',
    rating: 5,
    date: '14 de outubro, 2026',
    comment: 'Procedência impecável na Ethereum. Transação rápida e confirmação no bloco em segundos.'
  },
  {
    id: 'rev-3',
    collector: 'CryptoWhale_88',
    rating: 5,
    date: '02 de outubro, 2026',
    comment: 'Arte icônica. Detalhes em esmeralda e iluminação impecáveis. Vale cada ETH.'
  }
];

function NftDetailPage() {
  const { nftId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const isDesktop = useIsDesktop();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedEdition, setSelectedEdition] = useState('1/50');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    data: nft,
    isLoading,
    isError,
    refetch
  } = useQuery<Nft>({
    queryKey: queryKeys.catalog.detail(nftId),
    queryFn: async () => {
      const res = await apiClient.get<Nft>(`/api/nfts/${nftId}`);
      return res.data;
    }
  });

  // Listen to Socket.IO real-time nft.updated events for this NFT
  useEffect(() => {
    const handleNftUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Nft>;
      const updated = customEvent.detail;
      if (updated && (updated.id === nft?.id || updated.id === nftId)) {
        const msg = `Atualização em tempo real: ${updated.name} agora está ${eth(updated.priceEth).format({ withSymbol: true })} (${updated.availableEditions} edições disponíveis)`;
        setFeedback(msg);
        window.dispatchEvent(new CustomEvent('kurio:announce', { detail: msg }));
        setTimeout(() => setFeedback(null), 4000);
      }
    };

    window.addEventListener('kurio:nft-updated', handleNftUpdated);
    return () => window.removeEventListener('kurio:nft-updated', handleNftUpdated);
  }, [nft?.id, nftId]);

  // Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async (qty: number) => {
      if (!nft) return;
      const res = await apiClient.post('/api/cart/items', { nftId: nft.id, quantity: qty });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private'] });
      setFeedback('✓ Adicionado ao carrinho com sucesso!');
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: () => {
      setFeedback('Falha ao adicionar ao carrinho.');
      setTimeout(() => setFeedback(null), 3000);
    }
  });

  // Favorite Mutation with Optimistic Update and Rollback
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!nft) return;
      const res = await apiClient.post<{ id: string; isFavorited: boolean; likesCount: number }>(
        `/api/nfts/${nft.id}/favorite`
      );
      return res.data;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.catalog.detail(nftId) });
      const previousNft = qc.getQueryData<Nft>(queryKeys.catalog.detail(nftId));

      if (previousNft) {
        const nextFavorited = !previousNft.isFavorited;
        const currentLikes = previousNft.likesCount ?? 19;
        const nextLikes = nextFavorited ? currentLikes + 1 : Math.max(0, currentLikes - 1);

        qc.setQueryData<Nft>(queryKeys.catalog.detail(nftId), {
          ...previousNft,
          isFavorited: nextFavorited,
          likesCount: nextLikes
        });
      }

      return { previousNft };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNft) {
        qc.setQueryData(queryKeys.catalog.detail(nftId), context.previousNft);
      }
      setFeedback('Falha ao atualizar favoritos. Tentando novamente...');
      setTimeout(() => setFeedback(null), 3000);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.catalog.detail(nftId) });
    }
  });

  const handleBuy = async () => {
    if (!nft) return;
    await addToCartMutation.mutateAsync(quantity);
  };

  const handleBuyNowMobile = async () => {
    if (!nft) return;
    await addToCartMutation.mutateAsync(quantity);
    navigate({ to: '/checkout' });
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: '/' });
    }
  };

  const handleShare = (platform: 'linkedin' | 'email' | 'twitter') => {
    const url = window.location.href;
    const title = `${nft?.name ?? 'NFT'} na Kurio`;

    if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard?.writeText(url);
      setFeedback('✓ Link copiado para a área de transferência!');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Zero CLS Skeleton Shimmer
  if (isLoading) {
    if (!isDesktop) {
      return <MobileNftDetailSkeleton />;
    }
    return (
      <div className="max-w-[1200px] mx-auto py-8 lg:py-12 px-4 sm:px-6 lg:px-0 flex flex-col gap-12 lg:gap-20">
        <div className="h-5 w-40 rounded skeleton-shimmer" />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          {/* Gallery Skeleton */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 lg:gap-7 items-center sm:items-start shrink-0">
            <div className="flex sm:flex-col gap-4">
              <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-[6px] skeleton-shimmer" />
              <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-[6px] skeleton-shimmer" />
              <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-[6px] skeleton-shimmer" />
              <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-[6px] skeleton-shimmer" />
            </div>
            <div className="w-[340px] h-[340px] sm:w-[444px] sm:h-[444px] rounded-[6px] skeleton-shimmer" />
          </div>

          {/* Details Skeleton */}
          <div className="w-full flex-1 flex flex-col gap-5">
            <div className="h-8 w-3/4 rounded skeleton-shimmer" />
            <div className="h-6 w-1/2 rounded skeleton-shimmer" />
            <div className="h-[1px] w-full bg-border" />
            <div className="h-4 w-28 rounded skeleton-shimmer" />
            <div className="h-16 w-full rounded skeleton-shimmer" />
            <div className="h-4 w-20 rounded skeleton-shimmer" />
            <div className="h-8 w-56 rounded skeleton-shimmer" />
            <div className="h-10 w-72 rounded skeleton-shimmer mt-2" />
            <div className="h-20 w-48 rounded skeleton-shimmer mt-2" />
          </div>
        </div>

        {/* Tabs & Related Skeleton */}
        <div className="flex flex-col gap-6">
          <div className="h-8 w-64 rounded skeleton-shimmer" />
          <div className="h-32 w-full rounded skeleton-shimmer" />
        </div>
      </div>
    );
  }

  // 404 Not Found State
  if (isError || !nft) {
    return (
      <div className="max-w-[600px] mx-auto py-24 px-4 text-center flex flex-col items-center gap-5">
        <span className="text-5xl text-text-coral" aria-hidden="true">⚠</span>
        <h1 className="text-3xl font-bold text-foreground">NFT não encontrado</h1>
        <p className="text-base text-text-secondary leading-relaxed">
          O NFT com identificador &quot;{nftId}&quot; não existe no catálogo ou ocorreu uma falha temporária de conexão.
        </p>
        <div className="flex gap-4 mt-2">
          <Button variant="default" onClick={() => refetch()} className="cursor-pointer font-bold">
            Tentar Novamente
          </Button>
          <Link to="/">
            <Button variant="outline" className="cursor-pointer font-bold">
              Voltar ao Catálogo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSoldOut = nft.availableEditions <= 0;
  const isFavorited = nft.isFavorited ?? false;
  const likesCount = nft.likesCount ?? 19;

  // 4 Gallery Images (main art + variations)
  const galleryImages = [
    nft.imageUrl,
    nft.imageUrl,
    nft.imageUrl,
    nft.imageUrl
  ];
  if (!isDesktop) {
    return (
      <>
        {/* Toast Feedback */}
        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-20 right-4 z-50 rounded-[6px] border border-primary bg-ink px-4 py-3 text-sm font-bold text-primary shadow-xl backdrop-blur animate-in fade-in motion-reduce:animate-none"
          >
            {feedback}
          </div>
        )}

        <MobileNftDetail
          nft={nft}
          selectedEdition={selectedEdition}
          onSelectEdition={setSelectedEdition}
          quantity={quantity}
          onIncreaseQuantity={() => setQuantity((q) => Math.min(nft.availableEditions, q + 1))}
          onDecreaseQuantity={() => setQuantity((q) => Math.max(1, q - 1))}
          isFavorited={isFavorited}
          onToggleFavorite={() => favoriteMutation.mutate()}
          favoritePending={favoriteMutation.isPending}
          onBuyNow={handleBuyNowMobile}
          onAddToCart={() => addToCartMutation.mutate(quantity)}
          cartPending={addToCartMutation.isPending}
          onBack={handleBack}
        />
      </>
    );
  }

  const activeImageUrl = galleryImages[selectedImageIndex] || nft.imageUrl;

  return (
    <div className="max-w-[1200px] mx-auto py-8 lg:py-12 px-4 sm:px-6 lg:px-0 flex flex-col gap-14 lg:gap-20">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-24 right-4 z-50 rounded-[6px] border border-primary bg-ink px-4 py-3 text-sm font-bold text-primary shadow-xl backdrop-blur animate-in fade-in"
        >
          {feedback}
        </div>
      )}

      {/* Top Section: Breadcrumb & Showcase (#70342:2770) */}
      <div className="flex flex-col gap-8">
        {/* Breadcrumb Navigation (#10:290) */}
        <nav aria-label="Breadcrumb" className="text-[15px] font-bold text-foreground flex items-center gap-2">
          <Link to="/" className="hover:text-primary transition-colors">
            Início
          </Link>
          <span className="text-text-secondary">/</span>
          <Link to="/" className="hover:text-primary transition-colors">
            Mercado
          </Link>
        </nav>

        {/* Main Product Details Flexbox (#70342:2764) */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">
          {/* LEFT: Gallery (4 Thumbnails + Main Image with Zoom) (#70363:239) */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 lg:gap-7 items-center sm:items-start shrink-0 w-full lg:w-auto">
            {/* 4 Thumbnails Stack (#70342:2682) */}
            <div
              className="flex sm:flex-col gap-4 overflow-x-auto pb-2 sm:pb-0 shrink-0 w-full sm:w-[100px] justify-center sm:justify-start"
              role="tablist"
              aria-label="Galeria de miniaturas da obra"
            >
              {galleryImages.map((img, idx) => {
                const isSelected = selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    role="tab"
                    aria-selected={isSelected}
                    aria-label={`Visualizar miniatura ${idx + 1}`}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-[98px] h-[98px] sm:w-[100px] sm:h-[100px] rounded-[6px] bg-surface-card p-0.5 transition-all cursor-pointer relative shrink-0 ${isSelected
                      ? 'border border-primary/30 '
                      : 'border border-border hover:border-primary/30'
                      }`}
                  >
                    <img
                      src={resolveAssetUrl(img)}
                      alt={`Miniatura ${idx + 1} de ${nft.name}`}
                      className="w-full h-full object-cover rounded-[4px]"
                    />
                  </button>
                );
              })}
            </div>

            {/* Main Image Showcase (#70342:2683, 444x444px, r6, inner r24) */}
            <div className="relative w-full max-w-[444px] aspect-square rounded-[6px] bg-surface-card p-4 sm:p-5 flex items-center justify-center shrink-0  shadow-lg">
              <img
                src={resolveAssetUrl(activeImageUrl)}
                alt={nft.name}
                className="w-full h-full object-cover rounded-[24px]"
              />

              {/* Zoom Trigger Button (#70410:3937, 30x30px) */}
              <button
                type="button"
                aria-label="Ampliar imagem da obra"
                onClick={() => setIsZoomOpen(true)}
                className="absolute top-4 right- sm:top-2 sm:right-5 w-[30px] h-[30px] rounded-full bg-surface-card border border-border flex items-center justify-center text-foreground hover:text-primary hover:border-primary/50 transition-colors cursor-pointer shadow-md"
              >
                <SearchIcon width={20} height={20} className="text-[#F5F1EB]" />
              </button>
            </div>
          </div>

          {/* RIGHT: NFT Information and Actions (#70342:2763) */}
          <div className="w-full flex-1 flex flex-col gap-2 sm:gap-3">
            {/* Title (#11:1132) */}
            <h1 className="text-2xl sm:text-[28px] font-bold text-foreground tracking-tight">
              {nft.name}
            </h1>

            {/* Price & Rating Row (#70342:2684) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[22px] font-bold text-text-accent font-mono">
                {eth(nft.priceEth).format({ withSymbol: true, locale: 'en-US' })}
              </span>

              <div className="flex items-center gap-1.5 text-xs sm:text-[15px] text-foreground">
                <div className="flex items-center gap-1 text-primary" aria-label="Avaliação 5 estrelas">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 fill-primary" />
                  ))}
                </div>
                <span>{likesCount} avaliações de colecionadores</span>
              </div>
            </div>

            {/* Hairline Divider (#11:1211) */}
            <div className="h-[1px] w-full bg-primary/30" />

            {/* Lore / Description (#70342:2687) */}
            <div className="flex flex-col gap-2">
              <h2 className="text-[15px] font-bold text-foreground">
                Sobre este NFT:
              </h2>
              <p className="text-sm sm:text-[14px] text-text-secondary leading-[24px]">
                {nft.description ||
                  'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.'}
              </p>
            </div>

            {/* Edition Selector (#70342:2696) */}
            <div className="flex flex-col gap-2">
              <span className="text-[15px] font-bold text-foreground">
                Edição:
              </span>
              <div className="flex items-center gap-2" role="group" aria-label="Selecione a edição">
                {['1/1', '1/10', '1/50', 'ABERTA'].map((edition) => {
                  const isSelected = selectedEdition === edition;
                  return (
                    <button
                      key={edition}
                      type="button"
                      onClick={() => setSelectedEdition(edition)}
                      className={`inline-flex items-center justify-center h-[28px] px-3.5 rounded-[50%] text-sm transition-all cursor-pointer ${isSelected
                        ? 'border border-primary text-text-accent font-medium'
                        : 'border border-border text-text-secondary hover:text-foreground font-normal'
                        }`}
                    >
                      {edition}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper & CTAs (#70342:2762) */}
            <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 pt-2">
              {/* Stepper (#70342:2700) */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isSoldOut}
                  className="w-[33px] h-[50px] lg:text-2xl rounded-full bg-primary text-ink font-bold flex items-center justify-center hover:bg-[#c27c3e] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="text-xl font-normal text-foreground w-6 text-center font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => setQuantity((q) => Math.min(nft.availableEditions, q + 1))}
                  disabled={quantity >= nft.availableEditions || isSoldOut}
                  className="w-[33px] h-[50px] lg:text-2xl rounded-full bg-primary text-ink font-bold flex items-center justify-center hover:bg-[#c27c3e] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className='flex flex-row items-center gap-2'>
                {/* Buy Now Button (#70342:2756) */}
                <Button
                  variant="default"
                  onClick={handleBuy}
                  disabled={isSoldOut || addToCartMutation.isPending}
                  aria-label="COMPRAR (+ Carrinho)"
                  className="w-[130px] h-[40px] rounded-[6px] bg-primary text-ink font-bold text-sm hover:bg-[#c27c3e] shadow-none cursor-pointer"
                >
                  {isSoldOut ? 'Esgotado' : 'COMPRAR'}
                </Button>

                {/* Favoritar Button with Optimistic Update (#70342:2757) */}
                <button
                  type="button"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={favoriteMutation.isPending}
                  className={`w-[130px] h-[40px] rounded-[6px] border border-primary flex items-center justify-center gap-2 text-sm font-medium transition-colors cursor-pointer ${isFavorited
                    ? 'bg-primary/20 text-text-accent'
                    : 'text-text-accent hover:bg-primary/10'
                    }`}
                  aria-label={isFavorited ? 'Favoritado' : 'Favoritar'}
                >
                  <HeartIcon
                    className={`w-6 h-6 ${isFavorited ? 'fill-primary text-primary' : 'text-primary'}`}
                    isFilled={isFavorited}
                  />
                  <span>{isFavorited ? 'Favoritado' : 'Favoritar'}</span>
                </button>
              </div>

            </div>

            {/* Metadata Rows (#70342:2761) */}
            <div className="flex flex-col gap-1.5 pt-1 text-xs sm:text-[15px] text-secondary">
              <p>ID do token: #{nft.id.replace('nft-', '00')}</p>
              <p>Coleção: {nft.collection}</p>
              <p>Atributos: Óculos, Esmeralda, Raro</p>

              {/* Social Share (#70342:2760) */}
              <div className="flex items-center gap-3 pt-2 text-foreground font-bold">
                <span className="text-xs sm:text-[15px]">Compartilhar este NFT:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Compartilhar no LinkedIn"
                    onClick={() => handleShare('linkedin')}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    <LinkedInShareIcon className="w-4 h-4 fill-current" />
                  </button>
                  <button
                    type="button"
                    aria-label="Compartilhar por e-mail"
                    onClick={() => handleShare('email')}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    <MailShareIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Compartilhar no Twitter / X"
                    onClick={() => handleShare('twitter')}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    <TwitterXIcon className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS SECTION: Detalhes do NFT vs Avaliações (#70342:2780) */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-8" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'details'}
              onClick={() => setActiveTab('details')}
              className={`relative pb-3 text-[17px] transition-colors cursor-pointer ${activeTab === 'details'
                ? 'text-text-accent font-bold'
                : 'text-foreground hover:text-primary font-normal'
                }`}
            >
              Detalhes do NFT
              {activeTab === 'details' && (
                <span className="absolute bottom-0 left-0 h-[3px] w-full bg-primary" />
              )}
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'reviews'}
              onClick={() => setActiveTab('reviews')}
              className={`relative pb-3 text-[17px] transition-colors cursor-pointer ${activeTab === 'reviews'
                ? 'text-text-accent font-bold'
                : 'text-foreground hover:text-primary font-normal'
                }`}
            >
              Avaliações de colecionadores ({likesCount})
              {activeTab === 'reviews' && (
                <span className="absolute bottom-0 left-0 h-[3px] w-full bg-primary" />
              )}
            </button>
          </div>

          <div className="h-[1px] w-full bg-primary/30" />
        </div>

        {/* Tab 1 Content: Detalhes do NFT (#70342:2774) */}
        {activeTab === 'details' ? (
          <div className="flex flex-col gap-4 text-[14px] leading-[24px]">
            <p className="text-text-secondary whitespace-pre-line">
              {nft.name} é uma obra digital 1/{nft.totalEditions} finalizada à mão da coleção {nft.collection}. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.
              {'\n\n'}
              A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.
            </p>

            <div className="flex flex-col gap-1 pt-2">
              <span className="font-bold text-foreground">Rede:</span>
              <span className="text-text-secondary">
                Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold text-foreground">Contrato:</span>
              <span className="text-text-secondary">
                Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-bold text-foreground">Direitos autorais:</span>
              <span className="text-text-secondary font-mono">
                0x7A42...19E8 • Contrato inteligente ERC-721 verificado.
              </span>
            </div>
          </div>
        ) : (
          /* Tab 2 Content: Avaliações de colecionadores */
          <div className="flex flex-col gap-4">
            {REVIEWS_DATA.map((rev) => (
              <div key={rev.id} className="rounded-[8px] bg-surface-card border border-border p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{rev.collector}</span>
                    <div className="flex text-primary">
                      {[...Array(rev.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary">{rev.date}</span>
                </div>
                <p className="text-sm text-foreground/90">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RELATED PRODUCTS: Mais desta coleção (#70364:239) */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-[17px] font-bold text-text-accent">
            Mais desta coleção
          </h2>
          <div className="h-[1px] w-full bg-primary/30" />
        </div>

        {/* 5 NFT Cards Horizontal Row (#70342:2799) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 justify-items-center">
          {RELATED_COLLECTION_NFTS.map((item) => (
            <Link
              key={item.id}
              to="/nft/$nftId"
              params={{ nftId: item.id }}
              className="w-full max-w-[219px] group flex flex-col gap-2 cursor-pointer"
            >
              <div className="w-full aspect-[219/255] bg-surface-card py-5 px-1 flex items-center justify-center border border-transparent   transition-all duration-200 shadow-sm">
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

      {/* Lightbox / Zoom Dialog */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-[800px] p-6 bg-surface-card border-border">
          <DialogTitle className="text-xl font-bold text-foreground">
            {nft.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            Visualização em alta resolução da obra digital.
          </DialogDescription>
          <div className="w-full aspect-square rounded-[16px] overflow-hidden mt-3 shadow-2xl">
            <img
              src={resolveAssetUrl(activeImageUrl)}
              alt={nft.name}
              className="w-full h-full object-cover"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}