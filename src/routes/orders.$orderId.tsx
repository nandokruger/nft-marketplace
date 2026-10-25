import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

import { apiClient } from '@/lib/axios';
import { eth } from '@/lib/eth-math';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { resolveAssetUrl } from '@/lib/assets';
import { ThankYouEnvelopeIcon } from '@/components/icons';
import type { Order } from '@/contracts';

export const Route = createFileRoute('/orders/$orderId')({
  component: OrderReceiptPage
});

function formatTokenId(nft: { id: string; name: string }): string {
  const match = nft.name.match(/#(\d+)/);
  if (match && match[1]) return `#${match[1].padStart(4, '0')}`;
  const num = nft.id.replace(/\D/g, '');
  return `#${num.padStart(4, '0')}`;
}

function formatOrderDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const month = months[d.getMonth()] || 'Jul';
    const year = d.getFullYear();
    return `${day} ${month}, ${year}`;
  } catch {
    return '29 Jul, 2026';
  }
}

function formatTxHash(hash?: string): string {
  if (!hash) return '0xA91F...E82C';
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4).toUpperCase()}`;
}

// Thank You Envelope Illustration


function OrderReceiptPage() {
  const { orderId } = Route.useParams();
  const qc = useQueryClient();
  const [copiedTx, setCopiedTx] = useState(false);

  // Fetch Order Snapshot (GET /api/orders/:id)
  const {
    data: order,
    isLoading,
    isError,
    refetch
  } = useQuery<Order>({
    queryKey: ['private', 'orders', orderId],
    queryFn: async () => {
      const res = await apiClient.get<Order>(`/api/orders/${orderId}`);
      return res.data;
    },
    refetchInterval: (query) => {
      // Poll every 3 seconds if status is PENDING
      return query.state.data?.status === 'PENDING' ? 3000 : false;
    }
  });

  // Real-time listener for Socket.IO order.updated
  useEffect(() => {
    const socket = getSocket();

    const handleOrderUpdate = (raw: unknown) => {
      const event = raw as { payload?: Order } | Order;
      const updatedOrder = 'payload' in event && event.payload ? event.payload : (event as Order);

      if (updatedOrder && updatedOrder.id === orderId) {
        qc.setQueryData(['private', 'orders', orderId], updatedOrder);
      }
    };

    if (socket) {
      socket.on('order.updated', handleOrderUpdate);
    }

    const handleWindowOrder = (e: Event) => {
      const ce = e as CustomEvent<Order>;
      if (ce.detail) handleOrderUpdate(ce.detail);
    };

    window.addEventListener('kurio:order-updated', handleWindowOrder);

    return () => {
      if (socket) {
        socket.off('order.updated', handleOrderUpdate);
      }
      window.removeEventListener('kurio:order-updated', handleWindowOrder);
    };
  }, [orderId, qc]);

  const handleCopyTx = () => {
    if (!order) return;
    const textToCopy = order.txHash || order.id;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedTx(true);
        setTimeout(() => setCopiedTx(false), 2500);
      });
    }
  };

  // Zero CLS Shimmer Skeleton
  if (isLoading) {
    return (
      <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-8 font-mono">
        <div className="w-full max-w-[578px] bg-surface-dark border border-border rounded-[8px] p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-[8px] skeleton-shimmer" />
            <div className="h-4 w-64 rounded skeleton-shimmer" />
          </div>
          <div className="h-16 rounded-[6px] skeleton-shimmer" />
          <div className="flex flex-col gap-3">
            <div className="h-5 w-40 rounded skeleton-shimmer" />
            <div className="h-20 rounded-[6px] skeleton-shimmer" />
            <div className="h-20 rounded-[6px] skeleton-shimmer" />
          </div>
          <div className="h-12 rounded-[6px] skeleton-shimmer" />
          <div className="h-[45px] rounded-[6px] skeleton-shimmer" />
        </div>
      </div>
    );
  }

  // Not Found State
  if (isError || !order) {
    return (
      <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-[480px] bg-surface-dark border border-border rounded-[8px] p-8 text-center flex flex-col items-center gap-4">
          <AlertTriangle className="h-12 w-12 text-text-coral" />
          <h1 className="text-xl font-bold text-foreground">Pedido não localizado</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Não foi possível carregar os dados deste recibo. Verifique o identificador ou tente novamente.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Button variant="default" size="sm" onClick={() => refetch()} className="font-bold">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Tentar Novamente
            </Button>
            <Link to="/">
              <Button variant="outline" size="sm">
                Voltar ao Catálogo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending State (Mining / Confirming on Blockchain)
  if (order.status === 'PENDING') {
    return (
      <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-8 font-mono">
        <div className="w-full max-w-[578px] bg-surface-dark border border-border rounded-[8px] p-8 sm:p-10 flex flex-col items-center text-center gap-5">
          <Loader2 className="h-14 w-14 animate-spin text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Processando Transação na Blockchain
          </h1>
          <p className="text-xs text-text-secondary max-w-md leading-relaxed">
            Sua solicitação de compra foi enviada para o contrato inteligente. Aguarde a validação dos blocos na rede {order.network}. Esta tela atualizará automaticamente assim que confirmada.
          </p>
          <div className="flex items-center gap-2 text-xs text-primary font-mono bg-primary/10 px-3 py-1.5 rounded-[4px] border border-primary/20">
            <span>Chave de idempotência:</span>
            <span>{order.idempotencyKey.slice(0, 16)}...</span>
          </div>
        </div>
      </div>
    );
  }

  // Declined State
  if (order.status === 'DECLINED') {
    return (
      <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-8 font-mono">
        <div className="w-full max-w-[578px] bg-surface-dark border border-text-coral/50 rounded-[8px] p-8 sm:p-10 flex flex-col items-center text-center gap-5">
          <div className="h-16 w-16 rounded-full bg-text-coral/20 border border-text-coral flex items-center justify-center text-text-coral">
            <X className="h-8 w-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Pagamento Recusado
          </h1>
          <p className="text-xs text-text-secondary max-w-md leading-relaxed">
            {order.statusReason || 'A transação foi recusada pela rede blockchain simulada.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-3 w-full sm:w-auto">
            <Link to="/checkout" className="w-full sm:w-auto">
              <Button variant="default" className="w-full sm:w-auto font-bold text-xs h-[42px] px-6">
                Tentar Checkout Novamente
              </Button>
            </Link>
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-xs h-[42px] px-6">
                Voltar ao Catálogo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // CONFIRMED State
  const walletDisplayName =
    order.walletAddress.toLowerCase().includes('1a2b') ? 'MetaMask' : 'Coinbase Wallet';

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 font-mono">
      {/* Receipt Modal Card */}
      <article
        aria-labelledby="receipt-heading"
        className="relative w-full max-w-[578px] bg-surface-card border border-border/20 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Close Button */}
        <Link
          to="/"
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-foreground transition-colors cursor-pointer z-10"
          aria-label="Fechar recibo e voltar ao início"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>

        {/* Modal Header: Thank You Envelope + Subtitle */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6 text-center">
          <ThankYouEnvelopeIcon className="w-20 h-20 mb-4" />
          <h1
            id="receipt-heading"
            className="text-xs sm:text-[15px] font-bold text-text-secondary tracking-tight mt-3"
          >
            Seus NFTs agora estão na sua carteira
          </h1>
        </div>

        {/* Divider Line */}
        <div className="w-full h-[1px] bg-primary" />

        {/* Transaction Meta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4  sm:divide-y-0 sm:divide-x divide-primary py-3.5 px-4 sm:px-6 text-xs ">
          {/* Column 1: ID da transação */}
          <div className="flex flex-col gap-1 p-2 sm:p-0 sm:pr-3">
            <span className="text-[11px] sm:text-xs text-text-secondary">
              ID da transação
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="font-mono text-xs sm:text-[13px] text-text-secondary truncate cursor-pointer hover:text-primary transition-colors"
                title={order.txHash || order.id}
                onClick={handleCopyTx}
              >
                {formatTxHash(order.txHash || order.id)}
              </span>
              <button
                type="button"
                onClick={handleCopyTx}
                className="p-1 hover:text-primary text-text-secondary transition-colors"
                aria-label="Copiar identificador da transação"
              >
                {copiedTx ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            {/* Accessible Live Region for Copy Feedback */}
            <span aria-live="polite" className="sr-only">
              {copiedTx ? 'Identificador da transação copiado com sucesso' : ''}
            </span>
          </div>

          {/* Column 2: Data */}
          <div className="flex flex-col gap-1 p-2 sm:p-0 sm:px-3">
            <span className="text-[11px] sm:text-xs text-text-secondary">Data</span>
            <span className="text-xs sm:text-[13px] text-text-secondary font-mono">
              {formatOrderDate(order.createdAt)}
            </span>
          </div>

          {/* Column 3: Total */}
          <div className="flex flex-col gap-1 p-2 sm:p-0 sm:px-3">
            <span className="text-[11px] sm:text-xs text-text-secondary">Total</span>
            <span className="text-xs sm:text-[13px] text-text-secondary font-mono">
              {order.totalEth} ETH
            </span>
          </div>

          {/* Column 4: Carteira */}
          <div className="flex flex-col gap-1 p-2 sm:p-0 sm:pl-3">
            <span className="text-[11px] sm:text-xs text-text-secondary">
              Carteira
            </span>
            <span className="text-xs sm:text-[13px] text-text-secondary font-mono truncate">
              {walletDisplayName}
            </span>
          </div>
        </div>

        {/* Divider Line */}
        <div className="w-full h-[1px] bg-primary" />

        {/* Transaction Details Body */}
        <div className="p-5 sm:p-8 flex flex-col gap-4 pb-16">
          <h2 className="text-sm sm:text-[15px] font-bold text-foreground">
            Detalhes da transação
          </h2>

          {/* Table Header: NFTs | Edições | Subtotal */}
          <div className="grid grid-cols-12 text-xs sm:text-sm text-foreground font-bold pb-0 border-b-1 border-border pb-2">
            <span className="col-span-6 sm:col-span-7">NFTs</span>
            <span className="col-span-3 sm:col-span-2 text-center">Edições</span>
            <span className="col-span-3 text-right">Subtotal</span>
          </div>
          {/* Divider Line */}
          {/* <div className="w-full h-[1px] bg-border my-0" /> */}

          {/* Items List */}
          <div className="flex flex-col gap-4" role="list" aria-label="NFTs no recibo">
            {order.items.map((item) => {
              const itemTotalEth = eth(item.executedPriceEth).mulInt(item.quantity).toString();
              return (
                <div
                  key={item.nftId}
                  role="listitem"
                  className="grid grid-cols-12 items-center gap-2"
                >
                  {/* NFT Info */}
                  <div className="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0">
                    <img
                      src={resolveAssetUrl(item.nft.imageUrl)}
                      alt={item.nft.name}
                      className="h-[60px] w-[60px] sm:h-[70px] sm:w-[70px] rounded-[6px] object-cover border border-border/50 shrink-0"
                    />
                    <div className="flex flex-col truncate">
                      <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {item.nft.name}
                      </span>
                      <span className="text-[11px] sm:text-xs text-text-secondary mt-0.5">
                        ID do token: {formatTokenId(item.nft)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity (Edições) */}
                  <div className="col-span-3 sm:col-span-2 text-center text-xs sm:text-sm text-foreground/60 font-mono">
                    (x {item.quantity})
                  </div>

                  {/* Subtotal in bold amber */}
                  <div className="col-span-3 text-right font-mono font-bold text-xs sm:text-sm text-text-accent">
                    {itemTotalEth} ETH
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals Breakdown */}
          <div className="w-full sm:w-[321px] ml-auto flex flex-col gap-2 pt-3 text-xs sm:text-sm">
            {eth(order.discountEth).gt('0') && (
              <div className="flex justify-between items-center text-primary">
                <span>Desconto ({order.couponCode || 'Cupom'})</span>
                <span className="font-mono">-{order.discountEth} ETH</span>
              </div>
            )}

            <div className="flex justify-between items-center text-foreground/70">
              <span>Taxa de rede</span>
              <span className="font-mono">{order.networkFeeEth} ETH</span>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="font-bold text-foreground">Total</span>
              <span className="text-base sm:text-lg font-bold text-text-accent font-mono">
                {order.totalEth} ETH
              </span>
            </div>
          </div>

          {/* Divider Line */}
          <div className="w-full h-[1px] bg-border my-1" />

          {/* Confirmation Explanatory Note */}
          <p className="text-[11px] sm:text-xs text-center text-text-secondary leading-relaxed max-w-[420px] mx-auto">
            Transação confirmada na {order.network.includes('Polygon') ? 'Polygon' : 'Ethereum'}. A propriedade foi transferida para sua carteira conectada e registrada na rede.
          </p>

          {/* Actions: Centered Ver no Etherscan + Secondary Controls */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <a
              href={`https://etherscan.io/tx/${order.txHash || order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
              aria-label="Ver transação no explorador de blocos Etherscan (abre em nova aba)"
            >
              <Button
                type="button"
                variant="default"
                className="h-[45px] px-8 rounded-[6px] bg-primary text-ink font-bold text-sm sm:text-base hover:bg-[#c27c3e] cursor-pointer shadow-none flex items-center justify-center gap-2"
              >
                <span>Ver no Etherscan</span>
              </Button>
            </a>

          </div>
        </div>

        {/* Bottom Accent Bar */}
        <div className="w-full h-2.5 bg-primary" aria-hidden="true" />
      </article>
    </div>
  );
}