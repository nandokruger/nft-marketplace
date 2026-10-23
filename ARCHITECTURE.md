# Arquitetura de Software — KURIO NFT Marketplace

> Documento de Especificação Arquitetural e Decisões de Engenharia (ADRs)
> Nível: Staff / Principal Frontend Engineer
> Versão do Sistema: 0.1.0 | Revisão Técnica de Governança

---

## 1. Visão Arquitetural & Estrutura de Pastas

A arquitetura do **KURIO** adota o paradigma de **Feature-Driven / Screaming Architecture**, combinado com princípios de **Clean Architecture** e isolamento rigoroso de responsabilidades. O objetivo central é permitir que a estrutura de diretórios "grite" o domínio do negócio (Catálogo de NFTs, Carrinho de Compras, Checkout Multi-Chain, Gestão de Carteiras e Sessão de Colecionadores), ao mesmo tempo em que blinda a aplicação contra vazamentos de abstração entre as camadas de apresentação, estado remoto, contratos e simulação.

### Diagrama de Fluxo de Dados e Interceptação

O diagrama abaixo ilustra o ciclo de vida completo de uma requisição e a integração entre chamadas HTTP reais e eventos WebSocket de tempo real:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           CAMADA DE APRESENTAÇÃO (UI)                          │
│   Componentes React (shadcn/ui + Radix UI)  ◄──►  Rotas TanStack Router        │
└───────────────────────┬───────────────────────────────────▲────────────────────┘
                        │ useQuery / useMutation            │ Eventos / Live Regions
                        ▼                                   │ (aria-live)
┌───────────────────────────────────────────────────────────┴────────────────────┐
│                  CAMADA DE ESTADO REMOTO & ARITMÉTICA (LIB)                    │
│   TanStack Query v5 (Cache Isolado: ['public'] vs ['private', userId])        │
│   Aritmética Financeira: EthDecimal (BigInt em 18 decimais / Wei)              │
│   Cliente HTTP: Axios (Interceptors de Auth & Cenários de Caos)                │
└───────────────────────┬───────────────────────────────────▲────────────────────┘
                        │ Requisição HTTP Real              │ WebSocket Push
                        ▼ (fetch / XMLHttpRequest)          │ (socket.io-client)
══════════════════════════════════════════════════════════════════════════════════
               FRONTEIRA DO NAVEGADOR: SERVICE WORKER (MSW v2)
══════════════════════════════════════════════════════════════════════════════════
┌───────────────────────────────────────────────────────────┴────────────────────┐
│                    CAMADA DE SIMULAÇÃO DE BACKEND & CAOS                       │
│   MSW Service Worker Interceptor (public/mockServiceWorker.js)                 │
│   ├── Handlers REST (/api/nfts, /api/cart, /api/orders, /api/auth)             │
│   ├── WebSocket Interceptor: ws.link(/socket.io/) via @mswjs/socket.io-binding  │
│   ├── Banco de Dados em Memória: DatabaseManager (Persistência determinística) │
│   └── Motor de Injeção de Falhas: ScenarioManager (Latência, 500, Timeouts)   │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Árvore da Estrutura de Diretórios e Responsabilidades

