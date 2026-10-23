import { useState, useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/axios';
import { queryKeys } from '@/lib/query-keys';
import { wipeSessionState } from '@/lib/query-client';
import { eth, EthDecimal } from '@/lib/eth-math';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { resolveAssetUrl } from '@/lib/assets';
import type { User, Order } from '@/contracts';

export const Route = createFileRoute('/profile')({
  component: ProfilePage
});

function ProfilePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const userRaw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!token || !userRaw) {
      navigate({ to: '/login', search: { redirect: '/profile' } });
      return;
    }
    try {
      setCurrentUser(JSON.parse(userRaw));
    } catch {
      navigate({ to: '/login', search: { redirect: '/profile' } });
    }
  }, [navigate]);

  // Fetch Order History for this user
  const { data: orders = [], isLoading: isOrdersLoading } = useQuery<Order[]>({
    queryKey: currentUser ? queryKeys.user.orders.all(currentUser.id) : ['private', 'orders'],
    queryFn: async () => {
      const res = await apiClient.get<Order[]>('/api/orders');
      return res.data;
    },
    enabled: Boolean(currentUser)
  });

  const handleLogout = () => {
    wipeSessionState();
    window.dispatchEvent(new CustomEvent('kurio:auth-changed'));
    navigate({ to: '/' });
  };

  if (!currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto py-12 px-4 flex justify-center">
        <div className="h-40 w-full max-w-md rounded skeleton-shimmer" />
      </div>
    );
  }

  // Calculate stats strictly with EthDecimal
  const totalSpent = orders
    .filter((o) => o.status === 'CONFIRMED')
    .reduce((sum, o) => sum.add(o.totalEth), EthDecimal.ZERO);

  return (
    <div className="max-w-[1200px] mx-auto py-8 sm:py-12 px-4 sm:px-8 flex flex-col gap-8">
      {/* Header with Avatar and Bio */}
      <Card className="p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 bg-gradient-to-r from-surface-card to-surface-dark">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <img
            src={resolveAssetUrl(currentUser.avatarUrl)}
            alt={currentUser.name}
            className="h-24 w-24 rounded-full object-cover border-2 border-primary shadow-xl"
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {currentUser.name}
              </h1>
              <Badge variant="default" className="text-[10px] uppercase">
                Colecionador
              </Badge>
            </div>
            <p className="text-xs text-text-secondary">{currentUser.email}</p>
            <p className="text-xs text-foreground/80 max-w-md mt-1">{currentUser.bio}</p>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-text-coral border-text-coral/50 hover:bg-text-coral/10"
          >
            Encerrar Sessão
          </Button>
        </div>
      </Card>

      {/* Collector Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-text-secondary">
            Total de Pedidos
          </span>
          <span className="text-2xl font-bold font-mono text-foreground">{orders.length}</span>
        </Card>

        <Card className="p-5 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-text-secondary">
            Volume Liquidado em ETH
          </span>
          <span className="text-2xl font-bold font-mono text-primary">
            {totalSpent.format({ withSymbol: true })}
          </span>
        </Card>

        <Card className="p-5 flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-text-secondary">
            Carteiras Vinculadas
          </span>
          <Link
            to="/wallets"
            className="text-xs font-bold text-text-accent hover:underline mt-2 flex items-center gap-1"
          >
            Gerenciar Carteiras →
          </Link>
        </Card>
      </div>

      {/* Order History */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground border-b border-border pb-3">
          Histórico de Pedidos ({orders.length})
        </h2>

        {isOrdersLoading ? (
          <div className="h-48 rounded-[8px] skeleton-shimmer" />
        ) : orders.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-[8px] bg-surface-card text-xs text-text-secondary flex flex-col items-center gap-3">
            <span>Você ainda não realizou nenhum pedido.</span>
            <Link to="/">
              <Button variant="default" size="sm">
                Explorar Coleções
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const isConfirmed = order.status === 'CONFIRMED';
              return (
                <Card
                  key={order.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/60 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-foreground">
                        {order.id}
                      </span>
                      <Badge variant={isConfirmed ? 'default' : 'coral'} className="text-[10px]">
                        {order.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-text-secondary">
                      {new Date(order.createdAt).toLocaleString('pt-BR')} • {order.items.length}{' '}
                      {order.items.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase text-text-secondary block">Total</span>
                      <span className="text-sm font-bold font-mono text-primary">
                        {eth(order.totalEth).format({ withSymbol: true })}
                      </span>
                    </div>

                    <Link to="/orders/$orderId" params={{ orderId: order.id }}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Ver Recibo →
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
