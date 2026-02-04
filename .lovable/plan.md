
# ANALISE TECNICA COMPLETA DO FIREWARE CRM
## Ecossistema Enterprise Integrado

---

## 1. VISAO GERAL DA ARQUITETURA

### 1.1 Stack Tecnologico

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Frontend | React + TypeScript | 18.3.1 |
| Bundler | Vite | - |
| Styling | Tailwind CSS + tailwind-merge | - |
| UI Components | Radix UI + shadcn/ui | Multiplos |
| State Management | TanStack React Query | 5.83.0 |
| Routing | React Router DOM | 6.30.1 |
| Forms | React Hook Form + Zod | 7.61.1 / 3.25.76 |
| Charts | Recharts | 2.15.4 |
| Drag & Drop | @hello-pangea/dnd | 18.0.1 |
| Backend | Supabase (Lovable Cloud) | 2.93.2 |
| Date Handling | date-fns | 3.6.0 |

### 1.2 Arquitetura Multi-Tenant

```text
+-------------------+
|   Organization    |
+-------------------+
         |
    +----+----+
    |         |
+-------+ +-------+
| Units | | Teams |
+-------+ +-------+
              |
          +-------+
          | Users |
          +-------+
```

**Hierarquia implementada:**
- `organizations` - Tenant principal
- `teams` - Equipes dentro da organizacao
- `profiles` - Usuarios com roles (user/manager/admin)
- `user_roles` - Tabela separada para controle granular de permissoes

**Funcoes de Seguranca RPC:**
- `user_has_role(_user_id, _role)` - Verifica se usuario possui role
- `get_user_highest_role(_user_id)` - Retorna maior role do usuario
- `is_member_of_org(org_id)` - Verifica pertencimento a organizacao
- `is_manager_of_team(team_id)` - Verifica se e gerente da equipe
- `get_user_org_id()` - Retorna organization_id do usuario atual
- `get_user_team_id()` - Retorna team_id do usuario atual

---

## 2. MODULOS FUNCIONAIS COMPLETOS

### 2.1 MODULO SALES (Vendas)

#### 2.1.1 Gestao de Leads

**Tabela:** `leads`
**Campos principais:**
- Dados pessoais: first_name, last_name, email, phone
- Dados profissionais: company, job_title, department
- Qualificacao: score (0-100), status (new/contacted/qualified/unqualified/converted)
- Rastreamento: source, campaign_id, utm_* (source, medium, campaign, term, content)
- Enriquecimento: annual_revenue, employee_count, industry, website

**Status Workflow:**
```text
new -> contacted -> qualified -> converted
                 -> unqualified
```

**Funcionalidades:**
- Listagem com filtros (status, busca por nome/email/empresa)
- Formulario de criacao/edicao com validacao Zod
- Wizard de conversao de lead (3 etapas):
  1. Criar/vincular conta
  2. Criar contato
  3. Criar oportunidade (opcional)
- Lead Scoring automatico
- Importacao/Exportacao CSV
- Timeline de atividades

#### 2.1.2 Gestao de Contas (Accounts)

**Tabela:** `accounts`
**Relacionamentos:**
- `parent_account_id` -> Hierarquia de contas (matriz/filial)
- `territory_id` -> Territorio de vendas
- `owner_id` -> Responsavel

**Campos avancados:**
- Endereco completo (street, city, state, postal_code, country)
- Dados comerciais (annual_revenue, employee_count, industry)
- Campos customizados (custom_fields JSON)
- Tags para segmentacao

**Health Score:**
- Funcao RPC `calculate_health_score(account_id)`
- Considera: tickets abertos, oportunidades ganhas, ultima atividade
- Escala: 0-100

#### 2.1.3 Gestao de Contatos

**Tabela:** `contacts`
**Relacionamentos:**
- `account_id` -> Conta associada
- Roles: decision_maker, technical, financial, influencer, end_user, other

**Campos de comunicacao:**
- email, phone, mobile_phone
- Preferencias de comunicacao (LGPD)
- Redes sociais (linkedin_url)

#### 2.1.4 Gestao de Oportunidades

**Tabela:** `opportunities`
**Pipeline Kanban com 6 estagios:**

| Estagio | Probabilidade Padrao |
|---------|---------------------|
| prospecting | 10% |
| qualification | 25% |
| proposal | 50% |
| negotiation | 75% |
| closed_won | 100% |
| closed_lost | 0% |

**Funcionalidades:**
- Visualizacao Kanban com drag-and-drop
- Visualizacao em lista
- Calculo automatico de pipeline value
- Rastreamento de mudanca de estagio (trigger SQL)
- Alertas de deals obsoletos (StaleDealAlerts)
- Categorias de forecast: commit, best_case, pipeline, omitted
- Motivos de ganho/perda

