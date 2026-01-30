
# Analise de Gap Atualizada: Fireware CRM vs PRD Completo

## Sumario Executivo Atualizado

Apos analise detalhada do codebase atual, com as Fases 7 (Automations) e 8 (Marketing) implementadas:

| Modulo | % Completude | Status |
|--------|-------------|--------|
| **Fireware Sales** | 95% | Quase completo |
| **Fireware Service** | 75% | Portal do cliente pendente |
| **Fireware Marketing** | 90% | Implementado (Fase 8) |
| **Fireware Commerce** | 0% | Nao iniciado |
| **Fireware IT (ITSM)** | 0% | Nao iniciado |
| **Fireware Data** | 45% | Customer 360 parcial |
| **Fireware Automations** | 95% | Implementado (Fase 7) |
| **Fireware Governance** | 80% | LGPD e roles implementados |

---

## PARTE 1: O QUE JA ESTA IMPLEMENTADO

### Fireware Sales (95%)
- Leads, Accounts, Contacts com CRUD completo
- Opportunities com Kanban e gestao de stakeholders
- Quotes com builder e calculos automaticos
- Contracts com lifecycle completo
- Territories e Cadences
- Forecast e Reports
- Timeline unificada
- Global Search
- CSV Import/Export
- Approval workflows

### Fireware Service (75%)
- Tickets com SLA tracking
- Knowledge Base com versionamento
- Service Dashboard com KPIs
- Ticket Messages e Timeline
- Categories, Queues, SLAs configurados
- CSAT Responses
- Customer Success com Health Score

### Fireware Marketing (90%)
- Campaigns multicanal (email, sms, whatsapp)
- Campaign Members com tracking
- Segments com builder de regras
- Journeys com builder visual
- Journey Steps e Enrollments
- Email Templates
- Marketing Consents
- Marketing Events e Forms

### Fireware Automations (95%)
- Workflows com triggers variados
- Workflow Steps (condition, action, delay, etc.)
- Workflow Runs com logging
- Step Executions
- Workflow Templates
- Workflow Schedules
- Visual Workflow Builder

### Fireware Governance (80%)
- User Roles separado (seguranca)
- LGPD Requests
- Data Retention Policies
- Consent Log
- Audit Logs completo
- Customer Health Scores
- Customer Playbooks

---

## PARTE 2: O QUE AINDA FALTA IMPLEMENTAR

### 2.1 Fireware Service - Pendencias (25%)

**Portal do Cliente (0%)**

```text
Tabelas necessarias:
- customer_portal_users
  - id, contact_id, email, password_hash
  - is_active, last_login, created_at

- portal_sessions
  - id, portal_user_id, token, expires_at

UI necessaria:
- /portal - Landing page publica
- /portal/login - Login do cliente
- /portal/tickets - Meus tickets
- /portal/ticket/:id - Ver ticket e enviar mensagens
- /portal/new-ticket - Abrir novo ticket
- /portal/knowledge - Base de conhecimento publica
```

**Canned Responses UI (0%)**

```text
A tabela canned_responses existe no banco, mas nao ha:
- UI em Settings para gerenciar macros
- Componente no TicketDetail para inserir macros rapidamente
- Dropdown de selecao de resposta pre-definida
```

### 2.2 Fireware Commerce (0% - Modulo Completo)

**Schema de Banco Necessario:**

