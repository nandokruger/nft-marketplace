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
function ThankYouEnvelope({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg width="66" height="80" viewBox="0 0 66 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M29.28 25.9317C29.884 26.1624 30.5617 25.8588 30.7922 25.2536L31.1851 24.2217H33.9576L34.3458 25.2503C34.5228 25.7195 34.9687 26.0088 35.4423 26.0088C35.5798 26.0088 35.7197 25.9844 35.8559 25.933C36.4614 25.7045 36.767 25.0284 36.5384 24.4228L33.8309 17.2483C33.827 17.2378 33.8228 17.227 33.8186 17.2167C33.6117 16.7133 33.1264 16.3881 32.5822 16.3881C32.5819 16.3881 32.5815 16.3881 32.5812 16.3881C32.0365 16.3884 31.5512 16.7144 31.345 17.2183C31.3414 17.2273 31.3376 17.2361 31.3344 17.2453L28.602 24.4195C28.3715 25.0242 28.6751 25.7013 29.28 25.9317V25.9317ZM33.0731 21.8781H32.0778L32.5776 20.5656L33.0731 21.8781Z" fill="#D28A4C" />
      <path d="M38.9121 26.0085C39.5595 26.0085 40.084 25.4839 40.084 24.8366V21.3327L42.8588 25.3508C43.1926 25.8333 43.7537 26.0377 44.2884 25.8708C44.8319 25.7013 45.183 25.1989 45.183 24.58L45.1151 17.5486C45.1088 16.9053 44.5854 16.388 43.9435 16.388C43.9396 16.388 43.9357 16.388 43.932 16.388C43.2846 16.3942 42.7651 16.9241 42.7713 17.5711L42.806 21.1497L39.8765 16.9075C39.5851 16.4855 39.0535 16.3024 38.5634 16.4547C38.0738 16.6074 37.7402 17.0606 37.7402 17.5735V24.8364C37.7402 25.4839 38.2648 26.0085 38.9121 26.0085Z" fill="#D28A4C" />
      <path d="M47.8302 26.0084C48.4776 26.0084 49.0021 25.4839 49.0021 24.8366V23.5698L51.1893 25.68C51.4167 25.8994 51.7099 26.0086 52.0028 26.0086C52.3098 26.0086 52.6163 25.8886 52.8462 25.6503C53.2956 25.1847 53.2823 24.4427 52.8165 23.9934L49.7724 21.0564L52.5376 18.5145C53.0142 18.0766 53.0454 17.3352 52.6073 16.8587C52.1695 16.3822 51.4279 16.3511 50.9515 16.7891L49.002 18.5809V17.56C49.002 16.9127 48.4774 16.3881 47.8301 16.3881C47.1827 16.3881 46.6582 16.9127 46.6582 17.56V24.8366C46.6584 25.4839 47.1829 26.0084 47.8302 26.0084V26.0084Z" fill="#D28A4C" />
      <path d="M20.9902 26.0084C21.6376 26.0084 22.1621 25.4839 22.1621 24.8366V22.2453H24.854V24.8366C24.854 25.4839 25.3785 26.0084 26.0259 26.0084C26.6732 26.0084 27.1977 25.4839 27.1977 24.8366V17.56C27.1977 16.9127 26.6732 16.3881 26.0259 16.3881C25.3785 16.3881 24.854 16.9127 24.854 17.56V19.9016H22.1621V17.56C22.1621 16.9127 21.6376 16.3881 20.9902 16.3881C20.3429 16.3881 19.8184 16.9127 19.8184 17.56V24.8366C19.8184 25.4839 20.3429 26.0084 20.9902 26.0084Z" fill="#D28A4C" />
      <path d="M18.2334 31.64L20.3662 34.9061L20.3579 38.273C20.3564 38.9203 20.8798 39.4463 21.5268 39.4478H21.5298C22.1757 39.4478 22.7001 38.925 22.7017 38.2789L22.7099 34.908L24.826 31.657C25.1792 31.1145 25.0257 30.3886 24.4834 30.0356C23.941 29.6822 23.2149 29.8359 22.862 30.3783L21.5373 32.4131L20.1956 30.3586C19.8417 29.8166 19.1159 29.6645 18.5737 30.0181C18.032 30.372 17.8793 31.0981 18.2334 31.64V31.64Z" fill="#D28A4C" />
      <path d="M36.3097 36.0064C36.3097 37.1997 36.8758 38.1662 37.9924 38.8798C38.5808 39.2556 39.2438 39.4467 39.963 39.4478H39.9685C40.5858 39.4478 41.1663 39.3133 41.6938 39.0475C42.9938 38.3928 43.7097 37.3109 43.7097 36.0011V30.9992C43.7097 30.3519 43.1852 29.8273 42.5379 29.8273C41.8905 29.8273 41.366 30.3519 41.366 30.9992V36.0011C41.366 36.3061 41.278 36.6326 40.6396 36.9542C40.4394 37.0551 40.2199 37.104 39.9686 37.104C39.9679 37.104 39.9669 37.104 39.9661 37.104C39.6963 37.1037 39.4633 37.0384 39.2541 36.9048C38.6993 36.5503 38.6533 36.2776 38.6533 36.0065V30.9994C38.6533 30.352 38.1288 29.8275 37.4814 29.8275C36.8341 29.8275 36.3096 30.352 36.3096 30.9994V36.0064H36.3097Z" fill="#D28A4C" />
      <path d="M13.3447 18.7319H14.1741V24.8366C14.1741 25.4839 14.6986 26.0084 15.346 26.0084C15.9933 26.0084 16.5179 25.4839 16.5179 24.8366V18.7319H17.3633C18.0107 18.7319 18.5352 18.2073 18.5352 17.56C18.5352 16.9127 18.0107 16.3881 17.3633 16.3881H13.3447C12.6974 16.3881 12.1729 16.9127 12.1729 17.56C12.1729 18.2073 12.6974 18.7319 13.3447 18.7319V18.7319Z" fill="#D28A4C" />
      <path d="M30.2125 29.8275C27.5602 29.8275 25.4023 31.9855 25.4023 34.6377C25.4023 37.2898 27.5603 39.4478 30.2125 39.4478C32.865 39.4478 35.0228 37.2898 35.0228 34.6377C35.0228 31.9855 32.8648 29.8275 30.2125 29.8275ZM30.2125 37.1041C28.8525 37.1041 27.7461 35.9977 27.7461 34.6377C27.7461 33.2777 28.8525 32.1712 30.2125 32.1712C31.5725 32.1712 32.6791 33.2777 32.6791 34.6377C32.6791 35.9977 31.5725 37.1041 30.2125 37.1041Z" fill="#D28A4C" />
      <path d="M63.3789 28.0734L59.9291 24.4797V9.46422C59.9291 7.37484 58.2292 5.67484 56.1397 5.67484H41.8753C41.8717 5.67109 41.8687 5.66687 41.8652 5.66313L39.0922 2.77469C37.3744 0.985469 35.0623 0 32.582 0C30.1017 0 27.7897 0.985469 26.072 2.77469L23.2877 5.675H9.02438C6.93484 5.675 5.235 7.375 5.235 9.46437V24.48L1.78516 28.0734C0.634063 29.2725 0 30.8483 0 32.5103V76.2106C0 78.3002 1.7 80 3.78937 80H61.3745C63.4639 80 65.1639 78.3002 65.1639 76.2106V32.5103C65.1639 30.8483 64.53 29.2725 63.3789 28.0734V28.0734ZM61.6881 29.6967C62.4181 30.457 62.8202 31.4564 62.8202 32.5105V35.168L59.9289 38.1797V27.8641L61.6881 29.6967ZM27.7627 4.39781C29.0344 3.07328 30.7458 2.34375 32.582 2.34375C34.4183 2.34375 36.1297 3.07328 37.4014 4.39781L38.6273 5.67484H26.5367L27.7627 4.39781ZM9.02438 8.01859H56.1395C56.9367 8.01859 57.5852 8.66703 57.5852 9.46422V40.6209L45.1459 53.5784L39.0919 47.2722C37.3742 45.483 35.0622 44.4975 32.5819 44.4975C30.1016 44.4975 27.7895 45.483 26.0719 47.2722L20.0178 53.5784L7.57859 40.6209V9.46422C7.57875 8.66719 8.22734 8.01859 9.02438 8.01859V8.01859ZM18.3936 55.2706L2.34391 71.9891V38.5522L18.3936 55.2706ZM2.34391 32.5103C2.34391 31.4562 2.74594 30.4569 3.47594 29.6966L5.23516 27.8641V38.1794L2.34391 35.1677V32.5103ZM61.3745 77.6562H3.78953C2.99234 77.6562 2.34391 77.0078 2.34391 76.2106V75.3733L27.7628 48.8953C29.0345 47.5706 30.7459 46.8412 32.5822 46.8412C34.4184 46.8412 36.1298 47.5708 37.4016 48.8953L46.8138 58.6997C47.262 59.1667 48.0037 59.1814 48.4706 58.7334C48.9373 58.2853 48.9527 57.5434 48.5044 57.0766L46.7706 55.2706L62.8203 38.5522V71.9891L52.2734 61.0028C51.8252 60.5359 51.0834 60.5209 50.6166 60.9691C50.1498 61.4172 50.1345 62.1591 50.5828 62.6259L62.8203 75.3733V76.2105C62.8202 77.0078 62.1717 77.6562 61.3745 77.6562V77.6562Z" fill="#D28A4C" />
    </svg>
  );
}

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
          <ThankYouEnvelope className="w-20 h-20 mb-4" />
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
