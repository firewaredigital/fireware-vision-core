
# Plano de Implementacao: Separacao em Apps com App Launcher

## Resumo Executivo

Transformar o Fireware CRM de um sistema monolitico com sidebar unica em uma plataforma multi-app, onde apos o login o usuario e direcionado a um **App Launcher** (seletor de apps). Cada app (CRM, Service, Marketing, Commerce, ITSM) possui sidebar e contexto proprios, enquanto modulos transversais (IA, Dados, Automacoes, Admin) ficam acessiveis dentro de qualquer app ativo.

---

## Arquitetura Conceitual

O fluxo de navegacao sera:

```text
/auth (Login)
   |
   v
/apps (App Launcher - tela de selecao)
   |
   +---> /app/crm/*        (CR Platform CRM)
   +---> /app/service/*     (CR Platform Service)
   +---> /app/marketing/*   (CR Platform Marketing)
   +---> /app/commerce/*    (CR Platform Commerce)
   +---> /app/itsm/*        (CR Platform ITSM)
```

Cada app tem:
- Prefixo de rota proprio (/app/{slug}/...)
- Sidebar com menus especificos do app + modulos transversais
- Dashboard dedicado como pagina inicial
- Acesso rapido ao App Launcher via topbar para trocar de app

---

## Fase 1 - Definicao dos Apps e Contexto

### 1.1 Registro de Apps

Criar um arquivo `src/config/apps.ts` com a definicao de todos os apps disponiveis:

| App | Slug | Icone | Cor | Modulo Requerido | Descricao |
|-----|------|-------|-----|------------------|-----------|
| CR Platform CRM | crm | TrendingUp | blue | sales | Pipeline, Leads, Contas, Oportunidades |
| CR Platform Service | service | Headphones | teal | service | Tickets, Omnichannel, WhatsApp, KB |
| CR Platform Marketing | marketing | Megaphone | purple | marketing | Campanhas, Jornadas, Segmentacao |
| CR Platform Commerce | commerce | ShoppingCart | orange | commerce | Pedidos, Devolucoes, Promocoes |
| CR Platform ITSM | itsm | Server | slate | itsm | Incidentes, Mudancas, CMDB |

Cada app contera: `slug`, `name`, `description`, `icon`, `color`, `heroImage`, `moduleKey`, `defaultRoute`, e a lista de `sections` do sidebar.

### 1.2 App Context Provider

Criar `src/hooks/useAppContext.tsx` com um React Context que armazena:
- `currentApp`: o app ativo (derivado da URL `/app/{slug}/...`)
- `setCurrentApp()`: funcao para trocar de app
- `availableApps`: lista de apps habilitados (filtrados por `useModuleAccess`)
- `isAppEnabled(slug)`: verificacao rapida

O provider sera colocado dentro do `AuthProvider` e acima do `BrowserRouter`, lendo o segmento da URL para determinar o app ativo.

---

## Fase 2 - App Launcher (Tela de Selecao)

### 2.1 Pagina `/apps` (AppLauncher.tsx)

Nova pagina em `src/pages/AppLauncher.tsx` renderizada apos login. Design inspirado no Salesforce App Launcher:

**Layout:**
- Header com logo Fireware, nome do usuario e botao de logout
- Grid de cards (2-3 colunas desktop, 1 coluna mobile) com cada app disponivel
- Cada card exibe: icone, nome do app, descricao curta, cor tematica
- Cards desabilitados (com overlay) para modulos nao licenciados
- Animacao de entrada escalonada (staggered fade-in)
- Campo de busca para filtrar apps (util quando houver muitos)
- Secao "Recentes" no topo mostrando os 3 ultimos apps acessados (via localStorage)

**Comportamento:**
- Se o usuario tem apenas 1 app disponivel, redireciona automaticamente
- Ultimo app acessado salvo em localStorage para acesso rapido
- Acessivel a qualquer momento via icone de grid na topbar

### 2.2 Alteracao no Fluxo de Login

Alterar `Auth.tsx` para redirecionar para `/apps` em vez de `/dashboard` apos login bem-sucedido. O `AuthGuard` tambem redirecionara para `/apps` como rota padrao.

Alterar a rota raiz `/` de `<Navigate to="/dashboard">` para `<Navigate to="/apps">`.

---

## Fase 3 - Reestruturacao de Rotas

### 3.1 Novo Prefixo de Rotas

Todas as rotas de cada app passam a ser prefixadas com `/app/{slug}/`:

**CRM (Sales):**
```text
/app/crm/dashboard
/app/crm/leads
/app/crm/leads/:id
/app/crm/accounts
/app/crm/contacts
/app/crm/opportunities
/app/crm/quotes
/app/crm/contracts
/app/crm/cpq
/app/crm/subscriptions
/app/crm/billing
/app/crm/conversation-intelligence
/app/crm/revenue-ops
```

