import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/axios';
import { queryKeys } from '@/lib/query-keys';
import { eth } from '@/lib/eth-math';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Wallet, User, WalletNetwork } from '@/contracts';

export const Route = createFileRoute('/wallets')({
  component: WalletsPage
});

function WalletsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // New Wallet Form State
  const [isAdding, setIsAdding] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState<WalletNetwork>('Ethereum Mainnet');
  const [balance, setBalance] = useState('2.5');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const userRaw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!token || !userRaw) {
      navigate({ to: '/login', search: { redirect: '/wallets' } });
      return;
    }
    try {
      setCurrentUser(JSON.parse(userRaw));
    } catch {
      navigate({ to: '/login', search: { redirect: '/wallets' } });
    }
  }, [navigate]);

  const { data: wallets = [], isLoading } = useQuery<Wallet[]>({
    queryKey: currentUser ? queryKeys.user.wallets(currentUser.id) : ['private', 'wallets'],
    queryFn: async () => {
      const res = await apiClient.get<Wallet[]>('/api/wallets');
      return res.data;
    },
    enabled: Boolean(currentUser)
  });

  const addWalletMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        throw new Error('Endereço hexadecimal inválido (deve começar com 0x e conter 40 caracteres hex).');
      }
      const res = await apiClient.post('/api/wallets', {
        name: walletName,
        address: walletAddress,
        network,
        balanceEth: balance
      });
      return res.data;
    },
    onSuccess: () => {
      setIsAdding(false);
      setWalletName('');
      setWalletAddress('');
      qc.invalidateQueries({ queryKey: ['private'] });
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Falha ao conectar carteira.');
    }
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (walletId: string) => {
      const res = await apiClient.patch(`/api/wallets/${walletId}/primary`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private'] });
    }
  });

  const deleteWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      const res = await apiClient.delete(`/api/wallets/${walletId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['private'] });
    }
  });

  const handleGenerateRandomAddress = () => {
    const hex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setWalletAddress(`0x${hex}`);
  };

  return (
    <div className="max-w-[1200px] mx-auto py-8 sm:py-12 px-4 sm:px-8 flex flex-col gap-8">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Carteiras Conectadas
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Gerencie suas contas Web3 para liquidação instantânea de compras e recebimento de NFTs.
          </p>
        </div>

        {!isAdding && (
          <Button
            variant="default"
            size="default"
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold"
          >
            + Conectar Nova Carteira
          </Button>
        )}
      </div>

      {/* Add Wallet Form Modal/Section */}
      {isAdding && (
        <Card className="p-6 border-primary/50 bg-surface-card flex flex-col gap-5 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm uppercase tracking-wider font-bold text-foreground">
              Conectar Nova Carteira Web3
            </h2>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-text-secondary hover:text-foreground"
            >
              Cancelar ✕
            </button>
          </div>

          {formError && (
            <div className="rounded-[4px] bg-text-coral/10 border border-text-coral/40 p-3 text-xs text-text-coral">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="w-name" className="text-xs text-text-secondary">
                Nome da Carteira
              </Label>
              <Input
                id="w-name"
                placeholder="Ex: Minha MetaMask Principal"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="w-net" className="text-xs text-text-secondary">
                Rede Blockchain
              </Label>
              <select
                id="w-net"
                value={network}
                onChange={(e) => setNetwork(e.target.value as WalletNetwork)}
                className="h-10 rounded-[5px] border border-border bg-ink px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Ethereum Mainnet">Ethereum Mainnet</option>
                <option value="Polygon">Polygon</option>
                <option value="Arbitrum">Arbitrum</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="w-addr" className="text-xs text-text-secondary">
                Endereço Hexadecimal (0x...)
              </Label>
              <button
                type="button"
                onClick={handleGenerateRandomAddress}
                className="text-[11px] text-text-accent hover:underline"
              >
                Gerar endereço de teste ✦
              </button>
            </div>
            <Input
              id="w-addr"
              placeholder="0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5 max-w-xs">
            <Label htmlFor="w-bal" className="text-xs text-text-secondary">
              Saldo Inicial em ETH
            </Label>
            <Input
              id="w-bal"
              type="number"
              step="0.001"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => addWalletMutation.mutate()}
              disabled={!walletName.trim() || !walletAddress.trim() || addWalletMutation.isPending}
            >
              {addWalletMutation.isPending ? 'Conectando...' : 'Salvar Carteira'}
            </Button>
          </div>
        </Card>
      )}

      {/* Wallet Cards List */}
      {isLoading ? (
        <div className="h-48 rounded skeleton-shimmer" />
      ) : wallets.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-bold text-foreground">Nenhuma carteira conectada</p>
          <Button variant="default" size="sm" onClick={() => setIsAdding(true)}>
            Conectar Primeira Carteira
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className={`p-6 flex flex-col justify-between gap-6 transition-all ${wallet.isPrimary ? 'border-primary shadow-md bg-gradient-to-br from-surface-card to-surface-dark' : ''
                }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">{wallet.name}</span>
                    {wallet.isPrimary && (
                      <Badge variant="default" className="text-[10px]">
                        Principal
                      </Badge>
                    )}
                  </div>
                  <Badge variant="dark" className="text-[10px]">
                    {wallet.network}
                  </Badge>
                </div>

                <div className="bg-ink/80 p-3 rounded-[5px] border border-border">
                  <span className="text-[10px] uppercase text-text-secondary block">Endereço</span>
                  <span className="text-xs font-mono text-foreground break-all">{wallet.address}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-text-secondary">Saldo Disponível</span>
                  <span className="text-xl font-bold font-mono text-primary">
                    {eth(wallet.balanceEth).format({ withSymbol: true })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-4 text-xs">
                {!wallet.isPrimary ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrimaryMutation.mutate(wallet.id)}
                    disabled={setPrimaryMutation.isPending}
                    className="text-xs"
                  >
                    Definir como Principal
                  </Button>
                ) : (
                  <span className="text-[11px] text-primary font-semibold">✓ Carteira Ativa para Checkout</span>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteWalletMutation.mutate(wallet.id)}
                  disabled={deleteWalletMutation.isPending}
                  className="text-xs text-text-coral hover:bg-text-coral/10 hover:text-text-coral"
                >
                  Desconectar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