**Trigger:** `log_opportunity_stage_change`
- Registra mudancas de estagio na timeline
- Eventos especiais para won/lost

**Funcao RPC:** `is_deal_stale(opp_id, threshold_days)`
- Detecta oportunidades sem atividade

**Funcao RPC:** `get_stale_opportunities_count(org_id, threshold_days)`
- Conta deals obsoletos por organizacao

#### 2.1.5 Propostas Comerciais (Quotes)

**Tabelas:**
- `quotes` - Cabecalho da proposta
- `quote_items` - Itens da proposta

**Status Workflow:**
```text
draft -> sent -> accepted
              -> rejected
              -> expired
```

**Trigger:** `calculate_quote_totals`
- Recalcula subtotal, desconto, impostos e total automaticamente

**Campos:**
- Vinculo com opportunity, account, contact
- Validade (valid_until)
- Descontos percentuais (discount_percent)
- Impostos (tax_percent)
- Termos e condicoes (terms_and_conditions)

#### 2.1.6 Produtos

**Tabela:** `products`
**Campos:**
- SKU, nome, descricao
- Precos: unit_price, cost
- Margem calculada
- Categorias (PRESET_CATEGORIES ou custom)
- Status ativo/inativo

#### 2.1.7 Contratos

**Tabela:** `contracts`
**Status Workflow:**
```text
draft -> pending_approval -> sent -> negotiating -> signed -> active
                                                           -> expired
                                                           -> terminated
                                                           -> renewed
```

**Campos:**
- Numeracao automatica via RPC `generate_contract_number`
- Valores (total_value, recurring_value)
- Frequencia de cobranca (billing_frequency)
- Renovacao automatica (auto_renewal)
- Periodo de aviso (notice_period_days)
- Termos padrao e condicoes especiais

#### 2.1.8 Territorios

**Tabela:** `territories`
**Hierarquia:**
- `parent_id` -> Territorios aninhados
- `owner_id` -> Gerente do territorio

**Campos:**
- Nome e descricao
- Regiao geografica
- Metricas de desempenho

#### 2.1.9 Cadencias de Vendas

**Tabelas:**
- `cadences` - Definicao da cadencia
- `cadence_steps` - Etapas da cadencia
- `cadence_enrollments` - Contatos inscritos

**Tipos de etapas:**
- email, call, linkedin, task

**Status de enrollment:**
- active, completed, exited, paused, failed

**Interface:**
- Drag-and-drop para reordenacao de etapas
- Configuracao de delays entre etapas

#### 2.1.10 Previsao de Vendas (Forecast)

**Tabela:** `forecasts`
**Campos:**
- Periodo (period_start, period_end, period_type)
- Meta (target_amount)
- Categorias: commit_amount, best_case_amount, pipeline_amount
- Valor fechado (closed_amount)

**Interface:**
- Selecao de periodo (mensal/trimestral)
- Visualizacao por vendedor
- Rollup para gerentes

#### 2.1.11 Fluxos de Aprovacao

**Tabela:** `approval_requests`
**Tipos de aprovacao:**
- discount, special_terms, contract, price_override, credit_limit, exception

**Status:**
- pending, approved, rejected, cancelled, escalated

**Campos:**
- Niveis de aprovacao (approval_level, max_approval_level)
- Valores original e solicitado (original_value, requested_value)
- Escalacao (escalated_to, escalation_reason)
- Expiracao (expires_at)

#### 2.1.12 Regras de Roteamento de Leads

**Tabela:** `routing_rules`
**Tipos de roteamento:**
- round_robin, territory, segment, load_balance, skill_based, priority

**Log de atribuicoes:** `assignment_log`

---

### 2.2 MODULO SERVICE (Atendimento ao Cliente)

#### 2.2.1 Gestao de Tickets

**Tabela:** `tickets`
**Campos completos:**
- Numeracao automatica via RPC `generate_ticket_number`
- Canais: email, chat, phone, whatsapp, portal, form
- Tipos: incident, request, question, complaint, return
- Prioridades: low, medium, high, critical
- Status: new, open, pending, on_hold, resolved, closed

**Relacionamentos:**
- account_id, contact_id (cliente)
- assigned_to, queue_id (agente/fila)
- sla_id (politica de SLA)

**Campos de SLA:**
- sla_first_response_due, sla_first_response_at, sla_first_response_breached
- sla_resolution_due, sla_resolution_at, sla_resolution_breached

**Triggers SQL:**
- `calculate_sla_due_dates` - Calcula prazos baseado na prioridade
- `track_ticket_status_change` - Registra historico de status
- `update_ticket_first_response` - Atualiza metricas de resposta