```text
jungle-app/
├── public/
│   └── mockServiceWorker.js         # Service Worker oficial do MSW v2
├── tests/
│   ├── e2e/                         # Suíte Playwright nos viewports 390px, 768px e 1440px
│   │   ├── marketplace.spec.ts      # Catálogo, busca, filtros combinados e paginação
│   │   ├── cart.spec.ts             # Tabela adaptativa, cupons, sync visitante->logado
│   │   ├── checkout.spec.ts         # Idempotência, seleção de carteira/rede e concorrência
│   │   └── order-receipt.spec.ts    # Snapshot imutável do pedido e recibo
│   └── unit/                        # Suíte Vitest de precisão matemática e contratos
│       ├── eth-math.test.ts         # Testes de precisão Wei, sinais, arredondamentos e overflow
│       ├── cart-math.test.ts        # Cálculo exato de subtotais, cupons e taxas
│       ├── contracts.test.ts        # Validações dos schemas Zod em runtime
│       └── query-keys.test.ts       # Isolamento de chaves públicas vs privadas
├── src/
│   ├── contracts/                   # FONTE DA VERDADE ÚNICA: Schemas Zod e Tipos TypeScript
│   │   ├── index.ts                 # Ponto de exportação de contratos
│   │   ├── nft.ts                   # Schemas de NFT, Coleções, Redes e Filtros
│   │   ├── cart.ts                  # Schemas de Item, Carrinho, Cupom e Cotação
│   │   ├── order.ts                 # Schemas de Pedido, Snapshot e Requisição de Checkout
│   │   ├── user.ts                  # Schemas de Colecionador, Sessão e Credenciais
│   │   ├── wallet.ts                # Schemas de Carteira Web3, Redes e Saldos
│   │   ├── scenario.ts              # Tipagem estrita dos cenários de injeção de caos
│   │   └── events.ts                # Contratos dos eventos Socket.IO (nft.updated, order.updated)
│   ├── lib/                         # UTILITÁRIOS CENTRAIS E CAMADA DE COMUNICAÇÃO
│   │   ├── eth-math.ts              # Motor aritmético imutável EthDecimal (BigInt / 18 decimais)
│   │   ├── axios.ts                 # Instância Axios com interceptors de Auth e X-Scenario
│   │   ├── query-client.ts          # Instância TanStack Query e rotina wipeSessionState()
│   │   ├── query-keys.ts            # Query Key Factory hierárquica e isolada por escopo
│   │   ├── socket.ts                # Cliente Socket.IO com deduplicação FIFO e reconciliação
│   │   ├── search-params.ts         # Serializador bidirecional de query strings planas
│   │   ├── use-media-query.ts       # Hooks reativos de viewport (useIsMobile, useIsDesktop)
│   │   └── use-session.ts           # Hook de sessão reativa baseado no Storage Event
│   ├── routes/                      # ROTAS BASEADAS EM ARQUIVOS (TanStack Router)
│   │   ├── __root.tsx               # Layout raiz, Header, Footer, Modais e ScenarioDevToolbar
│   │   ├── index.tsx                # Rota /: Catálogo, Hero, Filtros, Grid e Paginação
│   │   ├── nft.$nftId.tsx           # Rota /nft/:nftId: Detalhe do NFT e Compra Direta
│   │   ├── cart.tsx                 # Rota /cart: Carrinho responsivo, cupom e resumo
│   │   ├── checkout.tsx             # Rota /checkout: Pagamento, carteiras e idempotência
│   │   ├── orders.$orderId.tsx      # Rota /orders/:orderId: Recibo da transação
│   │   ├── profile.tsx              # Rota /profile: Dados do colecionador
│   │   ├── wallets.tsx              # Rota /wallets: Conexão e alternância de carteiras
│   │   ├── login.tsx                # Rota /login: Entrada com suporte a deep-link e redirecionamento
│   │   └── register.tsx             # Rota /register: Criação de conta
│   ├── components/                  # COMPONENTES VISUAIS POR DOMÍNIO
│   │   ├── ui/                      # Primitivos shadcn/ui customizados (Button, Dialog, Select, etc.)
│   │   ├── layout/                  # Header, Footer, Navigation e ScenarioDevToolbar
│   │   ├── catalog/                 # NftCard, CatalogFilters, HomeHero, CatalogPagination
│   │   ├── cart/                    # CartTable, CartSummaryCard, DesktopCart, MobileCart
│   │   ├── checkout/                # DesktopCheckout, MobileCheckout, WalletSelector
│   │   ├── nft-details/             # DesktopNftDetail, MobileNftDetail, PriceHistory
│   │   ├── auth/                    # AuthModal, LoginForm, RegisterForm
│   │   └── skeletons/               # Skeletons estruturais com shimmer e Zero CLS
│   ├── context/
│   │   └── AuthModalContext.tsx     # Gerenciamento de abertura/fechamento das modais de login
│   ├── styles/
│   │   └── index.css                # Tailwind CSS v4 (@theme com tokens de DESIGN_TOKENS.md)
│   ├── mocks/                       # CAMADA DE SERVIÇO SIMULADA (MSW v2)
│   │   ├── browser.ts               # Inicialização do worker do Service Worker
│   │   ├── db.ts                    # Banco em memória (239 NFTs, usuários, carteiras)
│   │   ├── scenarios.ts             # Motor de injeção de caos e latência
│   │   ├── socket-handlers.ts       # WebSocket interceptor e emissores Socket.IO
│   │   └── handlers/                # Handlers HTTP organizados por domínio REST
│   │       ├── catalog.ts           # GET /api/nfts, GET /api/nfts/:id, POST /favorite
│   │       ├── cart.ts              # GET, POST, PATCH, DELETE /api/cart, /coupon, /sync
│   │       ├── order.ts             # POST, GET /api/orders (com checagem de idempotência)
│   │       ├── auth.ts              # POST /api/auth/login, /register, GET /api/auth/me
│   │       ├── wallet.ts            # GET, POST, PATCH /api/wallets
│   │       └── test.ts              # POST /api/__test__/reset, /api/__test__/scenario
│   ├── main.tsx                     # Ponto de entrada (Inicialização do MSW, Socket e Router)
│   └── routeTree.gen.ts             # Árvore gerada tipada do TanStack Router
└── vite.config.ts                   # Configuração Vite com Plugins React, TanStack Router e Tailwind
```

