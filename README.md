# KURIO — Marketplace Descentralizado de NFTs

> Plataforma de marketplace de NFTs de alta fidelidade visual, construída com foco em resiliência de rede, reatividade em tempo real, tolerância a falhas e precisão aritmética de padrão financeiro para ativos digitais.
> Implementação orientada pelos tokens do Figma (`fileKey: Ff0SksUi7UFtPWUO8kyNtw`) e pelas regras de governança técnica do desafio.

---

## 1. Visão Geral do Projeto & Live Demo

O **KURIO** é uma aplicação web moderna que simula um marketplace completo de criptoativos e tokens não fungíveis (NFTs). Projetado sob arquitetura orientada a domínios (*Feature-Driven / Screaming Architecture*), o sistema oferece uma experiência fluida para colecionadores explorarem coleções, gerenciarem carrinhos com sincronização entre sessões, realizarem pagamentos com carteiras Web3 multi-chain (Ethereum, Polygon e Solana) e acompanharem atualizações de preço e estoque em tempo real.

### Stack Tecnológica Principal

- **Interface & Reatividade:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Roteamento & Estado de URL:** [@tanstack/react-router](https://tanstack.com/router) (File-based routing com Search Params validados via Zod)
- **Gerenciamento de Estado Servidor & Cache:** [@tanstack/react-query v5](https://tanstack.com/query) + [Axios](https://axios-http.com/)
- **Camada de Tempo Real:** [Socket.IO Client](https://socket.io/) interceptado nativamente por [@mswjs/socket.io-binding](https://github.com/mswjs/socket.io-binding)
- **Estilização & Design System:** [Tailwind CSS v4](https://tailwindcss.com/) com tokens semânticos em `@theme` + [shadcn/ui](https://ui.shadcn.com/) (primitivos acessíveis Radix UI)
- **Aritmética Financeira de Criptoativos:** Módulo próprio `src/lib/eth-math.ts` baseado em `BigInt` escalado em 18 decimais (Wei) — zero ponto flutuante IEEE 754
- **Simulação de API & Injeção de Caos:** [Mock Service Worker (MSW v2)](https://mswjs.io/) via Browser Service Worker ativo tanto em desenvolvimento quanto em produção/preview
- **Qualidade, Acessibilidade & Testes:** [Playwright](https://playwright.dev/) (E2E multidevice em 390px, 768px e 1440px), [Vitest](https://vitest.dev/) (unitários de contratos e aritmética) e [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Links de Acesso

| Recurso | Link | Observações |
|---|---|---|
| **Aplicação Publicada (Live Demo)** | [fernandokruger.com.br/nft-marketplace](https://fernandokruger.com.br/nft-marketplace)  | Service Worker MSW roda no client-side com 100% das features ativas |
| **Repositório GitHub** | [github.com/nandokruger/nft-marketplace](https://github.com/nandokruger/nft-marketplace) | Código-fonte completo, suíte de testes e documentação |
| **Especificação de Arquitetura** | [ARCHITECTURE.md](./ARCHITECTURE.md) | Documento arquitetural aprofundado

### Cobertura dos Critérios Eliminatórios de Governança

A aplicação foi auditada e cumpre integralmente os 5 critérios eliminatórios estabelecidos em `rules/01-governance-and-constraints.md`:

1. **Invariante — Interceptação Exclusiva no MSW:**  
   Todas as requisições HTTP efetuadas pelo Axios trafegam por chamadas de rede reais no navegador, interceptadas exclusivamente pelo Service Worker do MSW (`src/mocks/handlers/`). Não existem adapters customizados, `axios-mock-adapter`, mocks condicionais `if (DEV)` ou fixtures estáticas importadas na UI.
2. **Invariante — Tempo Real Estrito via Socket.IO:**  
   Todas as transmissões de eventos (`nft.updated`, `order.updated`) utilizam `socket.io-client` sobre o canal WebSocket intercepted pelo `@mswjs/socket.io-binding` (`ws.link`). Não há `setTimeout` nem callbacks forçados em componentes simulando push de eventos.
3. **Invariante — Precisão Numérica em Wei (BigInt):**  
   Valores de ETH trafegam estritamente como `string` decimal nos contratos (`z.string().regex(/^\d+(?:\.\d{1,18})?$/)`). Cálculos matemáticos ocorrem exclusivamente através do motor `EthDecimal` (`src/lib/eth-math.ts`), utilizando `BigInt` escalado em 18 casas decimais (Wei). Arredondamentos ocorrem exclusivamente na camada final de exibição formatada.
4. **Invariante — Tipagem Estrita e Validação Zod:**  
   Contratos entre backend simulado, Axios, TanStack Query, TanStack Router e interface são centralizados em schemas Zod em `src/contracts/`. Toda resposta da API é validada em tempo de execução antes de ser persistida no cache.
5. **Invariante — Isolamento Rigoroso de Sessão:**  
   A rotina `wipeSessionState()` em `src/lib/query-client.ts` é executada em logouts, expiração de token ou troca de conta:
   - Remove do cache todas as queries privadas (`queryClient.removeQueries({ queryKey: ['private'] })`);
   - Limpa chaves de autorização do `localStorage` e cabeçalhos do Axios;
   - Desconecta o Socket.IO (`removeAllListeners()` + `disconnect()`) e reinicia conexão limpa;
   - Cancela todas as requisições e mutations em trânsito via `AbortController`.

---

## 2. Setup do Ambiente e Execução Local

### Pré-requisitos

- **Node.js:** Versão `>= 20.19.0` (LTS recomendada)
- **Gerenciador de Pacotes:** `npm` (versão 10+) ou `pnpm` (versão 9+)
- **Navegador Moderno:** Chrome, Edge, Firefox ou Safari com suporte a Service Workers e WebSockets

### Instalação de Dependências

Clone o repositório e instale as dependências:

```bash
# Clonar o repositório
git clone https://github.com/nandokruger/ntf-marketplace.git
cd kurio

# Instalar pacotes com npm
npm install

# (Ou com pnpm)
# pnpm install
```

### Configuração de Variáveis de Ambiente

Copie o arquivo de exemplo para o seu ambiente local:

```bash
cp .env.example .env.local
```

As variáveis disponíveis e seus valores padrão são detalhados abaixo:

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_APP_NAME` | `"KURIO NFT Marketplace"` | Nome de exibição da aplicação |
| `VITE_ENABLE_MSW` | `true` | Ativa o Service Worker do MSW para interceptar requisições |
| `VITE_SOCKET_URL` | `""` | URL do servidor Socket.IO (vazio utiliza `window.location.origin`) |
| `VITE_DEFAULT_LATENCY_MS` | `150` | Latência simulada base das respostas HTTP no MSW |
| `VITE_INITIAL_SCENARIO` | `"default"` | Cenário de injeção de falhas inicial carregado pela aplicação |

### Comandos de Inicialização e Desenvolvimento

#### 1. Servidor de Desenvolvimento
Inicia a aplicação localmente com Vite, Service Worker MSW e WebSocket simulado:

```bash
npm run dev
```
Acesse a aplicação no seu navegador em: `http://localhost:5173`.

#### 2. Build de Produção e Visualização (Preview)
Compila os assets com validação de tipos estrita e inicia o servidor de preview local (com o Service Worker ativo no client-side):

```bash
# Compilar projeto (tsc --noEmit + vite build)
npm run build

# Executar preview local da build de produção
npm run preview
```
O preview estará acessível em: `http://localhost:4173`.

#### 3. Checagem Estática de Tipos (TypeScript)
Valida a integridade dos contratos, rotas e componentes sem emitir arquivos:

```bash
npm run typecheck
```

#### 4. Testes Unitários (Vitest)
Executa a suíte de testes unitários que valida a aritmética de `EthDecimal`, cálculos do carrinho, schemas Zod e queries factories:

```bash
# Execução única
npm run test

# Modo assistido (watch mode)
npm run test:watch
```

#### 5. Testes End-to-End (Playwright)
Executa a suíte de testes de ponta a ponta simulando navegadores reais nos três viewports obrigatórios (390px, 768px, 1440px):

```bash
# Executar todos os testes E2E em modo headless
npm run test:e2e

# Executar via Playwright UI Mode interativo
npx playwright test --ui

# Executar apenas testes de um determinado viewport
npx playwright test --project=mobile-390
npx playwright test --project=desktop-1440

# Executar teste específico (ex: checkout e idempotência)
npx playwright test tests/e2e/checkout.spec.ts
```

#### 6. Testes de Regressão Visual e Ausência de Overflow
Os testes E2E do Playwright validam continuamente a fidelidade de layout e garantem que `document.documentElement.scrollWidth <= window.innerWidth` em todos os viewports:

```bash
# Executar testes e atualizar snapshots visuais se necessário
npx playwright test --update-snapshots
```

#### 7. Auditoria de Acessibilidade e Performance (Lighthouse)
Para rodar auditorias locais do Lighthouse com meta de pontuação `>= 95`:

```bash
# Certifique-se de que a build de preview está ativa na porta 4173
npm run preview

# Em outro terminal, execute o Lighthouse CLI
npx lighthouse http://localhost:4173 --preset=desktop --view
npx lighthouse http://localhost:4173 --preset=mobile --view
```

---

## 3. Autenticação e Credenciais Fictícias

O banco em memória simulado (`src/mocks/db.ts`) inicializa com dados determinísticos gravados no `localStorage` sob a chave `@jungle-nft:mock-db-v5`. Abaixo estão as credenciais pré-configuradas para validação de cenários de uso:

| Perfil de Usuário | E-mail | Senha | Saldo Simulado | Carteiras Vinculadas & Redes | Detalhes & Finalidade de Teste |
|---|---|---|---|---|---|
| **Usuário A** *(Colecionador Principal)* | `satoshi@kurio.app` | `password123` | **100.0 ETH** *(50.0 + 50.0)* | **1. Reserva:** `0x1a2b...9a0b` (Polygon - 50.0 ETH)<br>**2. Principal:** `0xA91F...E82C` (Ethereum - 50.0 ETH) | Usuário com histórico completo, duas carteiras vinculadas, itens favoritos e transações anteriores. Ideal para testar alternância de redes e taxas de gás dinâmicas no checkout. |
| **Usuário B** *(Novo Colecionador)* | `ada@kurio.app` | `password123` | **42.0 ETH** | **1. Hardware Ledger:** `0x9f8e...1f0e` (Ethereum - 42.0 ETH) | Usuário com uma única carteira fria conectada. Utilizado para validar checkout direto e criação de novas conexões de carteira. |
| **Visitante / Guest** *(Não Autenticado)* | *N/A* | *N/A* | *N/A* | Nenhuma carteira conectada | Sessão anônima operando sob `cartKey: 'guest'`. Permite testar navegação no catálogo, adição ao carrinho e a posterior **migração/fusão atômica de itens** ao efetuar login. |

### Cupons de Desconto Cadastrados no Banco

Para testar o fluxo financeiro de abatimento no carrinho e checkout:

| Código do Cupom | Desconto | Regras & Condições | Status no Banco |
|---|---|---|---|
| `KURIO10` | **10%** | Válido para qualquer valor no catálogo | Ativo / Válido |
| `WELCOME20` | **20%** | Válido para pedidos com subtotal mínimo de `0.5 ETH` | Ativo / Válido |
| `EXPIRED50` | **50%** | Cupom de teste expirado para validação de erros da API | Inativo / Expirado |

---

## 4. Painel / Mecanismo de Controle dos Mocks (MSW + Tempo Real)

A aplicação conta com um poderoso motor de injeção de caos e cenários de rede determinísticos gerenciado pela classe `ScenarioManager` (`src/mocks/scenarios.ts`).

### Modos de Controle e Alternância de Cenários

Você pode alternar os cenários de 4 maneiras complementares:

1. **Painel Flutuante na Interface (ScenarioDevToolbar):**  
   Um widget flutuante no canto inferior direito da tela (ou `bottom-20` no mobile) permite abrir o menu de controle com 1 clique, alternar qualquer cenário instantaneamente e acompanhar o estado ativo.
2. **Parâmetro de URL (Query String):**  
   Basta acrescentar `?__scenario=<nome-do-cenario>` na barra de endereços (ex: `http://localhost:5173/?__scenario=slow-network`). O cenário tem precedência imediata.
3. **Cabeçalho HTTP (`X-Scenario`):**  
   O interceptor do Axios (`src/lib/axios.ts`) injeta automaticamente o cabeçalho `X-Scenario: <nome>` em todas as requisições com base no valor salvo no `localStorage`.
4. **Chamada REST de Teste:**  
   Requisições programáticas podem ser enviadas via terminal ou scripts de automação:
   ```bash
   # Ativar cenário de erro 500
   curl -X POST http://localhost:5173/api/__test__/scenario \
     -H "Content-Type: application/json" \
     -d '{"scenario": "http-500"}'
   ```

### Restaurando o Estado Inicial (Reset Determinístico)

Para restaurar o banco de dados em memória e resetar todos os cenários para os valores originais:
- Clique no botão **"Reset State"** presente no `ScenarioDevToolbar`; ou
- Dispare uma requisição HTTP:
  ```bash
  curl -X POST http://localhost:5173/api/__test__/reset
  ```
Isso redefine os 239 NFTs originais, limpa pedidos criados, restaura os carrinhos e recarrega os dados.

### Catálogo Completo de Cenários Disponíveis

| Identificador do Cenário | Nome no Painel | Comportamento Injetado | Casos de Teste Atendidos |
|---|---|---|---|
| `default` | Padrão (150ms) | Operação com latência realista padrão de rede (150ms). | Fluxo normal de navegação e compras. |
| `slow-network` | Rede Lenta (2.5s) | Atrasa todas as respostas HTTP em 2500ms. | Validação de Skeletons com Shimmer e garantia de **Zero CLS**. |
| `out-of-order` | Respostas Fora de Ordem | Alterna requisições: a 1ª busca leva 2000ms e a 2ª leva 100ms. | Validação de cancelamento de queries via `AbortController` (evita que resultado antigo sobrescreva busca recente). |
| `http-500` / `network-error` | Erro 500 / Rede | Retorna imediatamente status HTTP 500 com payload estruturado de erro. | Retentativas automáticas do TanStack Query, exibição de estados de erro na UI e rollback de mutações. |
| `session-expired` | Sessão Expirada (401) | Retorna status HTTP 401 Unauthorized na próxima requisição privada. | Interceptor do Axios dispara evento `kurio:session-expired`, limpando cache e abrindo modal de login. |
| `price-changed-on-checkout` | Preço Alterado (Concorrência) | No momento do checkout, aumenta o preço do 1º item em +0.5 ETH, emite `nft.updated` via Socket.IO e retorna 409 Conflict. | Exibe alerta visual acessível na UI, bloqueia botão de compra até aceite do colecionador e recalcula o total. |
| `edition-exhausted` | Edição Esgotada | Zera o estoque do NFT (`availableEditions: 0`), emite `nft.updated` e rejeita a compra. | Valida bloqueio de checkout para itens que se esgotaram concorrentemente. |
| `order-timeout-idempotent` | Timeout com Idempotência | Salva o pedido no banco, limpa carrinho, emite evento de confirmação, aguarda 3s e devolve HTTP 504 Gateway Timeout. | A UI retenta com a **mesma `Idempotency-Key`**; a API identifica o pedido salvo e retorna 200 OK sem duplicidade. |
| `payment-declined` | Pagamento Recusado | Processa a ordem como status `DECLINED` e emite evento `order.updated` com a recusa da blockchain. | Valida tratamento de recusa de transações e ausência de hash de transação. |

---

## 5. Passo a Passo de Reprodução dos Fluxos Críticos & Casos de Borda

Abaixo estão os roteiros manuais para testar e validar os principais requisitos de arquitetura e resiliência:

### Roteiro 1: Atualização Concorrente de Preço via Socket.IO no Checkout

**Objetivo:** Demonstrar que o cliente WebSocket reage imediatamente a alterações de preço durante a compra, bloqueando confirmações desatualizadas e exigindo consentimento explícito do usuário.

1. Acesse `http://localhost:5173/` e adicione o NFT **"Emerald Ape #042"** ao carrinho.
2. Acesse `/cart` e clique em **"Conectar e finalizar"** (ou autentique-se como `satoshi@kurio.app`).
3. Na tela `/checkout`, verifique o valor subtotal do item (ex: `1.19 ETH`).
4. Abra o painel flutuante `ScenarioDevToolbar` e selecione o cenário **"Preço Alterado"** (`price-changed-on-checkout`).
5. Clique no botão **"Confirmar compra"**.
6. **Resultado Esperado na UI:**
   - A API retorna status `409 Conflict` e o servidor Socket.IO emite o evento `nft.updated` atualizando a versão e o preço do ativo;
   - Uma região de alerta `role="alert"` com `aria-live="assertive"` surge na tela com o aviso: *"Aviso de Mercado em Tempo Real: O preço de Emerald Ape #042 foi alterado durante o checkout"*;
   - O botão *"Confirmar compra"* é desabilitado imediatamente para evitar débitos divergentes;
   - O usuário clica no botão **"Revisar e Aceitar Valores"**;
   - O modal atualiza a cotação final e o botão de confirmação volta ao estado habilitado com o novo total recalculado via `EthDecimal`.

---

### Roteiro 2: Idempotência e Timeout de Rede no Checkout

**Objetivo:** Provar que timeouts após o envio do pedido não geram duplicidade financeira nem múltiplos pedidos idênticos.

1. No `/checkout`, com itens no carrinho e usuário autenticado, abra o painel de cenários e ative **"Timeout Idempotente"** (`order-timeout-idempotent`).
2. Clique no botão **"Confirmar compra"**.
3. O frontend gera uma chave `Idempotency-Key` (UUID v4) anexada aos headers da requisição.
4. O servidor MSW persiste o pedido no banco de dados, emite o evento de confirmação, aguarda 3 segundos e retorna propositalmente `HTTP 504 Gateway Timeout`.
5. A UI detecta a falha e aciona o retry (ou o usuário clica novamente em *"Tentar Novamente"*), **reutilizando a mesmíssima `Idempotency-Key`**.
6. **Resultado Esperado:**
   - O manipulador em `src/mocks/handlers/order.ts` identifica que já existe uma ordem cadastrada com aquela chave para aquele usuário;
   - A resposta devolve imediatamente `HTTP 200 OK` com os dados do pedido já gravado;
   - A interface navega para `/orders/ord_...` exibindo o recibo com snapshot de preços imutáveis, **sem criar pedido duplicado e sem debitar edições adicionais**.

---

### Roteiro 3: Persistência e Migração de Carrinho (Visitante -> Autenticado)

**Objetivo:** Garantir que um usuário anônimo possa montar seu carrinho e, ao se autenticar, seus itens sejam integrados ao seu perfil sem perda de dados.

1. Abra a aplicação em uma aba anônima (ou certifique-se de estar deslogado).
2. Adicione 2 itens ao carrinho a partir da página inicial.
3. Acesse `/cart` e confirme que os 2 itens estão listados sob o identificador anônimo (`cartKey: 'guest'`).
4. Clique no botão **"Conectar e finalizar"** ou acione o botão **"Entrar"** no cabeçalho.
5. Na modal de autenticação, insira `satoshi@kurio.app` e senha `password123`.
6. Após a autenticação bem-sucedida, a aplicação chama o endpoint `POST /api/cart/sync`.
7. **Resultado Esperado:**
   - Os itens do carrinho anônimo são mesclados com o carrinho existente do usuário Satoshi;
   - O carrinho anônimo é limpo;
   - O subtotal e taxas são recalculados via `EthDecimal` considerando eventuais cupons do usuário logado;
   - A interface do carrinho atualiza sem necessidade de recarregar a página (F5).

---

### Roteiro 4: Falha de Mutação com Rollback Otimista (Favoritos)

**Objetivo:** Validar a resposta instantânea da interface e sua resiliência diante de falhas de comunicação com o servidor.

1. Na página inicial (`/`), observe o botão de coração (favorito) em qualquer NFT com contagem de curtidas visível.
2. Abra o `ScenarioDevToolbar` e ative o cenário **"Erro 500"** (`http-500`).
3. Clique no ícone de coração para favoritar o NFT.
4. **Resultado Esperado:**
   - **Atualização Otimista Instantânea:** O coração é preenchido imediatamente e o contador de likes sobe em +1 (via `onMutate`);
   - Em seguida, a requisição `POST /api/nfts/:id/favorite` falha com status 500;
   - **Rollback Fiel:** O método `onError` do hook `useFavoriteNft` restaura o snapshot exato previamente capturado do cache do TanStack Query;
   - O ícone volta ao estado desmarcado, o contador é restaurado e uma notificação amigável é anunciada aos leitores de tela: *"Não foi possível atualizar os favoritos... A alteração foi desfeita"*.
"# nft-marketplace" 