**Interface:**
- Dashboard com KPIs (abertos, SLA violado, criticos, novos, resolvidos)
- Filtros por status, prioridade, canal, responsavel
- Abas: Todos, Abertos, Meus, Nao Atribuidos, SLA Violado
- Contador SLA com componente SLACountdown

#### 2.2.2 Mensagens de Tickets

**Tabela:** `ticket_messages`
**Tipos de remetente:** agent, customer, system
**Campos:**
- is_internal (nota interna vs resposta publica)
- attachments (array JSON)
- read_at (confirmacao de leitura)

#### 2.2.3 Historico de Status

**Tabela:** `ticket_status_history`
**Campos:**
- old_status, new_status
- changed_by, duration_minutes

#### 2.2.4 Politicas de SLA

**Tabela:** `ticket_slas`
**Tempos por prioridade:**
- first_response_low/medium/high/critical (minutos)
- resolution_low/medium/high/critical (minutos)
- Flags de horario comercial

#### 2.2.5 Base de Conhecimento

**Tabelas:**
- `knowledge_articles` - Artigos
- `knowledge_categories` - Categorias
- `article_versions` - Versionamento
- `article_feedback` - Feedback de utilidade

**Status de artigos:** draft, in_review, published, archived

**Campos:**
- Titulo, slug SEO, excerpt
- Conteudo (content, content_html)
- Meta SEO (meta_title, meta_description, meta_keywords)
- Metricas (view_count, helpful_count, not_helpful_count)
- Controle de visibilidade (internal/public)

**Trigger:** `update_article_feedback_counts`

#### 2.2.6 Respostas Rapidas (Macros)

**Tabelas:**
- `canned_responses` - Templates de resposta
- `canned_response_categories` - Organizacao
- `canned_response_analytics` - Metricas de uso

**Funcao RPC:** `parse_canned_response(content, ticket_id, contact_id)`
- Variaveis suportadas:
  - `{{ticket.number}}`, `{{ticket.subject}}`, `{{ticket.status}}`
  - `{{contact.first_name}}`, `{{contact.last_name}}`, `{{contact.email}}`
  - `{{account.name}}`

#### 2.2.7 Filas de Atendimento

**Tabela:** `ticket_queues`
**Campos:**
- Nome, descricao
- SLA padrao
- Notificacoes por email

#### 2.2.8 Portal do Cliente

**Tabelas:**
- `customer_portal_users` - Usuarios do portal
- `customer_portal_sessions` - Sessoes
- `customer_portal_activity_log` - Log de atividades
- `customer_portal_announcements` - Avisos
- `customer_portal_settings` - Configuracoes

**Funcoes RPC:**
- `create_portal_user_from_contact` - Cria usuario a partir de contato
- `authenticate_portal_user` - Autentica usuario do portal

**Status de usuario:** pending, active, suspended, deactivated

**Permissoes:**
- can_create_tickets
- can_view_knowledge_base
- can_view_contracts
- can_view_invoices
- ticket_visibility (all/own/company)

**Paginas do portal:**
- PortalLogin - Autenticacao
- PortalTickets - Lista de chamados
- PortalTicketDetail - Detalhe do chamado
- PortalNewTicket - Abertura de chamado
- PortalKnowledge - Base de conhecimento

---

### 2.3 MODULO MARKETING (Automacao de Marketing)

#### 2.3.1 Campanhas

**Tabela:** `campaigns`
**Tipos:** email, sms, whatsapp, push, social, ads, event, webinar, content, referral

**Status:** draft, scheduled, sending, active, paused, completed, cancelled, archived

**Metricas rastreadas:**
- Envios: sent_count, delivered_count
- Engajamento: open_count, unique_opens, click_count, unique_clicks
- Conversao: conversion_count, conversion_rate, conversion_value
- Negativo: unsubscribe_count, bounce_count, complaint_count
- Taxas calculadas: open_rate, click_rate, bounce_rate

**Recursos:**
- A/B Testing (ab_variants, ab_winner_criteria)
- UTM tracking (utm_source, utm_medium, utm_campaign, utm_term, utm_content)
- Agendamento (scheduled_at)
- Templates de email (template_id)

**Trigger:** `update_campaign_metrics`

#### 2.3.2 Membros de Campanha

**Tabela:** `campaign_members`
**Status:** pending, sent, delivered, opened, clicked, converted, unsubscribed, bounced, complained, failed

**Tracking individual:**
- sent_at, delivered_at, opened_at, clicked_at
- open_count, click_count
- converted_at, unsubscribed_at, bounced_at

#### 2.3.3 Segmentacao

**Tabela:** `segments`
**Tipos:** static (lista fixa), dynamic (regras)
**Entidades:** contact, lead, account

**Campos:**
- rules (JSON com regras de segmentacao)
- member_count (calculado)
- last_calculated_at