```sql
-- Enums
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 
  'delivered', 'cancelled', 'refunded'
);
CREATE TYPE payment_status AS ENUM (
  'pending', 'authorized', 'captured', 'failed', 
  'refunded', 'partially_refunded'
);
CREATE TYPE shipment_status AS ENUM (
  'preparing', 'shipped', 'in_transit', 
  'out_for_delivery', 'delivered', 'returned'
);
CREATE TYPE return_status AS ENUM (
  'requested', 'approved', 'rejected', 'received', 
  'refunded', 'completed'
);
CREATE TYPE promotion_type AS ENUM (
  'percentage', 'fixed', 'buy_x_get_y', 'free_shipping'
);

-- Carrinhos
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  account_id UUID REFERENCES accounts(id),
  contact_id UUID REFERENCES contacts(id),
  session_id TEXT,
  status TEXT DEFAULT 'active',
  subtotal NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0,
  shipping_total NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  coupon_code TEXT,
  notes TEXT,
  expires_at TIMESTAMPTZ,
  converted_to_order_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do Carrinho
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  sku TEXT,
  quantity INT DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  order_number TEXT NOT NULL UNIQUE,
  account_id UUID REFERENCES accounts(id),
  contact_id UUID REFERENCES contacts(id),
  status order_status DEFAULT 'pending',
  subtotal NUMERIC NOT NULL,
  discount_total NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0,
  shipping_total NUMERIC DEFAULT 0,
  grand_total NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  shipping_address JSONB,
  billing_address JSONB,
  payment_method TEXT,
  payment_status payment_status DEFAULT 'pending',
  shipping_method TEXT,
  tracking_number TEXT,
  estimated_delivery TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  customer_notes TEXT,
  internal_notes TEXT,
  source TEXT DEFAULT 'web',
  cart_id UUID REFERENCES carts(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do Pedido
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  sku TEXT,
  quantity INT NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  order_id UUID REFERENCES orders(id),
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  status payment_status DEFAULT 'pending',
  gateway TEXT,
  transaction_id TEXT,
  gateway_response JSONB,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Envios
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  status shipment_status DEFAULT 'preparing',
  estimated_delivery TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  weight NUMERIC,
  dimensions JSONB,
  cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Devolucoes
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  return_number TEXT NOT NULL,
  status return_status DEFAULT 'requested',
  reason TEXT NOT NULL,
  items JSONB NOT NULL,
  refund_amount NUMERIC,
  refund_method TEXT,
  refunded_at TIMESTAMPTZ,
  notes TEXT,
  requested_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Promocoes
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT,
  type promotion_type NOT NULL,
  value NUMERIC,
  min_purchase NUMERIC,
  max_discount NUMERIC,
  usage_limit INT,
  used_count INT DEFAULT 0,
  applies_to TEXT DEFAULT 'all',
  applies_to_ids UUID[],
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**UI Necessaria:**
- /orders - Lista de pedidos
- /orders/new - Criar pedido manual
- /orders/:id - Detalhe do pedido
- /orders/:id/edit - Editar pedido
- /commerce/catalog - Catalogo B2B
- /commerce/cart/:id - Visualizar carrinho
- /returns - Lista de devolucoes
- /returns/:id - Detalhe da devolucao
- /promotions - Lista de promocoes
- /promotions/new - Criar promocao
- /promotions/:id - Editar promocao

### 2.3 Fireware IT / ITSM (0% - Modulo Completo)

**Schema de Banco Necessario:**

```sql
-- Enums
CREATE TYPE it_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE it_impact AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE it_urgency AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM (
  'new', 'in_progress', 'pending', 'on_hold', 
  'resolved', 'closed', 'cancelled'
);
CREATE TYPE problem_status AS ENUM (
  'logged', 'analysis', 'known_error', 
  'resolution_identified', 'resolved', 'closed'
);
CREATE TYPE change_type AS ENUM ('standard', 'normal', 'emergency');
CREATE TYPE change_status AS ENUM (
  'draft', 'submitted', 'assessment', 'approval', 
  'scheduled', 'implementing', 'review', 
  'completed', 'cancelled', 'failed'
);
CREATE TYPE ci_type AS ENUM (
  'server', 'application', 'database', 'network', 
  'storage', 'service', 'workstation', 'mobile'
);
CREATE TYPE ci_status AS ENUM (
  'active', 'inactive', 'maintenance', 
  'retired', 'planned'
);
CREATE TYPE asset_type AS ENUM ('hardware', 'software', 'license');
CREATE TYPE asset_status AS ENUM (
  'available', 'in_use', 'maintenance', 
  'retired', 'disposed', 'lost'
);

-- Incidentes
CREATE TABLE it_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  incident_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  priority it_priority DEFAULT 'medium',
  impact it_impact DEFAULT 'medium',
  urgency it_urgency DEFAULT 'medium',
  status incident_status DEFAULT 'new',
  reported_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  assignment_group UUID REFERENCES teams(id),
  affected_service TEXT,
  affected_accounts UUID[],
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  sla_id UUID,
  sla_due_at TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,
  related_incidents UUID[],
  related_problem_id UUID,
  root_cause TEXT,
  workaround TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Requisicoes de Servico
CREATE TABLE it_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  request_number TEXT NOT NULL,
  catalog_item_id UUID,
  type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  requester_id UUID REFERENCES profiles(id),
  for_user_id UUID REFERENCES profiles(id),
  priority it_priority DEFAULT 'medium',
  status incident_status DEFAULT 'new',
  assigned_to UUID REFERENCES profiles(id),
  fulfillment_notes TEXT,
  fulfilled_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Problemas
CREATE TABLE it_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  problem_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority it_priority DEFAULT 'medium',
  status problem_status DEFAULT 'logged',
  related_incidents UUID[],
  root_cause TEXT,
  workaround TEXT,
  permanent_fix TEXT,
  assigned_to UUID REFERENCES profiles(id),
  known_error_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Mudancas (Change Management)
CREATE TABLE it_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  change_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type change_type DEFAULT 'normal',
  category TEXT,
  priority it_priority DEFAULT 'medium',
  status change_status DEFAULT 'draft',
  risk_level TEXT DEFAULT 'medium',
  impact_analysis TEXT,
  implementation_plan TEXT,
  rollback_plan TEXT,
  test_plan TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  requested_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  cab_required BOOLEAN DEFAULT false,
  approvers UUID[],
  approvals JSONB DEFAULT '[]',
  affected_services TEXT[],
  affected_cis UUID[],
  related_incidents UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CMDB Items