**Service:**
```text
/app/service/dashboard
/app/service/inbox
/app/service/tickets
/app/service/tickets/:id
/app/service/queues
/app/service/qa
/app/service/social
/app/service/whatsapp
/app/service/chat-widgets
/app/service/voice
/app/service/analytics
/app/service/knowledge
/app/service/customer-success
```

**Marketing:**
```text
/app/marketing/dashboard
/app/marketing/campaigns
/app/marketing/segments
/app/marketing/journeys
/app/marketing/providers
/app/marketing/preference-center
/app/marketing/personalization
/app/marketing/intelligence
/app/marketing/email-templates
```

**Commerce:**
```text
/app/commerce/dashboard
/app/commerce/orders
/app/commerce/returns
/app/commerce/promotions
```

**ITSM:**
```text
/app/itsm/dashboard
/app/itsm/incidents
/app/itsm/changes
/app/itsm/cmdb
/app/itsm/assets
```

### 3.2 Modulos Transversais (Compartilhados)

Esses modulos aparecerao no sidebar de TODOS os apps como secoes extras na parte inferior:

```text
/app/{slug}/ai/agents
/app/{slug}/ai/tools
/app/{slug}/ai/runs
...
/app/{slug}/data/duplicates
/app/{slug}/data/golden-records
...
/app/{slug}/automations
/app/{slug}/dashboards
/app/{slug}/reports
/app/{slug}/settings
```

Na pratica, ao trocar de app, as rotas transversais mudam de prefixo mas renderizam os mesmos componentes. Isso e gerenciado por um componente `AppRoutes` que monta rotas dinamicamente com base no app ativo.

### 3.3 Refatoracao dos Arquivos de Rota

Refatorar os arquivos em `src/routes/` para aceitar um prefixo dinamico:

```text
// Antes:
SalesRoutes() => [<Route path="/leads" ...>]

// Depois:
SalesRoutes(prefix: string) => [<Route path={`${prefix}/leads`} ...>]
```

Cada arquivo de rota recebera o prefixo como parametro. Um novo arquivo `src/routes/AppRouter.tsx` orquestrara a montagem de todas as rotas:

```text
/app/crm/*    => SalesRoutes('/app/crm') + SharedRoutes('/app/crm')
/app/service/* => ServiceRoutes('/app/service') + SharedRoutes('/app/service')
...
```

### 3.4 Redirects de Compatibilidade

Manter redirects temporarios das URLs antigas para as novas:
- `/leads` -> `/app/crm/leads`
- `/tickets` -> `/app/service/tickets`
- `/marketing` -> `/app/marketing/dashboard`
- etc.

---

## Fase 4 - Sidebar Contextual por App

### 4.1 Refatoracao do AppSidebar

O `RAIL_MODULES` atual sera substituido por uma estrutura derivada do app ativo. Em vez de um rail com TODOS os modulos, cada app tera:

**Rail do App CRM:**
```text
[Home] [Pipeline] [Contas] [Gestao] [IA] [Dados] [Admin]
```

**Rail do App Service:**
```text
[Home] [Inbox] [Tickets] [Canais] [KB] [IA] [Dados] [Admin]
```

**Rail do App Marketing:**
```text
[Home] [Campanhas] [Jornadas] [Segmentos] [Config] [IA] [Dados] [Admin]
```

A funcao `getAppSidebarConfig(appSlug)` retornara a configuracao de `RAIL_MODULES` especifica para cada app, combinando os itens proprios do app com os modulos transversais.

### 4.2 App Switcher na Topbar

Adicionar um componente `AppSwitcher` na `AppTopbar`:
- Icone de grid (similar ao Salesforce "App Launcher waffle")
- Dropdown/popover com todos os apps disponiveis
- Clique em um app navega para `/app/{slug}/dashboard`
- Indicador visual do app ativo atual
- Atalho de teclado (Ctrl+Shift+A) para abrir

### 4.3 Branding Contextual

O sidebar rail e a topbar mudarao sutilmente de cor/tema conforme o app ativo:
- CRM: tom azul
- Service: tom teal
- Marketing: tom roxo
- Commerce: tom laranja
- ITSM: tom cinza

Isso sera implementado via CSS custom properties injetadas pelo `AppContext` e consumidas pelo sidebar/topbar.

---

## Fase 5 - Dashboard por App

### 5.1 Dashboards Dedicados

Cada app tera seu proprio dashboard (`/app/{slug}/dashboard`):