**Funcao RPC:** `calculate_segment_members(segment_id)`

**Tabela:** `segment_members` - Membros de segmentos estaticos

#### 2.3.4 Jornadas de Cliente (Journey Builder)

**Tabela:** `journeys`
**Status:** draft, active, paused, completed, archived

**Metricas:**
- entry_count, active_count, completed_count, goal_achieved_count
- conversion_rate

**Trigger types:** segment_entry, form_submission, event_trigger, scheduled, manual

**Tabela:** `journey_steps`
**Tipos de etapas:**
- Comunicacao: email, sms, whatsapp, push
- Controle: wait, condition, split
- Acao: goal, action, webhook
- Segmento: add_to_segment, remove_from_segment
- Dados: update_field, create_task, notify_owner

**Tabela:** `journey_enrollments`
**Status:** active, completed, exited, goal_achieved, paused, failed

#### 2.3.5 Templates de Email

**Tabela:** `email_templates`
**Campos:**
- subject, body_html, body_text, body_json
- preview_text, layout
- variables (JSON com variaveis disponiveis)
- Metricas: avg_open_rate, avg_click_rate, usage_count

#### 2.3.6 Formularios de Marketing

**Tabelas:**
- `marketing_forms` - Definicao de formularios
- `form_submissions` - Envios

**Campos de formulario:**
- fields (JSON schema)
- Configuracao visual (settings)
- UTM tracking

---

### 2.4 MODULO COMMERCE (E-commerce B2B/B2C)

#### 2.4.1 Carrinhos

**Tabelas:**
- `carts` - Cabecalho
- `cart_items` - Itens

**Campos:**
- session_id, account_id, contact_id
- Totais: subtotal, discount_total, tax_total, shipping_total, total
- coupon_code, expires_at

**Trigger:** `calculate_cart_totals`

#### 2.4.2 Pedidos

**Tabela:** `orders`
**Numeracao:** RPC `generate_order_number` (ORD-YYYY-NNNNNN)

**Status:** pending, confirmed, processing, shipped, delivered, cancelled, refunded

**Status de pagamento:** pending, authorized, captured, failed, refunded, partially_refunded

**Campos:**
- Cabecalho: order_number, order_date
- Cliente: account_id, contact_id
- Enderecos: billing_address, shipping_address (JSON)
- Totais: subtotal, discount_total, tax_total, shipping_total, grand_total
- Metodo de pagamento: payment_method
- Timestamps: shipped_at, delivered_at, cancelled_at

**Triggers:**
- `calculate_order_totals` - Recalcula totais
- `track_order_status_change` - Historico de status

**Tabela:** `order_items`
**Tabela:** `order_status_history`

#### 2.4.3 Pagamentos

**Tabela:** `payments`
**Campos:**
- order_id, amount, currency
- payment_method, payment_gateway
- transaction_id, gateway_reference
- Status: pending, processing, completed, failed, refunded

#### 2.4.4 Envios

**Tabela:** `shipments`
**Status:** preparing, shipped, in_transit, out_for_delivery, delivered, returned

**Campos:**
- carrier, tracking_number, tracking_url
- weight, dimensions (JSON)
- Datas: shipped_at, estimated_delivery, actual_delivery

#### 2.4.5 Devolucoes (RMA)

**Tabela:** `returns`
**Numeracao:** RPC `generate_return_number` (RMA-YYYY-NNNNN)

**Status:** requested, approved, rejected, received, refunded, completed

**Campos:**
- order_id, reason, description
- refund_amount, refund_method
- Tracking de retorno

**Tabela:** `return_items`

#### 2.4.6 Promocoes e Cupons

**Tabela:** `promotions`
**Tipos:** percentage, fixed, buy_x_get_y, free_shipping

**Campos:**
- code (cupom)
- discount_value
- Limites: min_order_value, max_discount_amount, usage_limit, used_count
- Validade: start_date, end_date
- Aplicabilidade: applicable_products, applicable_categories (JSON)

**Trigger:** `update_promotion_usage_count`

---

### 2.5 MODULO IT/ITSM (Gestao de TI)

#### 2.5.1 Incidentes

**Tabela:** `it_incidents`
**Numeracao:** RPC `generate_incident_number` (INC-YYYY-NNNNNN)

**Status:** new, acknowledged, in_progress, pending_info, pending_vendor, on_hold, resolved, closed, cancelled

**Matriz de Prioridade (Impact x Urgency):**
```text
              | Critical | High   | Medium | Low
--------------|----------|--------|--------|------
Critical      | Critical | Critical| High   | Medium
High          | Critical | High   | High   | Medium
Medium        | High     | Medium | Medium | Low
Low           | Medium   | Medium | Low    | Low
```

