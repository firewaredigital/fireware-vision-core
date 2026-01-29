
# Análise de Gap Completa: Fireware CRM vs PRD

## Sumário Executivo

Após análise detalhada do codebase atual, o sistema Fireware CRM possui:
- **Fireware Sales**: ~95% completo (Fases 1-4 implementadas)
- **Fireware Service**: ~70% completo (Fase 5 parcialmente implementada)
- **Fireware Marketing**: 0% (não iniciado)
- **Fireware Commerce**: 0% (não iniciado)
- **Fireware IT**: 0% (não iniciado)
- **Fireware Data**: ~40% (parcialmente implementado via timeline_events)
- **Fireware Automations**: ~20% (approval_requests existe, falta workflow engine)
- **Fireware Governance**: ~50% (audit_logs e RLS implementados)

---

## PARTE 1: O QUE JÁ ESTÁ IMPLEMENTADO

### Módulo 1: Fireware Sales (95%)

**Database (Completo):**
- organizations, profiles, teams, territories
- accounts, contacts, leads (com scoring e conversão)
- opportunities, opportunity_stages, opportunity_contacts
- quotes, quote_items, products, price_lists, price_list_items
- contracts (com lifecycle completo)
- activities, notes, cadences, cadence_steps, cadence_enrollments
- forecasts, timeline_events
- approval_requests, attachments, routing_rules, assignment_log
- notifications, audit_logs

**Frontend (Completo):**
- Dashboard com KPIs e gráficos
- CRUD completo para todas entidades
- Kanban de oportunidades com drag-drop
- Quote builder com cálculos
- Gestão de territórios e cadências
- Forecast com períodos
- Busca global (GlobalSearch.tsx)
- CSV Import/Export
- Timeline unificada
- Alertas de deals obsoletos (StaleDealAlerts.tsx)
- Widgets de atividades e notas

### Módulo 2: Fireware Service (70%)

**Database (Completo):**
- tickets (com todos os campos de SLA)
- ticket_categories, ticket_queues, ticket_slas
- ticket_messages, ticket_watchers, ticket_status_history
- knowledge_articles, knowledge_categories
- article_versions, article_feedback
- csat_responses, canned_responses
- Triggers para SLA e status tracking

**Frontend (Parcialmente Completo):**
- Tickets.tsx (lista com filtros)
- TicketDetail.tsx (detalhe com mensagens)
- TicketForm.tsx (criação/edição)
- Knowledge.tsx (lista de artigos)
- ArticleDetail.tsx e ArticleForm.tsx
- ServiceDashboard.tsx (métricas)
- Componentes: SLACountdown, TicketStatusBadge, TicketPriorityBadge

---

## PARTE 2: O QUE AINDA FALTA IMPLEMENTAR

### 2.1 Fireware Service - Pendências (30%)

**Portal do Cliente (0%):**
```text
Tabelas necessárias:
- customer_portal_users (login separado para clientes)
- portal_sessions

UI necessária:
- /portal - Landing page
- /portal/tickets - Meus tickets
- /portal/ticket/:id - Ver ticket
- /portal/new-ticket - Abrir ticket
- /portal/knowledge - Base de conhecimento pública
```

**Customer Success / Health Score (0%):**
```text
Tabelas necessárias:
- customer_health_scores
  - account_id, score, factors (jsonb)
  - last_calculated_at, trend

- customer_playbooks
  - name, type (onboarding, renewal, expansion, risk)
  - steps, triggers

- playbook_enrollments
  - account_id, playbook_id, status, current_step

UI necessária:
- Health score widget na conta
- Playbooks configuração em Settings
- Dashboard de CS com accounts em risco
```

**Macros/Respostas Rápidas UI (0%):**
- A tabela canned_responses existe mas não há UI
- Necessário componente para inserir macros no ticket

---

### 2.2 Fireware Marketing (0% - Módulo Completo)