- **CRM Dashboard**: Pipeline, Leads, Oportunidades, Forecast (ja existente, adaptar)
- **Service Dashboard**: Tickets abertos, SLA, Inbox, CSAT (ja existente em `ServiceDashboard.tsx`)
- **Marketing Dashboard**: Campanhas ativas, Metricas, Jornadas (ja existente em `Marketing.tsx`)
- **Commerce Dashboard**: Pedidos, Receita, Devolucoes (novo)
- **ITSM Dashboard**: Incidentes, Mudancas, CMDB (ja existente em `ITDashboard.tsx`)

O dashboard atual unificado (`Dashboard.tsx`) se torna o dashboard do app CRM por padrao.

---

## Fase 6 - Portais e Parceiros (Inalterados)

Os portais `/portal/*` e `/partner/*` permanecem fora do sistema de apps, pois sao acessos externos com layouts proprios (`PortalLayout`, `PartnerLayout`). Nao serao afetados por esta refatoracao.

---

## Fase 7 - Admin e Configuracoes

### 7.1 Admin como Modulo Transversal

As rotas `/admin/platform/*` serao movidas para `/app/{slug}/admin/*` e aparecerao no sidebar de todos os apps (apenas para usuarios com role `admin`).

### 7.2 Configuracoes por App

A pagina de Settings (`/settings`) sera acessivel de qualquer app em `/app/{slug}/settings`.

---

## Resumo Tecnico de Arquivos

### Novos Arquivos (10)

| Arquivo | Descricao |
|---------|-----------|
| `src/config/apps.ts` | Registro central de todos os apps (slug, nome, icone, cor, modulos, sidebar config) |
| `src/hooks/useAppContext.tsx` | Context Provider do app ativo |
| `src/pages/AppLauncher.tsx` | Tela de selecao de apps |
| `src/routes/AppRouter.tsx` | Orquestrador de rotas por app |
| `src/routes/SharedRoutes.tsx` | Rotas transversais (IA, Dados, Admin, Automacoes, Reports) |
| `src/routes/RedirectRoutes.tsx` | Redirects de compatibilidade (URLs antigas -> novas) |
| `src/components/layout/AppSwitcher.tsx` | Componente waffle/grid para trocar de app na topbar |
| `src/components/layout/AppSidebarConfig.ts` | Funcao que gera RAIL_MODULES dinamicamente por app |
| `src/pages/CommerceDashboard.tsx` | Dashboard dedicado do Commerce (novo) |
| `src/index.css` (alteracao) | Variaveis CSS de branding por app |

### Arquivos Modificados (12)

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Nova estrutura de rotas com prefixo `/app/:slug/*` e rota `/apps` |
| `src/pages/Auth.tsx` | Redirecionar para `/apps` apos login |
| `src/components/guards/AuthGuard.tsx` | Redirecionar para `/apps` em vez de `/auth` state from |
| `src/components/guards/ProtectedLayout.tsx` | Injetar AppContext |
| `src/components/layout/AppSidebar.tsx` | Consumir config dinamica do app ativo |
| `src/components/layout/AppTopbar.tsx` | Adicionar AppSwitcher e branding contextual |
| `src/components/layout/AppLayout.tsx` | Passar app context para sidebar |
| `src/routes/SalesRoutes.tsx` | Aceitar prefixo dinamico |
| `src/routes/ServiceRoutes.tsx` | Aceitar prefixo dinamico |
| `src/routes/MarketingRoutes.tsx` | Aceitar prefixo dinamico |
| `src/routes/CommerceRoutes.tsx` | Aceitar prefixo dinamico |
| `src/routes/ITRoutes.tsx` | Aceitar prefixo dinamico |

### Ordem de Implementacao

```text
1. src/config/apps.ts              -- Definicoes de apps
2. src/hooks/useAppContext.tsx      -- Context Provider
3. src/pages/AppLauncher.tsx        -- Tela de selecao
4. src/routes/SharedRoutes.tsx      -- Rotas transversais
5. src/routes/RedirectRoutes.tsx    -- Compatibilidade
6. src/routes/AppRouter.tsx         -- Orquestrador
7. src/components/layout/AppSidebarConfig.ts -- Config sidebar por app
8. src/components/layout/AppSidebar.tsx -- Refatorar sidebar
9. src/components/layout/AppSwitcher.tsx -- Waffle button
10. src/components/layout/AppTopbar.tsx -- Integrar switcher
11. src/App.tsx                     -- Nova estrutura de rotas
12. src/pages/Auth.tsx              -- Redirect para /apps
13. Cada arquivo de rotas           -- Prefixo dinamico
14. src/index.css                   -- CSS de branding por app
15. src/pages/CommerceDashboard.tsx  -- Dashboard commerce
```

Total estimado: **~10 novos arquivos + ~12 arquivos modificados**, mantendo compatibilidade total com a estrutura existente via redirects.