**Funcao RPC:** `calculate_it_priority(impact, urgency)`
**Trigger:** `set_incident_priority`
**Trigger:** `track_incident_status_change`

**Campos:**
- Categorias: category, subcategory
- Impacto: impact (low/medium/high/critical)
- Urgencia: urgency (low/medium/high/critical)
- Prioridade: priority (calculado)
- SLA: first_response_at, resolved_at
- Relacionamentos: affected_ci_id, related_problem_id

#### 2.5.2 Requisicoes de Servico

**Tabela:** `it_requests`
**Numeracao:** RPC `generate_request_number` (REQ-YYYY-NNNNNN)

**Status:** submitted, pending_approval, approved, rejected, in_progress, pending_info, fulfilled, closed, cancelled

#### 2.5.3 Problemas

**Tabela:** `it_problems`
**Numeracao:** RPC `generate_problem_number` (PRB-YYYY-NNNNN)

**Status:** logged, open, root_cause_analysis, known_error, resolution_identified, resolved, closed

**Campos:**
- root_cause (analise de causa raiz)
- workaround (solucao de contorno)
- known_error_id (vinculo com base de erros conhecidos)

#### 2.5.4 Gestao de Mudancas

**Tabela:** `it_changes`
**Numeracao:** RPC `generate_change_number` (CHG-YYYY-NNNNN)

**Tipos:** standard, normal, emergency

**Status:** draft, submitted, under_assessment, pending_approval, approved, rejected, scheduled, implementing, under_review, completed, cancelled, failed, rolled_back

**Campos:**
- reason, business_justification
- implementation_plan, rollback_plan, test_plan
- risk_level (low/medium/high/critical)
- Agendamento: scheduled_start, scheduled_end, actual_start, actual_end
- Aprovadores

**Trigger:** `track_change_status_change`

#### 2.5.5 CMDB (Configuration Management Database)

**Tabela:** `cmdb_items`
**Numeracao:** RPC `generate_ci_number` (CI-NNNNNNN)

**Tipos de CI:**
- Infra: server, virtual_machine, container, storage
- Rede: network_device, load_balancer, firewall
- Aplicacao: application, database, api, middleware
- Endpoint: workstation, laptop, mobile_device, printer
- Outros: service, other

**Status:** planned, in_development, testing, active, maintenance, degraded, inactive, retired, disposed

**Ambientes:** production, staging, development, testing, disaster_recovery, training

**Campos:**
- Identificacao: ci_number, name, description
- Atributos: version, serial_number, ip_address, hostname
- Localizacao: location, data_center, rack_position
- Responsabilidade: owner_id, support_team_id
- SLA: criticality, sla_id

**Tabela:** `cmdb_relationships`
**Tipos de relacionamento:**
- runs_on, depends_on, connected_to, part_of
- managed_by, backed_up_by, replicated_to
- load_balanced_by, contained_in, uses, provides, supports

#### 2.5.6 Ativos de TI

**Tabela:** `it_assets`
**Numeracao:** RPC `generate_asset_tag` (AST-NNNNNNN)

**Tipos:** hardware, software, license, subscription, virtual, cloud_resource

**Status:** ordered, received, available, in_use, in_repair, maintenance, retired, disposed, lost, stolen

**Condicao:** new, good, fair, poor, damaged, non_functional

**Campos:**
- Identificacao: asset_tag, name, serial_number
- Aquisicao: purchase_date, purchase_price, vendor, purchase_order
- Garantia: warranty_start_date, warranty_end_date
- Depreciacao: depreciation_method, current_value
- Vinculo com CI: cmdb_item_id
- Atribuicao: assigned_to, assigned_at, location

#### 2.5.7 Catalogo de Servicos

**Tabela:** `service_catalog`
**Campos:**
- Nome, descricao, categoria
- SLA e tempo estimado de atendimento
- Formulario de requisicao (fields JSON)
- Fluxo de aprovacao

---

### 2.6 MODULO DATA & ANALYTICS (Dados Avancados)

#### 2.6.1 Resolucao de Identidade

**Tabelas:**
- `customer_identities` - Identidades unificadas
- `customer_identity_links` - Links entre entidades

**Tipos de identificador:** email, phone, document, external_id, cookie, device_id, social_id

#### 2.6.2 Deteccao de Duplicatas

**Tabelas:**
- `duplicate_detection_rules` - Regras de deteccao
- `detected_duplicates` - Duplicatas encontradas

**Status:** detected, confirmed, false_positive, merged, ignored

**Funcao RPC:** `detect_duplicates(org_id, entity_type, entity_id)`
- Retorna: duplicate_id, similarity_score, match_reasons

#### 2.6.3 Merge de Registros

