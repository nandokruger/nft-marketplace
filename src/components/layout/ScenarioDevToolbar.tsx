import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ScenarioType } from '@/contracts';

const SCENARIOS: { id: ScenarioType; label: string; desc: string }[] = [
  { id: 'default', label: 'Padrão (150ms)', desc: 'Operação normal com latência realista' },
  { id: 'slow-network', label: 'Rede Lenta (2.5s)', desc: 'Valida Skeletons com Shimmer e Zero CLS' },
  { id: 'out-of-order', label: 'Out of Order', desc: '1ª busca 2s, 2ª busca 100ms (descarta antiga)' },
  { id: 'http-500', label: 'Erro 500', desc: 'Simula falha de servidor para testar retry' },
  { id: 'session-expired', label: 'Sessão Expirada', desc: '401 no próximo request privado' },
  { id: 'price-changed-on-checkout', label: 'Preço Alterado', desc: 'Altera preço durante checkout via Socket.IO' },
  { id: 'edition-exhausted', label: 'Edição Esgotada', desc: 'Esgota disponibilidade antes de confirmar' },
  { id: 'order-timeout-idempotent', label: 'Timeout Idempotente', desc: 'Timeout após persistir pedido (reutiliza chave)' },
  { id: 'payment-declined', label: 'Pagamento Recusado', desc: 'Processa pedido e emite DECLINED via Socket.IO' }
];

export function ScenarioDevToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const qc = useQueryClient();

  const { data: currentScenario = 'default' } = useQuery({
    queryKey: queryKeys.system.scenario,
    queryFn: async () => {
      const res = await apiClient.get<{ activeScenario: ScenarioType }>('/api/__test__/scenario');
      return res.data.activeScenario;
    }
  });

  const scenarioMutation = useMutation({
    mutationFn: async (scenario: ScenarioType) => {
      const res = await apiClient.post('/api/__test__/scenario', { scenario });
      window.localStorage.setItem('@jungle-nft:scenario', scenario);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.system.scenario });
    }
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/__test__/reset');
      window.localStorage.removeItem('@jungle-nft:scenario');
    },
    onSuccess: () => {
      qc.clear();
      window.location.reload();
    }
  });

  // Sync with storage on mount
  useEffect(() => {
    const stored = window.localStorage.getItem('@jungle-nft:scenario') as ScenarioType | null;
    if (stored && stored !== currentScenario) {
      scenarioMutation.mutate(stored);
    }
  }, []);

  return (
    <aside
      aria-label="Barra de desenvolvimento de cenários de rede"
      className="fixed bottom-20 right-3 lg:bottom-4 lg:right-4 z-50 font-mono text-xs opacity-75 hover:opacity-100 transition-opacity"
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-primary/50 bg-ink/90 px-3 py-2 text-foreground shadow-lg backdrop-blur hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          aria-expanded={isOpen}
          aria-label="Abrir painel de controle de cenários de caos"
        >
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-bold text-[11px] text-primary">Cenário:</span>
          <span className="text-[11px] text-foreground max-w-[120px] truncate">{currentScenario}</span>
        </button>
      ) : (
        <div className="w-[320px] rounded-[8px] border border-border bg-surface-dark/95 p-4 text-foreground shadow-2xl backdrop-blur flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-primary">Chaos & Scenarios</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary">
                MSW
              </Badge>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:text-foreground text-base px-1"
              aria-label="Fechar painel de cenários"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-text-secondary leading-tight">
            Injeção determinística de cenários de rede exigidos no edital:
          </p>

          <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto pr-1">
            {SCENARIOS.map((s) => {
              const isActive = currentScenario === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scenarioMutation.mutate(s.id)}
                  disabled={scenarioMutation.isPending}
                  className={`flex flex-col text-left p-2 rounded-[4px] border transition-all cursor-pointer ${
                    isActive
                      ? 'border-primary bg-primary/10 text-foreground font-bold'
                      : 'border-border/40 bg-surface-card/60 text-text-secondary hover:border-border hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{s.label}</span>
                    {isActive && <span className="text-[10px] text-primary font-bold">ATIVO</span>}
                  </div>
                  <span className="text-[10px] text-text-secondary font-normal mt-0.5">{s.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="w-full text-xs text-text-coral border-text-coral/40 hover:bg-text-coral/10 hover:border-text-coral"
            >
              {resetMutation.isPending ? 'Resetando...' : '↺ Reset DB & Seed'}
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
