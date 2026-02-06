

# PLANO DE IMPLEMENTACAO - PROXIMAS EVOLUCOES DO FIREWARE CRM

## Analise Completa do Estado Atual

Apos investigacao profunda do codigo e banco de dados, o sistema atualmente possui:

- **160+ tabelas** no schema `public`
- **97 enums** criados
- **68+ RPCs** implementadas
- **7 Edge Functions** deployadas
- **14 arquivos de rotas** em `src/routes/`
- **80+ paginas** React implementadas
- **21 migrations** SQL executadas

### Status das Fases do PRD

| Fase | Status | Detalhes |
|------|--------|----------|
| 1 - Core Platform | COMPLETA | Tabelas, guards, admin pages, sidebar module-aware |
| 2 - Omnichannel | COMPLETA | Conversations, routing, inbox |
| 3 - WhatsApp/Chat/Voice | COMPLETA | Edge functions, admin pages |
| 4 - AI Agent Studio | COMPLETA (estrutura) | 12 tabelas, edge function, 8 paginas |
| 5 - iPaaS | COMPLETA (estrutura) | 10 tabelas, catalogo, DLQ |
| 6 - Data Hub | COMPLETA (estrutura) | Golden records, activation |
| 7 - Marketing Exec | COMPLETA (estrutura) | Providers, journey engine |
| 8 - Portals | COMPLETA (estrutura) | Partner + Customer expandido |

---

## LACUNAS IDENTIFICADAS (Gap Analysis Detalhado)

### Categoria A: Paginas Stub/Placeholder que Precisam de Dados Reais

Varias paginas foram criadas com UI estatica mas sem integracao com o banco de dados:

1. **PartnerDashboard.tsx** - Mostra valores hardcoded "0" sem queries ao banco
2. **PartnerDeals.tsx** - Lista vazia sem query a `partner_deals`
3. **PartnerDealForm.tsx** - Precisa verificar se faz INSERT em `partner_deals`
4. **PartnerCommissions.tsx** - Placeholder sem query a `partner_commissions`
5. **PartnerResources.tsx** - Completamente estatico
6. **PortalOrders.tsx** - Placeholder sem query a `orders`
7. **PortalInvoices.tsx** - Placeholder sem query (tabela `invoices` nao existe)
8. **PortalReturns.tsx** - Placeholder sem query a `returns`
9. **PortalPreferences.tsx** - UI funcional mas sem persistencia em `contact_preferences`

### Categoria B: Funcionalidades do PRD Ausentes por Completo

1. **CPQ (Configure, Price, Quote)** - Nenhuma tabela ou pagina criada
   - Tabelas ausentes: `cpq_configurations`, `cpq_rules`, `cpq_bundles`, `cpq_discount_rules`
   - Rotas ausentes: `/sales/cpq`

2. **Subscriptions & Billing** - Nenhuma implementacao
   - Tabelas ausentes: `subscriptions`, `subscription_items`, `invoices`, `invoice_items`, `payments_ledger`, `dunning_attempts`
   - Rotas ausentes: `/sales/subscriptions`, `/sales/billing`

3. **Conversation Intelligence** - Nao implementado
   - Tabelas ausentes: `sales_calls`, `call_recordings`, `call_insights`
   - Rotas ausentes: `/sales/conversation-intelligence`

4. **Social Inbox** - Nao implementado
   - Tabelas ausentes: `social_accounts`, `social_messages`, `social_mentions`

5. **QA/Workforce Management** - Nao implementado
   - Tabelas ausentes: `qa_reviews`, `qa_scorecards`, `nps_responses`, `survey_templates`
   - Rota ausente: `/service/qa`

6. **Service Queues UI** - Rota no sidebar mas pagina nao criada
   - Rota ausente: `/service/queues`

7. **Analytics Module Dashboards** - Nao implementado como modulo separado
   - Tabelas ausentes: `dashboards`, `dashboard_widgets`, `report_definitions`, `report_runs`
   - Dashboards por modulo nao existem como paginas dedicadas

8. **Catalog & Pricing Expandido** - Nao implementado
   - Tabelas ausentes: `product_variants`, `price_rules`, `product_bundles`
   - Rota ausente: Commerce pricing engine

9. **Fraud/Risk Commerce** - Nao implementado
   - Tabela ausente: `commerce_risk_signals`

### Categoria C: Edge Functions com Gaps Funcionais

1. **ai-agent-execute** - Tool calls sao simulados, nao executam acoes reais no banco
2. **send-message** - Email SMTP e dispatch real funcional mas sem integracao com provedores reais
3. **journey-processor** - Robusto mas sem scheduling automatico (cron/queue)