**Tabela:** `merge_requests`
**Status:** pending, approved, rejected, in_progress, completed, failed, cancelled

**Campos:**
- entity_type, primary_id, secondary_ids
- field_mappings (JSON)
- Aprovacao

**Interface:** MergeWizard de 3 etapas

#### 2.6.4 Atribuicao de Marketing

**Tabela:** `attribution_touchpoints`
**Campos:**
- Entidades: contact_id, lead_id, account_id, opportunity_id, order_id
- Campanha: campaign_id, journey_id
- Touchpoint: touchpoint_type, touchpoint_name, touchpoint_position
- Flags: is_first_touch, is_last_touch, is_conversion_touch
- UTM tracking completo
- Valor: conversion_value, conversion_date

**Tabela:** `marketing_attribution`

**Funcao RPC:** `calculate_attribution(org_id, opp_id, model)`

**Modelos suportados:**
- first_touch, last_touch, linear
- time_decay, position_based
- data_driven, custom

#### 2.6.5 Eventos Comportamentais

**Tabela:** `behavioral_events`
**Tipos de evento:**
- Navegacao: page_view, search
- Interacao: form_submit, button_click, link_click, video_play, video_complete, file_download
- E-commerce: add_to_cart, remove_from_cart, checkout_start, checkout_complete
- Conta: signup, login, logout, profile_update
- Engajamento: email_open, email_click, sms_click, push_click
- Custom

**Campos:**
- Identificacao: visitor_id, session_id, anonymous_id, contact_id
- Pagina: page_url, page_path, page_title, referrer
- Dispositivo: device_type, device_info (JSON)
- Localizacao: location (JSON), ip_address
- UTM completo

#### 2.6.6 Snapshots de Funil

**Tabela:** `funnel_snapshots`
**Funcao RPC:** `create_funnel_snapshot(org_id, date, period_type)`

**Metricas capturadas:**
- Marketing: leads, campaigns_active
- Vendas: opportunities_created/won/lost, pipeline_value, closed_value
- Service: tickets_created/resolved/backlog
- Commerce: orders, revenue

#### 2.6.7 Customer 360

**Interface:** Customer360.tsx
**Visualizacoes:**
- Metricas consolidadas (receita, pipeline, win rate, tickets, pedidos)
- Graficos de receita por mes
- Distribuicao de oportunidades por estagio
- Timeline unificada
- Comportamento digital

**Tabela:** `customer_health_scores`

---

### 2.7 MODULO AUTOMATIONS (Workflow Engine)

#### 2.7.1 Workflows

**Tabela:** `workflows`
**Status:** draft, active, paused, archived

**Gatilhos suportados:**
- record_created, record_updated, field_changed
- scheduled, manual
- approval_completed, sla_breach
- stage_changed, score_changed

**Entidades suportadas:**
- lead, opportunity, account, contact, ticket, quote, contract

**Configuracoes:**
- retry_on_failure, max_retries
- notify_on_failure, failure_notification_emails
- max_concurrent_runs, timeout_minutes

**Metricas:** run_count, success_count, failure_count, avg_execution_time_ms

#### 2.7.2 Etapas de Workflow

**Tabela:** `workflow_steps`
**Tipos de etapa:**
- Controle: condition, delay, parallel, loop
- Aprovacao: approval
- Comunicacao: notification, send_email, webhook
- Dados: field_update, create_record, add_tag
- Atribuicao: assign_owner, create_task
- Extensao: call_function

**Campos:**
- Posicionamento visual: position_x, position_y
- Navegacao: next_step_on_success, next_step_on_failure
- Resiliencia: retry_count, retry_delay_seconds, continue_on_error
- Timeout: timeout_seconds

#### 2.7.3 Execucoes

**Tabela:** `workflow_runs`
**Status:** pending, running, completed, failed, cancelled, paused, waiting_approval

**Tabela:** `workflow_step_executions`
**Status:** pending, running, completed, failed, skipped, waiting

#### 2.7.4 Agendamentos

**Tabela:** `workflow_schedules`
**Campos:**
- schedule_type, cron_expression
- timezone, next_run_at, last_run_at

#### 2.7.5 Templates

**Tabela:** `workflow_templates`
**Campos:**
- Categoria, descricao, icone
- steps_config (JSON com configuracao)
- Metricas: usage_count, rating

---

### 2.8 MODULO GOVERNANCE (Governanca e LGPD)

#### 2.8.1 Solicitacoes LGPD

**Tabela:** `lgpd_requests`
**Tipos:** access, rectification, deletion, portability, objection, restriction

**Status:** received, verified, processing, completed, denied, expired

**Campos:**
- requester_name, requester_email, requester_document
- description, response
- deadline (15 dias por lei)
- Rastreamento: verified_by, processed_by, completed_at