### Regras de Dependência e Fronteiras Arquiteturais

1. **Apresentação (`src/components/`, `src/routes/`)**  
   Conhece apenas `src/contracts/`, `src/lib/` e primitivos visuais. **É terminantemente proibido importar qualquer módulo de `src/mocks/`** dentro de componentes ou rotas de produção.
2. **Contratos (`src/contracts/`)**  
   Zero dependências de runtime de infraestrutura ou UI. Depende unicamente de `zod` e tipos TypeScript. Atua como o contrato canônico compartilhado por todas as camadas.
3. **Mocks e Simulação (`src/mocks/`)**  
   Implementa as rotas especificadas pelos contratos Zod e opera isolada pelo Service Worker. Não polui a árvore de dependências dos componentes.

---

## 2. Gerenciamento de Rotas e Estado de URL (TanStack Router)

A camada de roteamento utiliza o **TanStack Router**, adotando o modelo de roteamento baseado em arquivos com inferência e checagem estática total de tipos (`routeTree.gen.ts`).

### Mapa de Rotas e Políticas de Acesso

| Rota | Arquivo | Nível de Acesso | Search Params Validados | Comportamento Especial |
|---|---|---|---|---|
| `/` | `src/routes/index.tsx` | Público | `CatalogSearchSchema` | Catálogo paginado com abas editoriais e scroll suave até o grid |
| `/nft/$nftId` | `src/routes/nft.$nftId.tsx` | Público | — | Detalhe do NFT com histórico, criador e compra rápida |
| `/cart` | `src/routes/cart.tsx` | Público (Visitante/Logado) | — | Tabela adaptativa, cupons e sincronização automática |
| `/checkout` | `src/routes/checkout.tsx` | Privado | — | Exige autenticação; aciona modal de login se visitante |
| `/orders/$orderId` | `src/routes/orders.$orderId.tsx` | Privado | — | Exibição de snapshot imutável do pedido concluído |
| `/login` | `src/routes/login.tsx` | Visitante | `z.object({ redirect: z.string().optional() })` | Suporte a deep link e redirecionamento de retorno |
| `/register` | `src/routes/register.tsx` | Visitante | `z.object({ redirect: z.string().optional() })` | Criação de perfil com retenção da rota de origem |
| `/profile` | `src/routes/profile.tsx` | Privado | — | Gestão de dados pessoais e preferências |
| `/wallets` | `src/routes/wallets.tsx` | Privado | — | Conexão, desconexão e alternância de carteira ativa |

### Modelagem de Estado na URL e Search Params

Os parâmetros de busca da rota principal (`/`) são estritamente validados pelo schema Zod `CatalogSearchSchema`:

```typescript
// src/components/catalog/catalog-search.ts
export const CatalogSearchSchema = z.object({
  q: z.string().optional(),
  category: NftCategorySchema.optional(),
  network: NftNetworkSchema.optional(),
  sort: CatalogSortSchema.optional(),
  tab: CatalogTabSchema.optional(),
  minPrice: EthDecimalStringSchema.optional(),
  maxPrice: EthDecimalStringSchema.optional(),
  favorites: z.enum(['true', '1']).optional(),
  page: z.coerce.number().int().positive().optional()
});
```

#### Serialização de Query Strings Planas

O TanStack Router por padrão serializa parâmetros complexos como JSON (`?filter={"category":"music"}`). Para garantir compatibilidade com SEO, legibilidade humana e compartilhamento de links, a aplicação implementa serializadores customizados em `src/lib/search-params.ts`:

```typescript
export function parseSearch(searchStr: string): Record<string, string> {
  const params = new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr);
  const result: Record<string, string> = {};
  params.forEach((value, key) => { result[key] = value; });
  return result;
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, typeof value === 'string' ? value : String(value));
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}
```

Isso garante que valores decimais de ETH permaneçam como strings puras (`?minPrice=0.5&maxPrice=12.3`), prevenindo distorções na conversão.

### Navegação por Histórico: `push` vs `replace`

Para preservar uma pilha de navegação limpa e previsível:
- **`replace: true`** é utilizado em atualizações contínuas de filtros (digitação de texto de busca, alternância de redes ou faixas de preço). Isso evita que o usuário precise pressionar o botão "Voltar" do navegador dezenas de vezes para retornar à tela anterior.
- **`replace: false` (`push`)** é utilizado exclusivamente na transição entre abas conceituais (`tab`), seleção de categorias e avanços de página (`page`), preservando marcos intencionais no histórico.

### Manutenção de Posição de Rolagem (`resetScroll: false`)

Nas mudanças de filtro e paginação da página inicial, a diretiva `resetScroll: false` é aplicada. No caso da paginação, a aplicação executa um scroll programático suave focado exclusivamente no topo da coluna de resultados:

```typescript
const setPage = (newPage: number) => {
  navigate({
    search: (prev) => compactSearch({ ...prev, page: newPage === 1 ? undefined : newPage }),
    resetScroll: false
  });
  if (catalogColumnRef.current) {
    const headerOffset = isDesktop ? 80 : 20;
    const elementPosition = catalogColumnRef.current.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
  }
};
```

### Redirecionamento Autenticado com Retenção de Contexto

Rotas protegidas como `/checkout` verificam a presença da sessão no `beforeLoad` do TanStack Router. Se não autenticado, redirecionam para a autenticação preservando o destino:

```typescript
// Redirecionamento com preservação de intenção
throw redirect({
  to: '/login',
  search: { redirect: location.href }
});
```
Ao concluir o login ou registro, a aplicação lê o parâmetro `redirect` e devolve o colecionador exatamente ao fluxo de finalização de compra original.

---

## 3. Gerenciamento de Estado Remoto e Estratégia de Cache (TanStack Query + Axios)

A camada de estado assíncrono é orquestrada pelo **TanStack Query v5**, integrado a uma instância configurada do **Axios** (`src/lib/axios.ts`).

### Query Key Factory Hierárquica

Para garantir consistência e evitar colisões ou invalidações erráticas, todas as chaves de consulta são construídas centralizadamente em `src/lib/query-keys.ts`:

```typescript
export const queryKeys = {
  // Consultas públicas (compartilhadas entre todos os usuários e visitantes)
  catalog: {
    all: ['public', 'nfts'] as const,
    list: (filter: Partial<NftFilter>) => ['public', 'nfts', 'list', filter] as const,
    detail: (id: string) => ['public', 'nfts', 'detail', id] as const,
    featured: () => ['public', 'nfts', 'featured'] as const
  },

  // Consultas privadas (estritamente escopadas por userId)
  user: {
    me: (userId: string) => ['private', userId, 'me'] as const,
    cart: (userId: string | 'guest') => ['private', userId, 'cart'] as const,
    orders: {
      all: (userId: string) => ['private', userId, 'orders'] as const,
      detail: (userId: string, orderId: string) => ['private', userId, 'orders', orderId] as const
    },
    wallets: (userId: string) => ['private', userId, 'wallets'] as const
  },

  // Consultas de controle do sistema e testes
  system: {
    scenario: ['system', 'scenario'] as const
  }
};
```

### Estratégia de Isolamento de Cache e Sanitização no Logout

O critério eliminatório de governança exige que dados privados jamais vazem entre sessões distintas ou trocas de usuário. A função `wipeSessionState()` em `src/lib/query-client.ts` implementa uma rotina atômica em 4 etapas:

```typescript
export function wipeSessionState(qc: QueryClient = queryClient): void {
  // 1. Remove todas as queries privadas do cache do TanStack Query
  qc.removeQueries({ queryKey: ['private'] });

  // 2. Limpa credenciais persistidas e revoga o header padrão do Axios
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  }
  delete apiClient.defaults.headers.common['Authorization'];

  // 3. Desconecta o Socket.IO, purga listeners e reinicia conexão limpa
  disconnectSocket();
  initSocket(qc);

  // 4. Cancela todas as requisições em voo (in-flight queries)
  qc.cancelQueries();
}
```