### Categoria D: Integracao entre Modulos

1. **Dados do Partner Portal nao conectados** - PartnerDashboard nao carrega dados de `partner_deals` e `partner_commissions`
2. **Portal do Cliente nao carrega pedidos reais** - PortalOrders nao consulta tabela `orders` filtrando pelo contato logado
3. **Golden Records sem link com Customer 360** - As paginas existem separadamente mas nao se referenciam

---

## PLANO DE IMPLEMENTACAO - 5 BLOCOS

### BLOCO 1: Conectar Paginas Stub ao Banco de Dados

**Objetivo:** Transformar todas as paginas placeholder em paginas funcionais com dados reais.

#### 1.1 Partner Portal - Dashboard Funcional
**Arquivo:** `src/pages/partner/PartnerDashboard.tsx`
- Adicionar queries `useQuery` para:
  - Contar `partner_deals` agrupados por status (submitted, approved, won, lost)
  - Somar `partner_commissions` por status (pending, approved, paid)
  - Listar ultimos 5 deals recentes
  - Calcular total de comissoes pendentes e pagas
- Graficos com Recharts: pizza de status de deals, barra de comissoes por mes

#### 1.2 Partner Portal - Deals Funcional
**Arquivo:** `src/pages/partner/PartnerDeals.tsx`
- Query a `partner_deals` com filtros por status, tipo e data
- Tabela com colunas: tipo, lead/oportunidade vinculada, valor, comissao, status
- Botao de nova indicacao funcional

#### 1.3 Partner Portal - Deal Form Funcional
**Arquivo:** `src/pages/partner/PartnerDealForm.tsx`
- Formulario com INSERT em `partner_deals`
- Campos: tipo (lead_referral/co_sell/resale), nome do lead, email, telefone, valor estimado, notas
- Validacao com zod
- Toast de confirmacao

#### 1.4 Partner Portal - Comissoes Funcional
**Arquivo:** `src/pages/partner/PartnerCommissions.tsx`
- Query a `partner_commissions` com JOIN em `partner_deals`
- Tabela com: deal vinculado, valor, status, data de calculo, data de pagamento
- Filtros por status de comissao

#### 1.5 Partner Portal - Recursos Funcional
**Arquivo:** `src/pages/partner/PartnerResources.tsx`
- Query a `partner_entitlements` para mostrar beneficios/recursos do parceiro
- Cards com tipo de beneficio, validade, valor

#### 1.6 Customer Portal - Pedidos
**Arquivo:** `src/pages/portal/PortalOrders.tsx`
- Query a `orders` filtrando pelo `account_id` do portal user logado
- JOIN com `order_items` para detalhes
- Tabela com: numero do pedido, data, status, valor total, itens
- Badge de status colorido

#### 1.7 Customer Portal - Faturas
**Arquivo:** `src/pages/portal/PortalInvoices.tsx`
- Query a `payments` filtrando por orders do account do usuario
- Tabela com: referencia, valor, status, data de vencimento, data de pagamento
- Como nao existe tabela `invoices`, usar `payments` + `orders` como base

#### 1.8 Customer Portal - Devolucoes
**Arquivo:** `src/pages/portal/PortalReturns.tsx`
- Query a `returns` filtrando pelo account do usuario
- Tabela com: numero, pedido original, motivo, status, data
- Botao para solicitar nova devolucao (insert em `returns`)

#### 1.9 Customer Portal - Preferencias com Persistencia
**Arquivo:** `src/pages/portal/PortalPreferences.tsx`
- Conectar switches ao `contact_preferences` via INSERT/UPDATE
- Carregar preferencias existentes no mount
- Salvar no banco ao clicar "Salvar"

---

### BLOCO 2: Modulos Ausentes do PRD (Sales Enterprise)

#### 2.1 CPQ - Database Migration

**Novas tabelas (6):**
- `cpq_product_configurations` - Configuracoes de produto com opcoes e regras
- `cpq_rules` - Regras de compatibilidade e restricao
- `cpq_bundles` - Pacotes de produtos
- `cpq_bundle_items` - Itens dos pacotes
- `cpq_discount_policies` - Politicas de desconto por alcada
- `cpq_price_calculations` - Log de calculos de preco

**Novos enums:**
- `cpq_rule_type`: compatibility, restriction, dependency, pricing
- `cpq_discount_tier`: tier_1, tier_2, tier_3, tier_4

**RLS:** Todas com `is_member_of_org(organization_id)`