**Interface:** Governance.tsx com dashboard de compliance

#### 2.8.2 Politicas de Retencao

**Tabela:** `data_retention_policies`
**Acoes:** archive, delete, anonymize

**Campos:**
- entity_type, retention_days
- conditions (JSON com criterios)
- Execucao: next_run_at, last_run_at, records_affected

#### 2.8.3 Log de Consentimento

**Tabela:** `consent_log`
**Campos:**
- contact_id, consent_type
- action (granted/revoked)
- source, ip_address, user_agent

#### 2.8.4 Logs de Auditoria

**Tabela:** `audit_logs`
**Campos:**
- Acao: action, entity_type, entity_id, entity_name
- Dados: old_values, new_values, changes (JSON)
- Usuario: user_id, user_email
- Contexto: ip_address, user_agent, session_id

**Funcao RPC:** `log_audit_event(...)`

**Interface:** AuditLogs.tsx

---

## 3. COMPONENTES COMPARTILHADOS

### 3.1 Timeline

**Tabela:** `timeline_events`
**Tipos de evento:**
- lead_created, lead_converted
- opportunity_created, opportunity_stage_changed, opportunity_won, opportunity_lost
- quote_created, quote_sent
- activity_completed, note_added
- contact_added, account_created

**Campos:**
- Entidades: account_id, contact_id, lead_id, opportunity_id
- Conteudo: title, description, metadata (JSON)

### 3.2 Atividades

**Tabela:** `activities`
**Tipos:** call, email, meeting, task, note

**Campos:**
- subject, description
- due_date, completed_at
- status, priority
- Especificos: duration_minutes, call_result, meeting_location, outcome

### 3.3 Notas

**Tabela:** `notes`
**Campos:**
- Entidades relacionadas (polimorficas)
- title, content
- is_pinned
- Versioning

### 3.4 Anexos

**Tabela:** `attachments`
**Storage bucket:** "attachments" (privado)

**Campos:**
- Entidades relacionadas (polimorficas)
- file_name, file_path, file_type, file_size, mime_type
- Versionamento: version, parent_attachment_id, is_latest
- Acesso: access_level, is_public
- Metadados: description, category, tags

---

## 4. BUSCA GLOBAL

**Componente:** GlobalSearch.tsx
**Atalho:** Cmd+K / Ctrl+K

**Entidades pesquisadas:**
- Leads (nome, email, empresa)
- Contas (nome, industria)
- Contatos (nome, email)
- Oportunidades (nome)
- Propostas (nome, numero)

**Funcionalidades:**
- Debounce de 300ms
- Navegacao por teclado (setas, Enter, Escape)
- Resultados categorizados com badges coloridos
- Click fora fecha dropdown

---

## 5. FUNCOES DE BANCO DE DADOS (RPC)

### 5.1 Geracao de Numeros

| Funcao | Formato | Exemplo |
|--------|---------|---------|
| generate_ticket_number | TKT-YYYY-NNNNNN | TKT-2026-000001 |
| generate_contract_number | CTR-YYYY-NNNNN | CTR-2026-00001 |
| generate_order_number | ORD-YYYY-NNNNNN | ORD-2026-000001 |
| generate_return_number | RMA-YYYY-NNNNN | RMA-2026-00001 |
| generate_incident_number | INC-YYYY-NNNNNN | INC-2026-000001 |
| generate_request_number | REQ-YYYY-NNNNNN | REQ-2026-000001 |
| generate_problem_number | PRB-YYYY-NNNNN | PRB-2026-00001 |
| generate_change_number | CHG-YYYY-NNNNN | CHG-2026-00001 |
| generate_ci_number | CI-NNNNNNN | CI-0000001 |
| generate_asset_tag | AST-NNNNNNN | AST-0000001 |

### 5.2 Calculos

| Funcao | Descricao |
|--------|-----------|
| calculate_health_score | Calcula score de saude da conta (0-100) |
| calculate_segment_members | Conta membros de um segmento dinamico |
| calculate_it_priority | Calcula prioridade IT (impact x urgency) |
| calculate_attribution | Calcula atribuicao de marketing por modelo |
| create_funnel_snapshot | Gera snapshot de metricas do funil |

### 5.3 Seguranca

| Funcao | Descricao |
|--------|-----------|
| user_has_role | Verifica se usuario tem role especifica |
| get_user_highest_role | Retorna maior role do usuario |
| has_role | Wrapper simplificado para RLS |
| is_member_of_org | Verifica pertencimento a organizacao |
| is_manager_of_team | Verifica se e gerente de equipe |
| get_user_org_id | Retorna org_id do usuario atual |
| get_user_team_id | Retorna team_id do usuario atual |

### 5.4 Utilitarios