### Políticas de `staleTime`, `gcTime` e Retentativa Inteligente

- **`staleTime` Padrão:** Definido em 30 segundos (`30_000ms`) para o catálogo público. Garante navegação instantânea em trocas rápidas de aba sem disparar rajadas desnecessárias de requisições HTTP.
- **`refetchOnWindowFocus: false`:** Desativado para prevenir recarregamentos intrusivos que poderiam interromper interações no checkout ou animações de compra.
- **Política de Retentativas (`retry`):**  
  Erros determinísticos de negócio ou autorização (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`) possuem retry **desativado imediatamente** (`return false`). Erros transitórios de infraestrutura (500, 502, timeouts) são retentados até 2 vezes com backoff exponencial.

### Cancelamento de Requisições Obsoletas via `AbortController`

Ao realizar buscas rápidas por texto ou alternar páginas no catálogo, requisições antigas são canceladas antes de serem concluídas, evitando condições de corrida onde uma resposta antiga e lenta sobrescreve uma resposta mais recente:

```typescript
// Integração TanStack Query + Axios AbortSignal
queryFn: async ({ signal }) => {
  const res = await apiClient.get<NftListResponse>(`/api/nfts?${params.toString()}`, {
    signal
  });
  return res.data;
}
```

### Atualização Otimista com Rollback Fiel (Hook `useFavoriteNft`)

A alternância do estado de favorito no catálogo implementa o padrão completo de mutação otimista em `src/components/catalog/use-favorite-nft.ts`:

1. **`onMutate` (Ação Instantânea):**
   - Cancela queries ativas de catálogo (`qc.cancelQueries({ queryKey: queryKeys.catalog.all })`);
   - Captura snapshots do cache anterior das listas (`getQueriesData`) e do detalhe do NFT (`getQueryData`);
   - Aplica a mutação em memória no cache do TanStack Query (inverte `isFavorited` e ajusta `likesCount`);
   - Dispara anúncio para leitores de tela via CustomEvent acessível (`kurio:announce`);
   - Retorna o contexto `{ previousLists, previousDetail }`.
2. **`onError` (Rollback Preciso):**
   - Em caso de falha na requisição HTTP (ex: erro 500 simulado), restaura integralmente os snapshots salvos utilizando `setQueryData` nas chaves afetadas;
   - Notifica o colecionador visualmente e por voz de que a alteração foi desfeita.
3. **`onSettled` (Consolidação):**
   - Invalida as queries de catálogo para resgatar a contagem definitiva e garantir sincronia com a base de dados.

---

## 4. Precisão Numérica de Criptoativos (ETH)

### A Vulnerabilidade do Padrão IEEE 754

O padrão JavaScript para tipos `number` utiliza representação de ponto flutuante binário de dupla precisão (IEEE 754). Esse padrão é matematicamente inadequado para aplicações financeiras e Web3:

```javascript
0.1 + 0.2 === 0.30000000000000004 // Erro clássico de representação binária
1.19 * 6 === 7.140000000000001    // Erro ao calcular subtotal de edições
```

No contexto de NFTs, qualquer divergência de fração de Wei pode causar:
- Falhas em contratos inteligentes por insuficiência de saldo;
- Cobranças divergentes entre a tela de confirmação e a assinatura da carteira;
- Acúmulo de erros de arredondamento em cupons de desconto e taxas de rede.

### Solução Arquitetural: O Módulo `EthDecimal`

Para atender ao critério eliminatório número 3 da governança, foi desenvolvido o motor imutável **`EthDecimal`** (`src/lib/eth-math.ts`).

#### Princípios de Operação:
1. **Tráfego Estrito em String Decimal:**  
   Em todas as fronteiras (Schemas Zod, JSON REST, WebSockets, TanStack Query e Props de Componentes), valores em ETH trafegam estritamente como `string` decimal casando com o padrão `/^\d+(?:\.\d{1,18})?$/`.
2. **Escala Interna em 18 Decimais (Wei):**  
   Todo valor é internamente representado como um `bigint` escalado por `10^18` ($1 \text{ ETH} = 10^{18} \text{ Wei}$):
   $$\text{Wei} = \text{ParteInteira} \times 10^{18} + \text{ParteFracionária} \times 10^{18 - \text{dígitos}}$$
3. **Imutabilidade e Precisão Absoluta:**  
   Operações aritméticas (`add`, `sub`, `mul`, `mulInt`, `div`, `percent`) produzem novas instâncias de `EthDecimal` sem nunca converter para ponto flutuante.
4. **Proteção em Runtime Contra Coerção Implícita:**  
   O método `[Symbol.toPrimitive]` lança uma exceção imediata caso algum desenvolvedor tente coagir o objeto para `number`:
   ```typescript
   [Symbol.toPrimitive](hint: string): string {
     if (hint === 'number') {
       throw new EthDecimalError('Coerção de EthDecimal para number é proibida; use os métodos aritméticos');
     }
     return this.toString();
   }
   ```
5. **Arredondamento Somente na Apresentação:**  
   Arredondamentos e formatações com separadores locais (`pt-BR`) são isolados no método `.format()` exclusivamente no momento da renderização em tela.

---

## 5. Camada de Tempo Real (Socket.IO) & Reconciliação com REST

### Arquitetura de Simulação com `@mswjs/socket.io-binding`

Diferente de abordagens frágeis que utilizam mocks em memória nos componentes ou timers manuais, a camada de tempo real do **KURIO** utiliza o binding oficial `@mswjs/socket.io-binding` acoplado ao interceptor WebSocket do MSW v2 (`ws.link(/socket\.io/)`):

- **Cliente Real:** A aplicação instancia o `socket.io-client` padrão (`src/lib/socket.ts`).
- **Transporte WebSocket:** Os pacotes trafegam por conexões WebSocket interceptadas no nível de rede do navegador pelo Service Worker.
- **Zero Mock na UI:** A interface não sabe se o servidor é uma réplica MSW ou um backend Node.js em produção.

### Contratos dos Eventos em Tempo Real

Os eventos transmitidos pelo WebSocket são validados em tempo de execução via schemas Zod (`src/contracts/events.ts`):

#### 1. Evento `nft.updated`
Disparado quando ocorrem variações de preço, edições vendidas ou esgotamento de estoque:
```typescript
{
  eventId: "evt_nft_nft-01_1740000000000_a1b2c",
  version: 2,
  timestamp: "2026-10-23T12:00:00.000Z",
  payload: {
    id: "nft-01",
    name: "Emerald Ape #042",
    priceEth: "1.99",
    availableEditions: 4,
    version: 2,
    // ... campos completos do NFT
  }
}
```

#### 2. Evento `order.updated`
Disparado para notificar confirmação na blockchain ou recusa da transação:
```typescript
{
  eventId: "evt_ord_ord_1740000000000_x9y8z",
  version: 1,
  timestamp: "2026-10-23T12:00:05.000Z",
  payload: {
    id: "ord_1740000000000",
    userId: "user_1",
    status: "CONFIRMED", // ou "DECLINED"
    txHash: "0x7a8b9c...d1e2f3",
    totalEth: "2.396",
    version: 1,
    // ... itens e snapshots financeiros
  }
}
```

### Idempotência e Deduplicação no Cliente

Para proteger a aplicação contra eventos duplicados ou entregas fora de ordem da rede:

1. **Rastreamento por `eventId` (Buffer FIFO):**  
   A função `trackEvent(eventId)` mantém um registro dos últimos 200 `eventId` processados. Se um evento já registrado for recebido novamente, ele é descartado imediatamente.
2. **Comparação de Versão Monotônica (`version`):**  
   Antes de atualizar o cache, o cliente compara a versão do evento com a versão da entidade já armazenada no cache do TanStack Query:
   ```typescript
   const cachedDetail = queryClient.getQueryData<Nft>(queryKeys.catalog.detail(updatedNft.id));
   if (cachedDetail && cachedDetail.version >= updatedNft.version) {
     return; // Descarta evento defasado ou duplicado
   }
   ```

### Reconciliação Híbrida do Cache

Quando um evento válido chega:
- O detalhe do NFT (`queryKeys.catalog.detail(id)`) é atualizado atomicamente com `queryClient.setQueryData`;
- Cada lista de catálogo em cache (`queryKeys.catalog.all`) tem apenas o card correspondente modificado em memória (preservando paginação, filtros e posições dos demais itens);
- É emitido o evento customizado `kurio:nft-updated` no `window` para que telas sensíveis (como o Checkout) alertem o usuário em tempo real.

### Reconciliação Pós-Reconexão de Rede

Se a conexão WebSocket for perdida (por oscilação de Wi-Fi ou fechamento de aba), ao reconectar com sucesso, o ouvinte `connect` aciona imediatamente uma invalidação global do catálogo:
```typescript
socketInstance.on('connect', () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
});
```
Isso garante que quaisquer transações ou variações ocorridas durante o período offline sejam recuperadas via REST.

---

## 6. Tolerância a Falhas, Idempotência e Concorrência

### Padrão de Chave de Idempotência no Checkout

Para evitar duplicidade de compras ou cobranças duplas decorrentes de perda de pacotes ou múltiplos cliques do usuário, o endpoint `POST /api/orders` implementa estrita idempotência orientada a headers:

1. Ao carregar a tela `/checkout`, a aplicação gera uma chave de idempotência exclusiva via `crypto.randomUUID()`.
2. A requisição HTTP envia a chave no cabeçalho: `Idempotency-Key: <uuid>`.
3. O servidor em memória (`src/mocks/handlers/order.ts`) armazena essa chave vinculada ao pedido:
   ```typescript
   const existingOrder = db.orders.find(
     (o) => o.userId === userId && o.idempotencyKey === idempotencyKey
   );
   if (existingOrder) {
     return HttpResponse.json(existingOrder, { status: 200 });
   }
   ```
4. Em cenários de timeout (ex: cenário de caos `order-timeout-idempotent`), o cliente retenta a operação **enviando exatamente a mesma chave**. O backend identifica que a ordem já foi criada, não debita edições novamente e retorna a ordem existente com `200 OK`.

### Concorrência de Preço e Conflito `409 Conflict`

Caso o preço de um item seja alterado por outro usuário ou por um oráculo enquanto o comprador está na tela de pagamento:
- O endpoint de criação do pedido detecta a divergência e recusa a transação com `409 Conflict` (`PRICE_CHANGED`);
- A interface exibe uma notificação prioritária com `role="alert"` e `aria-live="assertive"`;
- O botão de confirmação de compra é bloqueado até que o usuário clique em *"Revisar e Aceitar Valores"*;
- O total é recalculado via `EthDecimal` com a cotação mais recente, garantindo total transparência financeira.

---

## 7. Padrões de Interface, Responsividade e Acessibilidade

### Prevenção de Cumulative Layout Shift (Zero CLS)

Para atingir a pontuação máxima de performance e experiência visual:
- Todo carregamento assíncrono conta com componentes de `Skeleton` (`CatalogGridSkeleton`, etc.) com animação de shimmer;
- Os Skeletons possuem **exatamente as mesmas dimensões** (largura, altura, aspect-ratio, paddings e gaps) dos elementos finais;
- Imagens contam com dimensões explícitas ou classes de aspect-ratio fixo (`aspect-square`), evitando saltos no DOM.

### Responsividade em 3 Viewports Obrigatórios

A aplicação foi projetada e validada para 3 viewports chave:
- **Mobile (390px):** Navegação inferior fixa (`MobileBottomNav`), drawers modais e cards empilhados.
- **Tablet (768px):** Ajuste de densidade com grid de 2 colunas e transição de cabeçalho.
- **Desktop (1440px):** Layout completo com colunas laterais, breadcrumbs, filtros expansíveis e modais sobrepostas.

A ausência de overflow horizontal é assegurada programaticamente em testes Playwright (`document.documentElement.scrollWidth <= window.innerWidth`).

### Conformidade com Acessibilidade (WCAG 2.1 AA / Lighthouse ≥ 95)

- **Regiões Vivas (`aria-live`):** Notificações amigáveis usam `polite` (adição ao carrinho, favoritos); alertas críticos usam `assertive` (conflito de preço, sessão expirada).
- **Semântica Form: `<label htmlFor>`** em todos os campos, mensagens de erro vinculadas via `aria-describedby` e indicação de campo inválido via `aria-invalid="true"`.
- **Focus Management:** Modais construídas sobre Radix UI implementam focus trap e restauram o foco para o elemento disparador no fechamento.
- **Contraste de Cores:** Todos os textos respeitam contraste mínimo AA sobre os fundos escuros da paleta (`--color-ink` e `--color-surface-dark`).
- **Respeito a Preferências de Movimento:** Animações respeitam a media query `@media (prefers-reduced-motion: reduce)`.