#### 2.2 CPQ - Frontend (2 paginas)
- `/sales/cpq` - Lista de configuracoes com filtros, criacao
- `/sales/cpq/:id` - Editor de configuracao com regras, bundles, preco calculado

#### 2.3 Subscriptions & Billing - Database Migration

**Novas tabelas (6):**
- `subscriptions` - Assinaturas com periodo, status, preco
- `subscription_items` - Itens da assinatura
- `invoices` - Faturas com vencimento, status
- `invoice_items` - Itens da fatura
- `payment_ledger` - Livro razao de pagamentos
- `dunning_attempts` - Tentativas de cobranca

**Novos enums:**
- `subscription_status`: trial, active, past_due, cancelled, paused, expired
- `subscription_interval`: monthly, quarterly, semi_annual, annual
- `invoice_status`: draft, pending, paid, overdue, cancelled, void
- `dunning_status`: pending, sent, escalated, resolved, failed

**RPCs:**
- `generate_invoice_number(org_id)` - Gera numero INV-YYYY-NNNNNN

#### 2.4 Subscriptions - Frontend (3 paginas)
- `/sales/subscriptions` - Lista de assinaturas ativas, renovacoes proximas, churn
- `/sales/billing` - Faturas emitidas, status de pagamento, conciliacao
- `/sales/billing/:id` - Detalhe da fatura com itens e historico de pagamento

#### 2.5 Conversation Intelligence - Database Migration

**Novas tabelas (3):**
- `sales_call_recordings` - Metadados de gravacoes de chamadas de vendas
- `call_insights` - Insights extraidos (sentimento, proximos passos, riscos)
- `coaching_notes` - Notas de coaching vinculadas a chamadas

**RLS:** Baseada em `is_member_of_org`

#### 2.6 Conversation Intelligence - Frontend (1 pagina)
- `/sales/conversation-intelligence` - Dashboard com gravacoes recentes, insights, metricas de coaching

---

### BLOCO 3: Service Enterprise (QA, Queues, Social)

#### 3.1 QA/Quality Assurance - Database Migration

**Novas tabelas (4):**
- `qa_scorecards` - Modelos de avaliacao com criterios
- `qa_reviews` - Avaliacoes de interacoes (tickets, conversas)
- `qa_review_criteria` - Criterios individuais da avaliacao
- `nps_surveys` - Pesquisas NPS com respostas

**Novos enums:**
- `qa_review_status`: pending, in_progress, completed
- `qa_rating`: excellent, good, satisfactory, needs_improvement, unsatisfactory

#### 3.2 QA - Frontend (2 paginas)
- `/service/qa` - Dashboard de qualidade com scorecards, avaliacoes recentes, media por agente
- `/service/qa/:id` - Detalhe da avaliacao com criterios e notas

#### 3.3 Service Queues Management - Frontend (1 pagina)
- `/service/queues` - Gestao de filas de atendimento (ja existe tabela `routing_queues`)
- Visualizacao de filas, membros, capacidade, metricas em tempo real
- Acoes: criar fila, adicionar/remover membros, ajustar prioridade

#### 3.4 Social Inbox - Database Migration

**Novas tabelas (3):**
- `social_accounts` - Contas de redes sociais conectadas
- `social_messages` - Mensagens recebidas (DMs, mencoes)
- `social_mentions` - Mencoes da marca

**Novo enum:**
- `social_platform`: instagram, facebook, twitter, linkedin

#### 3.5 Social Inbox - Frontend (1 pagina)
- `/service/social` - Inbox de mensagens sociais integrado ao sistema de conversas

---

### BLOCO 4: Analytics Module + Revenue Ops Dashboards

#### 4.1 Analytics Engine - Database Migration

**Novas tabelas (4):**
- `dashboards` - Dashboards customizaveis por modulo/usuario
- `dashboard_widgets` - Widgets individuais com tipo e configuracao
- `report_definitions` - Definicoes de relatorios salvos
- `report_runs` - Historico de execucoes de relatorios

**Novos enums:**
- `widget_type`: kpi_card, bar_chart, line_chart, pie_chart, table, funnel, gauge
- `report_format`: pdf, csv, xlsx, json

#### 4.2 Sales Revenue Ops Dashboard - Frontend (1 pagina)
- `/sales/revenue-ops` - Dashboard executivo com:
  - Pipeline hygiene (deals sem atividade, probabilidades desatualizadas)
  - Win/loss analysis por vendedor, territorio, segmento
  - Velocity metrics (tempo medio por estagio)
  - Forecast accuracy (previsao vs real)
  - Churn risk (se assinaturas existirem)