| Funcao | Descricao |
|--------|-----------|
| detect_duplicates | Detecta registros duplicados |
| parse_canned_response | Processa variaveis em respostas rapidas |
| is_deal_stale | Verifica se deal esta obsoleto |
| get_stale_opportunities_count | Conta deals obsoletos |
| log_audit_event | Registra evento de auditoria |
| authenticate_portal_user | Autentica usuario do portal |
| create_portal_user_from_contact | Cria usuario portal de contato |

---

## 6. ENUMS DO SISTEMA

O sistema possui 48 enums definidos no banco de dados, incluindo:

**Vendas:**
- opportunity_stage, lead_status, quote_status, contract_status
- forecast_category, contact_role

**Service:**
- ticket_status, ticket_priority, ticket_type, ticket_channel
- article_status, message_sender_type

**Marketing:**
- campaign_status, campaign_type, campaign_member_status
- journey_status, journey_step_type
- behavioral_event_type

**Commerce:**
- order_status, payment_status, shipment_status
- return_status, promotion_type

**IT:**
- it_incident_status, it_request_status, it_problem_status, it_change_status
- it_priority, it_impact, it_urgency, it_change_risk, it_change_type
- it_asset_status, it_asset_type, it_asset_condition
- ci_type, ci_status, ci_environment, cmdb_relationship_type

**Workflow:**
- workflow_trigger, workflow_run_status, workflow_step_type, step_execution_status

**Dados:**
- duplicate_status, merge_status, attribution_model, identifier_type

**Governanca:**
- lgpd_request_type, lgpd_status, user_role

---

## 7. PROBLEMAS DE SEGURANCA IDENTIFICADOS

O linter do Supabase identificou 3 issues:

### 7.1 Function Search Path Mutable (WARN)
- **Problema:** Algumas funcoes nao tem `search_path` definido
- **Risco:** Potencial SQL injection via search path
- **Solucao:** Adicionar `SET search_path TO 'public'` em todas funcoes

### 7.2 RLS Policy Always True (WARN)
- **Problema:** Politicas usando `USING (true)` em UPDATE/DELETE/INSERT
- **Risco:** Acesso irrestrito a dados sensiveis
- **Solucao:** Revisar e restringir politicas

### 7.3 Leaked Password Protection Disabled (WARN)
- **Problema:** Protecao contra senhas vazadas desabilitada
- **Risco:** Usuarios podem usar senhas comprometidas
- **Solucao:** Habilitar no Auth settings

---

## 8. RELATORIOS E ANALYTICS

### 8.1 Dashboard Principal

**Componente:** Dashboard.tsx
**KPIs:**
- Pipeline Total
- Leads Abertos
- Fechados Ganhos
- Atividades Recentes

**Graficos:**
- Pipeline por Estagio (BarChart horizontal)
- Distribuicao de Negocios (PieChart)

**Widgets:**
- Top Deals
- Atividade Recente
- Stale Deal Alerts

### 8.2 Modulo de Relatorios

**Componente:** Reports.tsx
**Filtros de periodo:**
- Este Mes, Mes Passado
- Este Trimestre, Trimestre Passado
- Ultimos 30/90 Dias
- Periodo Personalizado

**Relatorios disponiveis:**
- Pipeline Overview (funil de vendas)
- Conversion Funnel (lead to opportunity)
- Activity Metrics (por tipo)
- Win/Loss Analysis (motivos)
- Rep Performance (por vendedor)
- Trend Analysis (evolucao temporal)

**Exportacao:** CSV para todos os relatorios

---

## 9. CONCLUSAO E METRICAS

### 9.1 Cobertura de Funcionalidades

| Modulo | Tabelas | Status |
|--------|---------|--------|
| Sales | 20+ | 100% |
| Service | 15+ | 100% |
| Marketing | 12+ | 100% |
| Commerce | 10+ | 100% |
| IT/ITSM | 10+ | 100% |
| Data | 8+ | 100% |
| Automations | 6+ | 100% |
| Governance | 5+ | 100% |

### 9.2 Estatisticas do Codigo

- Total de tabelas: ~100+
- Total de enums: 48
- Funcoes RPC: 25+
- Triggers SQL: 10+
- Paginas/Rotas: 80+
- Componentes React: 50+

### 9.3 Localizacao

- Interface: 95% PT-BR
- Moeda: BRL padronizado
- Datas: Formato brasileiro (dd/MM/yyyy)
- Locale date-fns: ptBR

O Fireware CRM e uma solucao enterprise completa que integra todos os modulos de um CRM moderno com automacao de marketing, e-commerce B2B/B2C, gestao de TI (ITSM), analytics avancados e compliance LGPD, tudo em uma unica plataforma multi-tenant com arquitetura robusta de seguranca baseada em RLS.