**Database (Nenhuma tabela existe):**

```sql
-- Campanhas
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  type campaign_type NOT NULL, -- email, sms, whatsapp, push
  status campaign_status DEFAULT 'draft',
  subject TEXT,
  content TEXT,
  content_html TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget NUMERIC,
  actual_cost NUMERIC DEFAULT 0,
  sent_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  unsubscribe_count INT DEFAULT 0,
  bounce_count INT DEFAULT 0,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Membros de Campanha
CREATE TABLE campaign_members (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  contact_id UUID REFERENCES contacts(id),
  lead_id UUID REFERENCES leads(id),
  status TEXT DEFAULT 'pending', -- pending, sent, opened, clicked, converted, unsubscribed, bounced
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Segmentos
CREATE TABLE segments (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'dynamic', -- static, dynamic
  filters JSONB DEFAULT '[]',
  member_count INT DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Regras de Segmento
CREATE TABLE segment_rules (
  id UUID PRIMARY KEY,
  segment_id UUID REFERENCES segments(id),
  field TEXT NOT NULL,
  operator TEXT NOT NULL, -- equals, not_equals, contains, greater_than, etc
  value TEXT,
  logic TEXT DEFAULT 'and', -- and, or
  sort_order INT DEFAULT 0
);

-- Jornadas (Journey Builder)
CREATE TABLE journeys (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- segment_entry, event, manual, scheduled
  trigger_config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft', -- draft, active, paused, archived
  entry_count INT DEFAULT 0,
  conversion_count INT DEFAULT 0,
  goal_type TEXT,
  goal_config JSONB,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Steps da Jornada
CREATE TABLE journey_steps (
  id UUID PRIMARY KEY,
  journey_id UUID REFERENCES journeys(id),
  step_order INT NOT NULL,
  type TEXT NOT NULL, -- email, sms, wait, condition, split, goal, action
  name TEXT,
  config JSONB DEFAULT '{}', -- template_id, delay_days, conditions, etc
  next_step_on_success UUID REFERENCES journey_steps(id),
  next_step_on_failure UUID REFERENCES journey_steps(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inscrições na Jornada
CREATE TABLE journey_enrollments (
  id UUID PRIMARY KEY,
  journey_id UUID REFERENCES journeys(id),
  contact_id UUID REFERENCES contacts(id),
  lead_id UUID REFERENCES leads(id),
  current_step_id UUID REFERENCES journey_steps(id),
  status TEXT DEFAULT 'active', -- active, completed, exited, paused
  entered_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,
  exit_reason TEXT
);

-- Consentimentos LGPD
CREATE TABLE consents (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  contact_id UUID REFERENCES contacts(id),
  lead_id UUID REFERENCES leads(id),
  channel TEXT NOT NULL, -- email, sms, whatsapp, phone, push
  status TEXT NOT NULL, -- opted_in, opted_out
  legal_basis TEXT,
  purpose TEXT,
  source TEXT,
  ip_address TEXT,
  consented_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Templates de Email
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**UI Necessária:**
- /marketing - Dashboard Marketing
- /campaigns - Lista de campanhas
- /campaigns/:id - Detalhe/Editor
- /segments - Segmentos
- /segments/:id - Builder de regras
- /journeys - Lista de jornadas
- /journeys/:id - Journey Builder (drag-drop canvas)
- /templates - Templates de email
- /consents - Centro de preferências

---

### 2.3 Fireware Commerce (0% - Módulo Completo)

**Database (Nenhuma tabela existe):**

```sql
-- Carrinhos
CREATE TABLE carts (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  account_id UUID REFERENCES accounts(id),
  contact_id UUID REFERENCES contacts(id),
  session_id TEXT, -- para guests
  status TEXT DEFAULT 'active', -- active, abandoned, converted
  subtotal NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  coupon_code TEXT,
  expires_at TIMESTAMPTZ,
  converted_to_order_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do Carrinho
CREATE TABLE cart_items (
  id UUID PRIMARY KEY,
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  sku TEXT,
  quantity INT DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
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
  -- Endereços
  shipping_address JSONB,
  billing_address JSONB,
  -- Pagamento
  payment_method TEXT,
  payment_status payment_status DEFAULT 'pending',
  -- Entrega
  shipping_method TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  -- Notas
  customer_notes TEXT,
  internal_notes TEXT,
  -- Metadata
  source TEXT DEFAULT 'web',
  cart_id UUID REFERENCES carts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do Pedido
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  sku TEXT,
  quantity INT NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL
);

-- Pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  order_id UUID REFERENCES orders(id),
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL, -- credit_card, debit, pix, boleto, transfer
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
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
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

-- Devoluções
CREATE TABLE returns (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  order_id UUID REFERENCES orders(id),
  return_number TEXT NOT NULL,
  status return_status DEFAULT 'requested',
  reason TEXT NOT NULL,
  items JSONB NOT NULL, -- [{order_item_id, quantity, reason}]
  refund_amount NUMERIC,
  refund_method TEXT,
  refunded_at TIMESTAMPTZ,
  notes TEXT,
  requested_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Promoções
CREATE TABLE promotions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT,
  type promotion_type NOT NULL, -- percentage, fixed, buy_x_get_y, free_shipping
  value NUMERIC,
  min_purchase NUMERIC,
  max_discount NUMERIC,
  usage_limit INT,
  used_count INT DEFAULT 0,
  applies_to TEXT DEFAULT 'all', -- all, categories, products
  applies_to_ids UUID[],
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**UI Necessária:**
- /orders - Lista de pedidos
- /orders/:id - Detalhe do pedido
- /commerce/cart/:id - Visualizar carrinho
- /commerce/checkout - Checkout flow
- /commerce/catalog - Catálogo B2B
- /returns - Devoluções
- /promotions - Promoções/Cupons

---

### 2.4 Fireware IT / ITSM (0% - Módulo Completo)

**Database (Nenhuma tabela existe):**

```sql
-- Incidentes
CREATE TABLE it_incidents (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  incident_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  priority it_priority DEFAULT 'medium',
  impact it_impact DEFAULT 'medium',
  urgency it_urgency DEFAULT 'medium',
  status it_status DEFAULT 'new',
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Requisições de Serviço
CREATE TABLE it_requests (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  request_number TEXT NOT NULL,
  catalog_item_id UUID,
  type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  requester_id UUID REFERENCES profiles(id),
  for_user_id UUID REFERENCES profiles(id),
  priority it_priority DEFAULT 'medium',
  status it_status DEFAULT 'new',
  assigned_to UUID REFERENCES profiles(id),
  fulfillment_notes TEXT,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Problemas
CREATE TABLE it_problems (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mudanças (Change Management)
CREATE TABLE it_changes (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  change_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type change_type DEFAULT 'normal', -- standard, normal, emergency
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
  related_incidents UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CMDB Items (Configuration Items)
CREATE TABLE cmdb_items (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  ci_number TEXT NOT NULL,
  name TEXT NOT NULL,
  type ci_type NOT NULL, -- server, application, database, network, storage, service
  status ci_status DEFAULT 'active',
  criticality TEXT DEFAULT 'medium',
  description TEXT,
  owner_id UUID REFERENCES profiles(id),
  support_team_id UUID REFERENCES teams(id),
  location TEXT,
  environment TEXT, -- production, staging, development
  version TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  ip_address TEXT,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Relacionamentos CMDB
CREATE TABLE cmdb_relationships (
  id UUID PRIMARY KEY,
  source_ci_id UUID REFERENCES cmdb_items(id) ON DELETE CASCADE,
  target_ci_id UUID REFERENCES cmdb_items(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- depends_on, hosts, connects_to, uses, part_of
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ativos de TI
CREATE TABLE it_assets (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  asset_tag TEXT NOT NULL,
  name TEXT NOT NULL,
  type asset_type NOT NULL, -- hardware, software, license
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
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**UI Necessária:**
- /it - Dashboard ITSM
- /it/incidents - Incidentes
- /it/incidents/:id - Detalhe
- /it/requests - Requisições
- /it/problems - Problemas
- /it/changes - Mudanças (com board de aprovação)
- /it/cmdb - Explorer CMDB
- /it/assets - Inventário de ativos

---

### 2.5 Fireware Data - Pendências (60%)

**Já implementado:**
- timeline_events (Customer 360 básico)
- Gráficos e reports básicos

**Faltando:**

```sql
-- Identidades Unificadas
CREATE TABLE customer_identities (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  primary_account_id UUID REFERENCES accounts(id),
  primary_contact_id UUID REFERENCES contacts(id),
  identifiers JSONB NOT NULL, -- {emails: [], phones: [], documents: [], external_ids: {}}
  merge_history JSONB DEFAULT '[]',
  confidence_score NUMERIC DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Solicitações de Merge
CREATE TABLE merge_requests (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  entity_type TEXT NOT NULL, -- account, contact, lead
  source_ids UUID[] NOT NULL,
  target_id UUID,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
  requested_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  merge_rules JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Eventos de Comportamento (para analytics)
CREATE TABLE behavioral_events (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
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
```

**UI Necessária:**
- Painel de duplicatas detectadas
- UI de merge manual
- Funil completo (marketing > sales > service)
- Attribution tracking

---

### 2.6 Fireware Automations - Pendências (80%)

**Já implementado:**
- approval_requests (tabela e dialog básico)
- routing_rules (tabela existe)

**Faltando:**

```sql
-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type workflow_trigger NOT NULL, -- record_created, record_updated, field_changed, scheduled, manual
  trigger_entity TEXT NOT NULL, -- lead, opportunity, ticket, account, etc
  trigger_conditions JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft', -- draft, active, paused
  run_count INT DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Steps do Workflow
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  type workflow_step_type NOT NULL, -- condition, action, delay, parallel, approval
  name TEXT,
  config JSONB NOT NULL,
  next_step_on_success UUID REFERENCES workflow_steps(id),
  next_step_on_failure UUID REFERENCES workflow_steps(id)
);

-- Execuções de Workflow
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id),
  trigger_record_id UUID,
  trigger_record_type TEXT,
  status run_status DEFAULT 'running', -- running, completed, failed, cancelled
  current_step_id UUID REFERENCES workflow_steps(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]'
);

-- Step Executions
CREATE TABLE workflow_step_executions (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES workflow_runs(id),
  step_id UUID REFERENCES workflow_steps(id),
  status TEXT DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**UI Necessária:**
- /automations - Lista de workflows
- /automations/:id - Visual workflow builder
- /automations/runs - Histórico de execuções
- Playbook templates pré-configurados

---

### 2.7 Fireware Governance - Pendências (50%)

**Já implementado:**
- audit_logs com field diffs
- RLS em todas as tabelas
- Roles básicos (user, manager, admin)

**Faltando:**

```sql
-- Solicitações LGPD
CREATE TABLE lgpd_requests (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  contact_id UUID REFERENCES contacts(id),
  account_id UUID REFERENCES accounts(id),
  type lgpd_request_type NOT NULL, -- access, rectification, deletion, portability, objection
  status lgpd_status DEFAULT 'received', -- received, processing, completed, denied
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_method TEXT,
  response_notes TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  data_export_url TEXT,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Políticas de Retenção
CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  retention_days INT NOT NULL,
  action TEXT NOT NULL, -- archive, anonymize, delete
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de Consentimentos
CREATE TABLE consent_log (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  contact_id UUID REFERENCES contacts(id),
  lead_id UUID REFERENCES leads(id),
  consent_type TEXT NOT NULL, -- marketing_email, marketing_sms, data_processing, etc
  action TEXT NOT NULL, -- granted, revoked
  previous_status TEXT,
  new_status TEXT,
  legal_basis TEXT,
  purpose TEXT,
  source TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Roles Separada (SEGURANÇA!)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);
```

**UI Necessária:**
- /governance - Dashboard de compliance
- /governance/lgpd - Solicitações LGPD
- /governance/retention - Políticas de retenção
- /governance/consents - Centro de consentimentos
- Relatórios de compliance

---

## PARTE 3: PRIORIZAÇÃO E ROADMAP

### Fase 6: Finalizar Service + Governance (Alta Prioridade)

```text
Estimativa: 2-3 sessões

Itens:
├── Portal do Cliente (básico)
├── Canned Responses UI
├── user_roles table (SEGURANÇA CRÍTICA!)
├── lgpd_requests table e UI
├── consent_log table
├── Health Score básico para CS
```

### Fase 7: Fireware Automations (Alta Prioridade)

```text
Estimativa: 2-3 sessões

Itens:
├── workflows, workflow_steps, workflow_runs tables
├── Visual workflow builder
├── Execution engine (triggers)
├── Playbooks templates
├── Integration com approval_requests existente
```

### Fase 8: Fireware Marketing (Média Prioridade)

```text
Estimativa: 3-4 sessões

Itens:
├── campaigns, campaign_members tables
├── segments, segment_rules tables
├── Segment builder UI
├── Campaign editor
├── consents table + UI
├── email_templates
├── journeys, journey_steps (básico)
├── Marketing dashboard
```

### Fase 9: Fireware Commerce (Média Prioridade)

```text
Estimativa: 3-4 sessões

Itens:
├── carts, cart_items tables
├── orders, order_items tables
├── payments, shipments, returns tables
├── promotions tables
├── Order management UI
├── B2B catalog
├── Checkout flow básico
```

### Fase 10: Fireware IT / ITSM (Baixa Prioridade)

```text
Estimativa: 3-4 sessões

Itens:
├── it_incidents, it_requests, it_problems tables
├── it_changes (change management)
├── cmdb_items, cmdb_relationships tables
├── it_assets tables
├── ITSM Dashboard
├── CMDB Explorer UI
```

### Fase 11: Fireware Data Avançado (Baixa Prioridade)

```text
Estimativa: 2 sessões

Itens:
├── customer_identities table
├── merge_requests table
├── behavioral_events table
├── Identity resolution UI
├── Funnel completo
├── Attribution tracking
```

---

## RESUMO DE ESFORÇO

| Módulo | % Atual | % Alvo | Esforço |
|--------|---------|--------|---------|
| Sales | 95% | 100% | Baixo (apenas polish) |
| Service | 70% | 100% | Médio (portal + CS) |
| Marketing | 0% | 100% | Alto (módulo completo) |
| Commerce | 0% | 100% | Alto (módulo completo) |
| IT/ITSM | 0% | 100% | Alto (módulo completo) |
| Data | 40% | 100% | Médio (identity + funnel) |
| Automations | 20% | 100% | Médio (workflow engine) |
| Governance | 50% | 100% | Médio (LGPD + roles) |

**Total estimado para 100% do PRD: 18-25 sessões de desenvolvimento**

---

## OBSERVAÇÕES CRÍTICAS DE SEGURANÇA

1. **Roles em tabela separada**: Atualmente roles estão na tabela `profiles`. Isso é um risco de privilege escalation. Deve-se criar tabela `user_roles` separada.

2. **LGPD Compliance**: Não há mecanismo para atender solicitações de titulares (acesso, exclusão, portabilidade).

3. **Consent Tracking**: Não há registro de consentimentos para marketing, essencial para LGPD.

4. **PII Masking**: Não há controle de mascaramento de dados sensíveis baseado em roles.