#### 4.3 Service Analytics Dashboard - Frontend (1 pagina)
- `/service/analytics` - Dashboard operacional com:
  - SLA compliance por fila e canal
  - Backlog trends
  - First Contact Resolution (FCR)
  - CSAT/NPS por periodo
  - Tempo medio de resposta e resolucao

#### 4.4 AI Analytics Dashboard - Frontend (1 pagina)
- `/ai/analytics` - Dashboard de uso de IA:
  - Runs por agente e por dia
  - Taxa de sucesso/falha
  - Tokens consumidos vs limite
  - Aprovacoes pendentes (human-in-the-loop)
  - Bloqueios por policy

---

### BLOCO 5: Correcoes e Melhorias Transversais

#### 5.1 AI Agent Tools - Execucao Real
Atualizar `ai-agent-execute` Edge Function para que tool calls executem acoes reais:
- `search_knowledge_base` - Query real em `knowledge_articles`
- `get_customer_info` - Query real em `contacts`/`accounts`
- `create_ticket` - INSERT real em `tickets` com numeracao
- `update_opportunity` - UPDATE real em `opportunities`
- `detect_duplicates` - Chamar RPC `detect_duplicates` real
- Cada tool call gera audit receipt com dados reais

#### 5.2 Sales Routes Update
Adicionar novas rotas no `SalesRoutes.tsx`:
- `/sales/cpq` e `/sales/cpq/:id`
- `/sales/subscriptions`
- `/sales/billing` e `/sales/billing/:id`
- `/sales/conversation-intelligence`
- `/sales/revenue-ops`

#### 5.3 Service Routes Update
Adicionar novas rotas no `ServiceRoutes.tsx`:
- `/service/queues`
- `/service/qa` e `/service/qa/:id`
- `/service/social`
- `/service/analytics`

#### 5.4 AI Routes Update
Adicionar nova rota no `AIRoutes.tsx`:
- `/ai/analytics`

#### 5.5 Sidebar Expansion
Atualizar `AppSidebar.tsx` para incluir novos links:
- Vendas: CPQ, Assinaturas, Faturamento, Conv. Intelligence, Revenue Ops
- Atendimento: Filas, QA, Social, Analytics
- IA: Analytics

#### 5.6 Correcao do AIRoutes
O `AIRoutes.tsx` atualmente retorna `<>` (Fragment) enquanto todas as outras rotas retornam arrays. Padronizar para retornar array como `SalesRoutes`.

---

## SEQUENCIA DE IMPLEMENTACAO

```text
PASSO 1: Bloco 5.6 (Correcao AIRoutes) + Bloco 1 (Paginas Stub)
  - Corrigir AIRoutes para retornar array
  - Conectar todos os 9 stubs ao banco de dados
  - Nao requer migrations

PASSO 2: Bloco 2 (CPQ + Billing + Conv Intelligence)
  - Migration SQL com ~15 tabelas e ~8 enums
  - 6 novas paginas React
  - Update de SalesRoutes e Sidebar

PASSO 3: Bloco 3 (QA + Queues + Social)
  - Migration SQL com ~7 tabelas e ~3 enums
  - 4 novas paginas React
  - Update de ServiceRoutes e Sidebar

PASSO 4: Bloco 4 (Analytics Dashboards)
  - Migration SQL com 4 tabelas
  - 3 novas paginas de dashboards
  - Update de rotas e sidebar

PASSO 5: Bloco 5.1 (AI Tool Execution Real)
  - Refatorar ai-agent-execute Edge Function
  - Adicionar tool executors reais
  - Testar com playground
```

---

## TOTAIS ESTIMADOS

| Item | Quantidade |
|------|-----------|
| Novas tabelas | ~26 |
| Novos enums | ~15 |
| Novas RPCs | ~3 |
| Paginas stub refatoradas | 9 |
| Novas paginas | ~14 |
| Edge Functions atualizadas | 1 |
| Rotas atualizadas | 4 |

## PADROES OBRIGATORIOS

1. Toda nova tabela: `id uuid PK`, `organization_id FK`, `created_at`, `updated_at`, RLS habilitado
2. RLS: Policies baseadas em `is_member_of_org()`, sem `USING (true)` em operacoes criticas
3. Funcoes SQL: `SECURITY DEFINER SET search_path TO 'public'`
4. Frontend: Componentes shadcn/radix, hooks `useQuery`/`useMutation`, toast para feedback, `ptBR` locale
5. Todas as paginas dentro de `AppLayout` (exceto portais que usam seus layouts proprios)