CREATE TABLE cmdb_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  ci_number TEXT NOT NULL,
  name TEXT NOT NULL,
  type ci_type NOT NULL,
  status ci_status DEFAULT 'active',
  criticality TEXT DEFAULT 'medium',
  description TEXT,
  owner_id UUID REFERENCES profiles(id),
  support_team_id UUID REFERENCES teams(id),
  location TEXT,
  environment TEXT,
  version TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  ip_address TEXT,
  attributes JSONB DEFAULT '{}',
  documentation_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Relacionamentos CMDB
CREATE TABLE cmdb_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ci_id UUID NOT NULL REFERENCES cmdb_items(id) ON DELETE CASCADE,
  target_ci_id UUID NOT NULL REFERENCES cmdb_items(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ativos de TI
CREATE TABLE it_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  asset_tag TEXT NOT NULL,
  name TEXT NOT NULL,
  type asset_type NOT NULL,
  category TEXT,
  status asset_status DEFAULT 'available',
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  location TEXT,
  assigned_to UUID REFERENCES profiles(id),
  department TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC,
  warranty_expiry DATE,
  depreciation_method TEXT,
  current_value NUMERIC,
  license_key TEXT,
  license_seats INT,
  license_expiry DATE,
  notes TEXT,
  cmdb_item_id UUID REFERENCES cmdb_items(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Catalogo de Servicos IT
CREATE TABLE it_service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT,
  estimated_time TEXT,
  sla_id UUID,
  approval_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  form_schema JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**UI Necessaria:**
- /it - Dashboard ITSM
- /it/incidents - Lista de incidentes
- /it/incidents/new - Criar incidente
- /it/incidents/:id - Detalhe do incidente
- /it/requests - Requisicoes de servico
- /it/requests/new - Nova requisicao
- /it/problems - Lista de problemas
- /it/problems/:id - Detalhe do problema
- /it/changes - Gestao de mudancas
- /it/changes/new - Criar mudanca
- /it/changes/:id - Detalhe da mudanca (com aprovacoes)
- /it/cmdb - Explorer CMDB (visualizacao de grafo)
- /it/cmdb/:id - Detalhe do CI
- /it/assets - Inventario de ativos
- /it/assets/new - Cadastrar ativo
- /it/assets/:id - Detalhe do ativo
- /it/catalog - Catalogo de servicos

### 2.4 Fireware Data - Pendencias (55%)

**Ja implementado:**
- timeline_events
- customer_health_scores
- Graficos e reports basicos

**Schema Faltando:**

```sql
-- Identidades Unificadas (Customer 360 avancado)
CREATE TABLE customer_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  primary_account_id UUID REFERENCES accounts(id),
  primary_contact_id UUID REFERENCES contacts(id),
  identifiers JSONB NOT NULL,
  merge_history JSONB DEFAULT '[]',
  confidence_score NUMERIC DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Solicitacoes de Merge
CREATE TABLE merge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  source_ids UUID[] NOT NULL,
  target_id UUID,
  status TEXT DEFAULT 'pending',
  requested_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  merge_rules JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Eventos de Comportamento
CREATE TABLE behavioral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  event_name TEXT NOT NULL,
  event_category TEXT,
  contact_id UUID REFERENCES contacts(id),
  lead_id UUID REFERENCES leads(id),
  account_id UUID REFERENCES accounts(id),
  session_id TEXT,
  properties JSONB DEFAULT '{}',
  source TEXT,
  page_url TEXT,
  referrer TEXT,
  device_info JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attribution (Atribuicao de Marketing)
CREATE TABLE marketing_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  opportunity_id UUID REFERENCES opportunities(id),
  contact_id UUID REFERENCES contacts(id),
  lead_id UUID REFERENCES leads(id),
  campaign_id UUID REFERENCES campaigns(id),
  journey_id UUID REFERENCES journeys(id),
  touchpoint_type TEXT,
  touchpoint_date TIMESTAMPTZ,
  attribution_model TEXT,
  attribution_weight NUMERIC,
  revenue_attributed NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**UI Necessaria:**
- Painel de duplicatas detectadas
- Wizard de merge com preview
- Funil completo (marketing > sales > service)
- Attribution dashboard
- Customer 360 unificado com todas as interacoes

### 2.5 Fireware Service - Complementos

**Macros/Canned Responses UI:**

```text
Componentes necessarios:
1. Em Settings: Tab "Respostas Rapidas"
   - CRUD de canned_responses
   - Categorias de macros
   - Variaveis ({{ticket.number}}, {{contact.name}})

2. Em TicketDetail: 
   - Dropdown "Inserir Macro" no composer
   - Preview com variaveis substituidas
   - Atalho de teclado
```

---

## PARTE 3: ROADMAP DE IMPLEMENTACAO

### Fase 9: Fireware Commerce (Alta Prioridade)

```text
Estimativa: 3-4 sessoes

Itens:
1. Database Migration
   - Enums (order_status, payment_status, etc.)
   - Tabelas (carts, cart_items, orders, order_items)
   - Tabelas (payments, shipments, returns, promotions)
   - RLS policies para todas as tabelas

2. Funcoes SQL
   - generate_order_number(org_id)
   - calculate_cart_totals()
   - apply_promotion(cart_id, code)

3. Frontend
   - Orders.tsx (lista com filtros)
   - OrderDetail.tsx (status, timeline, acoes)
   - OrderForm.tsx (criacao manual)
   - Returns.tsx (lista e gestao)
   - ReturnDetail.tsx
   - Promotions.tsx (CRUD)
   - PromotionForm.tsx
```

### Fase 10: Fireware IT / ITSM (Media Prioridade)

```text
Estimativa: 4-5 sessoes

Itens:
1. Database Migration
   - Enums IT (it_priority, incident_status, etc.)
   - Tabelas principais (it_incidents, it_requests, it_problems)
   - Change Management (it_changes com aprovacoes)
   - CMDB (cmdb_items, cmdb_relationships)
   - Assets (it_assets, it_service_catalog)
   - RLS policies

2. Funcoes SQL
   - generate_incident_number(org_id)
   - generate_change_number(org_id)
   - calculate_priority_matrix(impact, urgency)

3. Frontend
   - ITDashboard.tsx (KPIs, tickets, mudancas)
   - Incidents.tsx, IncidentForm.tsx, IncidentDetail.tsx
   - Requests.tsx, RequestForm.tsx
   - Problems.tsx, ProblemDetail.tsx
   - Changes.tsx, ChangeForm.tsx (com CAB approval)
   - CMDBExplorer.tsx (visualizacao de grafo)
   - CMDBItemDetail.tsx
   - Assets.tsx, AssetForm.tsx, AssetDetail.tsx
   - ServiceCatalog.tsx
```

### Fase 11: Fireware Data Avancado (Baixa Prioridade)

```text
Estimativa: 2 sessoes

Itens:
1. Database Migration
   - customer_identities
   - merge_requests
   - behavioral_events
   - marketing_attribution

2. Frontend
   - DuplicatesPanel.tsx
   - MergeWizard.tsx
   - FullFunnel.tsx (Marketing > Sales > Service)
   - AttributionDashboard.tsx
   - Customer360Enhanced.tsx
```

### Fase 12: Finalizacao Service (Baixa Prioridade)

```text
Estimativa: 2 sessoes

Itens:
1. Customer Portal (opcional)
   - Portal auth separado
   - UI publica para tickets/knowledge

2. Canned Responses UI
   - Settings tab
   - Ticket composer dropdown
```

---

## RESUMO DE ESFORCO ATUALIZADO

| Modulo | % Atual | % Alvo | Esforco | Sessoes |
|--------|---------|--------|---------|---------|
| Sales | 95% | 100% | Baixo | 0.5 |
| Service | 75% | 100% | Medio | 2 |
| Marketing | 90% | 100% | Baixo | 0.5 |
| **Commerce** | 0% | 100% | **Alto** | **4** |
| **IT/ITSM** | 0% | 100% | **Alto** | **5** |
| Data | 45% | 100% | Medio | 2 |
| Automations | 95% | 100% | Baixo | 0.5 |
| Governance | 80% | 100% | Baixo | 0.5 |

**Total estimado para 100% do PRD: 12-15 sessoes de desenvolvimento**

---

## PROXIMOS PASSOS RECOMENDADOS

1. **Fase 9: Fireware Commerce** - Modulo critico para e-commerce B2B/B2C
   - Pedidos, pagamentos, envios, devolucoes
   - Integra com Products ja existente

2. **Fase 10: Fireware IT/ITSM** - Modulo enterprise para gestao de TI
   - Incidentes, requisicoes, problemas, mudancas
   - CMDB e gestao de ativos

3. **Fase 11: Fireware Data Avancado** - Customer 360 completo
   - Identidade unificada, merge, behavioral events
   - Attribution tracking

4. **Fase 12: Finalizacoes** - Polish e features opcionais
   - Customer Portal para Service
   - Canned Responses UI
   - Minor fixes

---

## NOTA TECNICA

O sistema ja possui:
- Arquitetura multi-tenant robusta
- RLS em todas as tabelas
- User roles separado (seguranca)
- Audit logging completo
- Timeline unificada
- Automations engine

Os modulos pendentes (Commerce e IT) seguirao os mesmos padroes ja estabelecidos.
