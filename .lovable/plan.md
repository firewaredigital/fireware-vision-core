
# PLANO DE IMPLEMENTACAO DO FIREWARE CRM - CUSTOMER RELATIONSHIP ECOSYSTEM
## Evolucao para Plataforma Enterprise Modular Completa

---

## ANALISE DO ESTADO ATUAL vs PRD

### RESUMO EXECUTIVO DO GAP ANALYSIS

O sistema atual possui uma base solida com 103+ tabelas, 48 enums e 80+ rotas. No entanto, o PRD solicita uma evolucao significativa para um ecossistema completo. Abaixo esta o mapeamento detalhado:

| Camada PRD | Status Atual | Lacunas Criticas |
|------------|--------------|------------------|
| A - Core Platform | 20% | Feature flags, Permission sets, Admin Console, Observabilidade |
| B - Engagement Apps | 70% | CPQ, Subscriptions/Billing, Omnichannel real, Voice |
| C - Data Hub | 60% | Golden Record completo, Data Catalog, Activation jobs |
| D - Automation/iPaaS | 40% | Connector Framework, DLQ, Event Bus/Outbox |
| E - Intelligence/AI | 0% | Agent Studio, AI Tools, Policies, Evals - TOTALMENTE NOVO |
| F - Portals | 50% | Partner Portal, pedidos/faturas, Chat Widget |
| G - Governance | 80% | DLP/PII masking, SSO/MFA/SCIM |

---

## PLANO DE IMPLEMENTACAO EM 8 FASES

### FASE 1: CORE PLATFORM (Fundacao Modular)
**Objetivo:** Criar a infraestrutura de modularidade e governanca

#### 1.1 Feature Flags e Licenciamento

**Novas Tabelas:**
```text
org_modules
├── id: uuid PK
├── organization_id: uuid FK
├── module_key: module_key_enum
├── enabled: boolean
├── plan_tier: text (free/starter/professional/enterprise)
├── starts_at: timestamptz
├── ends_at: timestamptz
├── limits_json: jsonb
├── usage_json: jsonb
├── created_at, updated_at, created_by, updated_by
```

**Novo Enum:**
```text
module_key_enum:
  sales, service, contact_center, marketing, commerce,
  billing, cpq, itsm, data_hub, automations, integrations,
  ai_agents, analytics, portals, governance
```

**Middleware Frontend:**
- Hook `useModuleAccess(moduleKey)` que verifica habilitacao
- HOC `withModuleGuard(Component, moduleKey)` para proteger rotas
- Sidebar dinamica que mostra apenas modulos habilitados

#### 1.2 Permission Sets (RBAC + ABAC)

**Novas Tabelas:**
```text
permission_sets
├── id: uuid PK
├── organization_id: uuid FK
├── name: text
├── description: text
├── permissions: jsonb (array de capability strings)
├── conditions: jsonb (ABAC: team_id, territory_id, segment_id)
├── is_system: boolean (imutavel se true)
├── created_at, updated_at

permission_set_assignments
├── id: uuid PK
├── permission_set_id: uuid FK
├── user_id: uuid FK
├── granted_by: uuid FK
├── granted_at: timestamptz
├── expires_at: timestamptz (opcional)
```

**Capabilities (exemplos):**
- `sales.leads.read`, `sales.leads.write`, `sales.leads.delete`
- `sales.discount.approve`, `sales.discount.approve_high`
- `service.voice.read`, `service.whatsapp.send`
- `ai.agents.view`, `ai.agents.deploy`, `ai.agents.admin`
- `governance.lgpd.process`, `governance.audit.view`

**Funcao RPC:**
```sql
user_has_permission(user_id uuid, capability text) RETURNS boolean
```

#### 1.3 Admin Console

**Novas Rotas:**
- `/admin/platform/modules` - Gestao de modulos por org
- `/admin/platform/permissions` - Permission sets
- `/admin/platform/security` - Politicas de seguranca
- `/admin/platform/integrations` - Conectores ativos
- `/admin/platform/ai` - Configuracao de agentes IA
- `/admin/platform/observability` - Metricas e saude

#### 1.4 Observabilidade

**Novas Tabelas:**
```text
system_metrics
├── id, organization_id
├── metric_type: text (api_latency, error_rate, active_users, etc)
├── metric_value: numeric
├── dimensions: jsonb (module, endpoint, etc)
├── recorded_at: timestamptz

system_events
├── id, organization_id
├── event_type: text
├── severity: text (info, warning, error, critical)
├── message: text
├── metadata: jsonb
├── created_at

integration_run_logs
├── id, organization_id
├── connector_id, instance_id
├── status: text
├── started_at, completed_at
├── request_payload, response_payload: jsonb
├── error_message: text
├── retry_count: int
```

---

### FASE 2: OMNICHANNEL INBOX + CONVERSATIONS
**Objetivo:** Criar camada de conversas unificada para atendimento multicanal

#### 2.1 Camada de Conversacoes

**Novas Tabelas:**
```text
conversations
├── id: uuid PK
├── organization_id: uuid FK
├── channel: conversation_channel_enum
├── status: conversation_status_enum
├── priority: ticket_priority (reutilizar)
├── subject: text
├── account_id, contact_id: uuid FK
├── owner_id, queue_id: uuid FK
├── ticket_id: uuid FK (opcional, vinculo com ticket)
├── external_id: text (ID do canal externo)
├── metadata: jsonb
├── last_message_at: timestamptz
├── first_response_at: timestamptz
├── created_at, updated_at, closed_at

conversation_channel_enum:
  email, chat, phone, whatsapp, sms, social, portal

conversation_status_enum:
  open, waiting_customer, waiting_agent, bot_handling, closed

conversation_participants
├── id, conversation_id, participant_type (agent/customer/bot)
├── user_id (se agent), contact_id (se customer)
├── joined_at, left_at

conversation_messages
├── id, conversation_id, organization_id
├── sender_type: message_sender_type
├── sender_id: uuid
├── content: text
├── content_type: text (text, image, audio, video, file, template)
├── attachments: jsonb
├── external_message_id: text
├── delivery_status: delivery_status_enum
├── delivered_at, read_at: timestamptz
├── is_internal: boolean
├── created_at
```

#### 2.2 Omnichannel Routing Engine

**Novas Tabelas:**
```text
routing_queues_v2
├── id, organization_id
├── name, description
├── routing_method: routing_method_enum
├── priority: int
├── max_capacity: int
├── skills_required: text[]
├── sla_id: uuid FK
├── business_hours_id: uuid FK
├── fallback_queue_id: uuid FK

routing_method_enum:
  round_robin, skill_based, load_based, priority_first, least_idle

agent_skills
├── id, organization_id
├── user_id: uuid FK
├── skill_name: text
├── proficiency_level: int (1-5)

agent_capacity
├── id, organization_id
├── user_id: uuid FK
├── channel: conversation_channel_enum
├── max_concurrent: int
├── current_active: int
├── status: agent_status_enum

agent_status_enum:
  available, busy, away, offline, in_meeting

routing_assignments
├── id, conversation_id
├── assigned_to: uuid
├── assigned_from: uuid
├── assignment_method: text
├── assigned_at, accepted_at, ended_at
├── reason: text
```

**Funcoes RPC:**
```sql
route_conversation(conversation_id uuid) RETURNS uuid -- retorna agent_id
assign_agent(conversation_id uuid, agent_id uuid, reason text)
get_next_conversation(agent_id uuid) RETURNS uuid
```

#### 2.3 UI Omnichannel Inbox

**Nova Rota:** `/service/inbox`

**Componentes:**
- `OmnichannelInbox.tsx` - Painel principal com 3 colunas
  - Coluna 1: Lista de conversas (filtros, filas, prioridade)
  - Coluna 2: Conversa ativa (mensagens, resposta, anexos)
  - Coluna 3: Contexto (contato, conta, historico, KB)
- `ConversationList.tsx` - Lista virtualized de conversas
- `ConversationThread.tsx` - Thread de mensagens
- `CustomerContext.tsx` - Painel lateral com info do cliente
- `QuickActions.tsx` - Macros, templates, transferir, escalar

---

### FASE 3: WHATSAPP + CHAT WIDGET + VOICE
**Objetivo:** Implementar conectores nativos para canais criticos

#### 3.1 WhatsApp Business API (Conector Nativo)

**Novas Tabelas:**
```text
whatsapp_accounts
├── id, organization_id
├── phone_number_id: text
├── display_phone: text
├── business_name: text
├── status: whatsapp_account_status_enum
├── api_token_encrypted: text (criptografado)
├── webhook_verify_token: text
├── created_at, updated_at

whatsapp_templates
├── id, organization_id, whatsapp_account_id
├── template_name: text
├── template_id: text (ID na Meta)
├── category: text (marketing, utility, authentication)
├── language: text
├── components: jsonb
├── status: template_status_enum
├── created_at, updated_at

whatsapp_message_logs
├── id, organization_id
├── conversation_id, message_id: uuid FK
├── whatsapp_message_id: text
├── direction: text (inbound/outbound)
├── status: whatsapp_message_status_enum
├── template_used: text
├── error_code, error_message: text
├── sent_at, delivered_at, read_at, failed_at
```

**Edge Functions:**
- `whatsapp-webhook` - Recebe eventos da API WhatsApp
- `whatsapp-send` - Envia mensagens (texto, template, midia)

#### 3.2 Chat Widget Web

**Novas Tabelas:**
```text
chat_widgets
├── id, organization_id
├── name: text
├── config: jsonb (cores, posicao, saudacao, bot_id)
├── allowed_domains: text[]
├── is_active: boolean
├── queue_id: uuid FK
├── created_at, updated_at

chat_sessions
├── id, organization_id
├── widget_id, conversation_id: uuid FK
├── visitor_id: text
├── visitor_info: jsonb (nome, email, pagina_atual)
├── started_at, ended_at
├── source_url: text

chat_widget_events
├── id, session_id
├── event_type: text (widget_opened, message_sent, agent_joined, etc)
├── event_data: jsonb
├── created_at
```

**Entregaveis:**
- Componente React embeddable `<FirewareChatWidget />`
- Script de embed para sites externos
- Bot de triagem com handoff para humano

#### 3.3 Voice/Telefonia

**Novas Tabelas:**
```text
voice_calls
├── id, organization_id
├── conversation_id: uuid FK
├── direction: text (inbound/outbound)
├── caller_number, called_number: text
├── status: voice_call_status_enum
├── started_at, answered_at, ended_at
├── duration_seconds: int
├── recording_url: text
├── transcription_status: text
├── agent_id, contact_id: uuid FK

voice_call_events
├── id, call_id
├── event_type: text (ringing, answered, hold, resume, transfer, hangup)
├── event_data: jsonb
├── created_at

voice_transcripts
├── id, call_id
├── transcript_text: text
├── segments: jsonb (speaker, start_time, end_time, text)
├── language: text
├── confidence_score: numeric
├── created_at
```

**UI:**
- Softphone panel integrado ao Inbox
- Controles: atender, mudo, espera, transferir, gravar

---

### FASE 4: AI AGENTS (Agent Studio)
**Objetivo:** Criar camada completa de agentes IA com governanca

#### 4.1 Estrutura do Agent Studio

**Novas Tabelas:**
```text
ai_agents
├── id, organization_id
├── name, description: text
├── agent_type: ai_agent_type_enum
├── scope: text (modulos que pode acessar)
├── system_prompt: text
├── model_config: jsonb (model, temperature, max_tokens)
├── allowed_tools: uuid[] (FK para ai_tools)
├── policies: uuid[] (FK para ai_policies)
├── version: int
├── status: ai_agent_status_enum
├── created_by, updated_by
├── created_at, updated_at

ai_agent_type_enum:
  sales, service, marketing, commerce, itsm, data_steward, compliance, custom

ai_agent_status_enum:
  draft, testing, active, paused, deprecated

ai_agent_versions
├── id, agent_id
├── version_number: int
├── config_snapshot: jsonb
├── changelog: text
├── published_at, published_by

ai_tools
├── id, organization_id
├── name, description: text
├── tool_type: ai_tool_type_enum
├── parameters_schema: jsonb
├── action_config: jsonb (endpoint, query, function)
├── requires_approval: boolean
├── risk_level: text (low, medium, high, critical)
├── created_at, updated_at

ai_tool_type_enum:
  http_request, database_query, rpc_call, connector_action, workflow_trigger

ai_tool_permissions
├── id, tool_id
├── permission_set_id: uuid FK
├── can_execute: boolean

ai_policies
├── id, organization_id
├── name, description: text
├── policy_type: ai_policy_type_enum
├── rules: jsonb
├── actions_on_violation: text (block, warn, require_approval, log)
├── is_active: boolean
├── priority: int
├── created_at, updated_at

ai_policy_type_enum:
  pii_protection, rate_limit, action_restriction, content_filter, approval_required

ai_evals
├── id, organization_id
├── agent_id: uuid FK
├── name, description: text
├── test_cases: jsonb (input, expected_output, assertions)
├── last_run_at: timestamptz
├── last_run_results: jsonb
├── pass_rate: numeric
├── created_at, updated_at
```

#### 4.2 Execucao e Auditoria

**Novas Tabelas:**
```text
ai_runs
├── id, organization_id
├── agent_id: uuid FK
├── triggered_by: uuid (user_id)
├── trigger_type: text (user_request, workflow, scheduled, event)
├── input_context: jsonb
├── status: ai_run_status_enum
├── started_at, completed_at
├── total_tokens_used: int
├── cost_estimate: numeric

ai_run_status_enum:
  pending, running, waiting_approval, completed, failed, cancelled

ai_run_steps
├── id, run_id
├── step_order: int
├── step_type: text (reasoning, tool_call, response)
├── tool_id: uuid FK (se tool_call)
├── input_data, output_data: jsonb
├── status: text
├── started_at, completed_at
├── error_message: text

ai_run_audit_receipts
├── id, run_id
├── organization_id
├── action_type: text (dados lidos, dados alterados, mensagem enviada, etc)
├── action_description: text
├── affected_entity_type, affected_entity_id: text
├── data_accessed: jsonb (campos acessados, com masking de PII)
├── tool_used: text
├── approved_by: uuid (se human-in-the-loop)
├── approval_timestamp: timestamptz
├── evidence_attachments: jsonb
├── created_at
```

#### 4.3 Agentes Nativos Pre-configurados

**Implementar 7 agentes prontos:**

1. **Sales Agent**
   - Tools: create_lead, update_opportunity, get_account_info, suggest_next_action, generate_email_draft
   - Policies: cannot_approve_discount, cannot_close_deal, log_all_changes

2. **Service Agent**
   - Tools: search_knowledge_base, create_ticket, update_ticket, suggest_macro, get_customer_history
   - Policies: cannot_delete_data, require_approval_for_refund

3. **Marketing Agent**
   - Tools: create_segment, analyze_campaign, suggest_ab_test, generate_content
   - Policies: cannot_send_mass_message_without_approval

4. **Commerce Agent**
   - Tools: track_order, initiate_return, check_inventory, generate_invoice
   - Policies: cannot_modify_payment, limit_refund_amount

5. **ITSM Agent**
   - Tools: triage_incident, search_cmdb, suggest_workaround, link_problem
   - Policies: cannot_approve_change, log_all_access

6. **Data Steward Agent**
   - Tools: detect_duplicates, suggest_merge, validate_data_quality, classify_pii
   - Policies: require_approval_for_merge, mask_pii_in_logs

7. **Compliance Agent**
   - Tools: process_lgpd_request, validate_consent, apply_retention, export_evidence
   - Policies: all_actions_require_audit_receipt, senior_approval_for_deletion

#### 4.4 Rotas do Agent Studio

- `/ai/agents` - Lista de agentes
- `/ai/agents/new` - Criar novo agente
- `/ai/agents/:id` - Detalhe/editar agente
- `/ai/agents/:id/test` - Playground de teste
- `/ai/tools` - Catalogo de ferramentas
- `/ai/policies` - Politicas de governanca
- `/ai/evals` - Suites de avaliacao
- `/ai/runs` - Historico de execucoes

---

### FASE 5: iPaaS NATIVO (Connector Framework)
**Objetivo:** Transformar workflow engine em hub de integracao enterprise

#### 5.1 Connector Framework

**Novas Tabelas:**
```text
connectors
├── id
├── name, description: text
├── connector_type: connector_type_enum
├── icon_url: text
├── auth_type: auth_type_enum
├── config_schema: jsonb (campos de configuracao)
├── capabilities: jsonb (actions e triggers disponiveis)
├── documentation_url: text
├── is_native: boolean
├── version: text
├── created_at, updated_at

connector_type_enum:
  email, sms, whatsapp, voice, crm, erp, payment, storage, analytics, custom

auth_type_enum:
  none, api_key, oauth2, basic_auth, custom

connector_instances
├── id, organization_id
├── connector_id: uuid FK
├── name: text
├── config: jsonb (valores de configuracao)
├── credentials_encrypted: text
├── status: connector_instance_status_enum
├── last_health_check: timestamptz
├── health_status: text
├── created_by, created_at, updated_at

connector_instance_status_enum:
  active, inactive, error, configuring

connector_actions
├── id, connector_id
├── action_name: text
├── action_type: text (trigger, action)
├── description: text
├── input_schema, output_schema: jsonb
├── is_async: boolean
├── rate_limit: int (requests per minute)
```

#### 5.2 Runtime Robusto

**Novas Tabelas:**
```text
integration_runs
├── id, organization_id
├── connector_instance_id: uuid FK
├── workflow_run_id: uuid FK (opcional)
├── action_name: text
├── status: integration_run_status_enum
├── input_payload, output_payload: jsonb
├── started_at, completed_at
├── duration_ms: int
├── retry_count: int
├── error_code, error_message: text
├── idempotency_key: text

integration_run_status_enum:
  pending, running, completed, failed, retrying, dead_letter

dlq_messages (Dead Letter Queue)
├── id, organization_id
├── original_run_id: uuid FK
├── connector_instance_id: uuid FK
├── action_name: text
├── payload: jsonb
├── error_history: jsonb[]
├── retry_count: int
├── max_retries: int
├── status: dlq_status_enum
├── created_at, last_retry_at
├── expires_at

dlq_status_enum:
  pending_review, retrying, resolved, expired, manually_resolved

replay_requests
├── id, organization_id
├── dlq_message_id: uuid FK
├── requested_by: uuid FK
├── request_reason: text
├── status: text
├── replayed_at, result: jsonb
```

#### 5.3 Event Bus / Outbox Pattern

**Novas Tabelas:**
```text
outbox_events
├── id, organization_id
├── event_type: text
├── aggregate_type, aggregate_id: text
├── payload: jsonb
├── metadata: jsonb (correlation_id, causation_id)
├── status: outbox_status_enum
├── created_at, processed_at
├── processor_id: text
├── retry_count: int

outbox_status_enum:
  pending, processing, completed, failed

event_subscriptions
├── id, organization_id
├── event_type: text (pattern matching com wildcards)
├── subscriber_type: text (workflow, connector, webhook)
├── subscriber_config: jsonb
├── is_active: boolean
├── created_at
```

#### 5.4 UI de Integracoes

**Novas Rotas:**
- `/integrations/catalog` - Catalogo de conectores
- `/integrations/instances` - Instancias configuradas
- `/integrations/monitoring` - Dashboard de execucoes
- `/integrations/dlq` - Fila de mensagens mortas

---

### FASE 6: DATA HUB (Golden Record + Activation)
**Objetivo:** Unificar dados de cliente e habilitar ativacao cross-modulo

#### 6.1 Golden Record e Unificacao

**Novas Tabelas:**
```text
golden_profiles
├── id, organization_id
├── profile_type: golden_profile_type_enum
├── primary_email, primary_phone: text
├── primary_document: text
├── consolidated_data: jsonb (dados mesclados de todas as fontes)
├── confidence_score: numeric
├── source_count: int
├── first_seen_at, last_activity_at: timestamptz
├── created_at, updated_at

golden_profile_type_enum:
  person, company

golden_profile_links
├── id, golden_profile_id
├── entity_type: text (contact, lead, portal_user, etc)
├── entity_id: uuid
├── source: text
├── link_confidence: numeric
├── is_primary: boolean
├── linked_at, linked_by

profile_merge_history
├── id, organization_id
├── target_golden_profile_id: uuid
├── merged_golden_profile_ids: uuid[]
├── merge_reason: text
├── field_resolutions: jsonb (qual campo veio de qual fonte)
├── merged_by, merged_at
├── can_undo: boolean
├── undo_deadline: timestamptz
```

**Funcoes RPC:**
```sql
resolve_identity(org_id, identifiers jsonb) RETURNS uuid -- golden_profile_id
merge_golden_profiles(target_id, source_ids uuid[], field_mappings jsonb)
get_unified_customer_view(golden_profile_id) RETURNS jsonb
```

#### 6.2 Data Catalog e Ingestao

**Novas Tabelas:**
```text
data_sources
├── id, organization_id
├── name, description: text
├── source_type: data_source_type_enum
├── connection_config: jsonb
├── status: text
├── last_sync_at: timestamptz
├── sync_frequency: text (cron)
├── created_at, updated_at

data_source_type_enum:
  internal, api, file_upload, webhook, connector

data_connectors (vinculo com connector_instances para ingestao)
├── id, organization_id
├── data_source_id: uuid FK
├── connector_instance_id: uuid FK
├── sync_config: jsonb
├── field_mappings: jsonb

ingestion_jobs
├── id, organization_id
├── data_source_id: uuid FK
├── status: ingestion_status_enum
├── records_processed, records_created, records_updated, records_failed: int
├── started_at, completed_at
├── error_summary: jsonb

event_schemas
├── id, organization_id
├── event_name: text
├── schema_version: int
├── properties_schema: jsonb (JSON Schema)
├── is_active: boolean
├── created_at, updated_at
```

#### 6.3 Segmentacao Avancada e Activation

**Expandir tabela `segments` existente + novas:**
```text
segment_versions
├── id, segment_id
├── version_number: int
├── rules_snapshot: jsonb
├── member_count: int
├── published_at, published_by

activation_destinations
├── id, organization_id
├── name: text
├── destination_type: activation_destination_type_enum
├── config: jsonb
├── created_at

activation_destination_type_enum:
  marketing_campaign, cadence, routing_queue, personalization, external_system

activation_jobs
├── id, organization_id
├── segment_id, destination_id: uuid FK
├── status: activation_status_enum
├── records_synced: int
├── started_at, completed_at
├── next_run_at: timestamptz
├── error_message: text

activation_status_enum:
  pending, running, completed, failed, paused
```

---

### FASE 7: MARKETING EXECUCAO REAL
**Objetivo:** Conectar marketing com providers reais de mensageria

#### 7.1 Message Providers

**Novas Tabelas:**
```text
message_providers
├── id, organization_id
├── provider_type: message_provider_type_enum
├── name: text
├── connector_instance_id: uuid FK
├── config: jsonb (from_address, sender_id, etc)
├── is_default: boolean
├── status: text
├── created_at, updated_at

message_provider_type_enum:
  email, sms, whatsapp, push

message_sends
├── id, organization_id
├── provider_id: uuid FK
├── campaign_id, journey_run_id: uuid FK (opcional)
├── recipient_type, recipient_id: text
├── recipient_address: text
├── message_type: text
├── subject, content: text
├── template_id: text
├── status: message_send_status_enum
├── sent_at, delivered_at, opened_at, clicked_at
├── bounce_type, error_message: text
├── external_message_id: text

message_send_status_enum:
  pending, sending, sent, delivered, opened, clicked, bounced, failed
```

#### 7.2 Journey Execution Engine

**Expandir tabelas existentes + novas:**
```text
journey_runs
├── id, journey_id
├── enrollment_id: uuid FK
├── current_step_id: uuid FK
├── status: journey_run_status_enum
├── started_at, completed_at
├── next_step_at: timestamptz

journey_step_runs
├── id, journey_run_id
├── step_id: uuid FK
├── status: text
├── input_data, output_data: jsonb
├── started_at, completed_at
├── error_message: text

journey_event_log
├── id, journey_run_id
├── event_type: text
├── event_data: jsonb
├── external_event_id: text
├── received_at
```

#### 7.3 Preference Center

**Novas Tabelas:**
```text
preference_centers
├── id, organization_id
├── name: text
├── config: jsonb (canais, topicos, frequencias)
├── public_url_slug: text
├── branding: jsonb
├── is_default: boolean
├── created_at, updated_at

contact_preferences
├── id, organization_id
├── contact_id, golden_profile_id: uuid FK
├── channel_preferences: jsonb (email: opt_in, sms: opt_out, etc)
├── topic_preferences: jsonb
├── frequency_limit: text
├── updated_at, updated_source: text
```

**Novas Rotas:**
- `/marketing/providers` - Configurar provedores de email/SMS
- `/marketing/preference-center` - Configurar centro de preferencias
- `/marketing/personalization` - Regras de personalizacao
- `/marketing/intelligence` - ROI, CAC, LTV, coortes

---

### FASE 8: PORTALS (Customer + Partner)
**Objetivo:** Expandir portal do cliente e criar portal de parceiros

#### 8.1 Customer Portal Expandido

**Funcionalidades a adicionar:**
- Historico de pedidos e rastreamento
- Faturas e pagamentos
- Gerenciamento de devolucoes
- Centro de preferencias de comunicacao
- Chat widget integrado
- Base de conhecimento filtrada

**Expandir `customer_portal_settings`:**
```text
+ enabled_features: jsonb (orders, invoices, returns, preferences, chat)
+ branding: jsonb (logo, cores, favicon)
+ custom_domain: text
+ default_language: text
```

#### 8.2 Partner Portal (NOVO)

**Novas Tabelas:**
```text
partners
├── id, organization_id
├── partner_type: partner_type_enum
├── company_name, trading_name: text
├── tax_id: text
├── tier: partner_tier_enum
├── status: partner_status_enum
├── commission_rate: numeric
├── territory_ids: uuid[]
├── contact_email, contact_phone: text
├── address: jsonb
├── created_at, updated_at

partner_type_enum:
  reseller, referral, affiliate, technology, service

partner_tier_enum:
  bronze, silver, gold, platinum

partner_status_enum:
  prospect, pending_approval, active, suspended, terminated

partner_users
├── id, partner_id
├── email, first_name, last_name: text
├── password_hash: text
├── role: partner_user_role_enum
├── permissions: jsonb
├── status: text
├── last_login_at: timestamptz
├── created_at, updated_at

partner_user_role_enum:
  admin, sales, viewer

partner_deals
├── id, organization_id, partner_id
├── deal_type: partner_deal_type_enum
├── lead_id, opportunity_id, order_id: uuid FK
├── status: partner_deal_status_enum
├── deal_value: numeric
├── commission_amount: numeric
├── commission_status: commission_status_enum
├── submitted_at, approved_at, paid_at: timestamptz
├── notes: text

partner_deal_type_enum:
  lead_referral, co_sell, resale

partner_deal_status_enum:
  submitted, under_review, approved, rejected, won, lost

commission_status_enum:
  pending, approved, paid, cancelled

partner_entitlements
├── id, partner_id
├── entitlement_type: text (demo_licenses, sandbox, training, support_level)
├── value: jsonb
├── valid_from, valid_until: timestamptz
```

**Novas Rotas Partner Portal:**
- `/partner/login`
- `/partner/dashboard`
- `/partner/deals`
- `/partner/deals/new`
- `/partner/commissions`
- `/partner/resources`
- `/partner/training`

---

## RESUMO DE ENTREGAS POR FASE

| Fase | Novas Tabelas | Edge Functions | Novas Rotas | Prioridade |
|------|---------------|----------------|-------------|------------|
| 1 - Core Platform | ~10 | 2 | ~8 | CRITICA |
| 2 - Omnichannel | ~8 | 3 | ~5 | ALTA |
| 3 - WhatsApp/Voice/Chat | ~10 | 4 | ~6 | ALTA |
| 4 - AI Agents | ~12 | 5 | ~10 | MEDIA-ALTA |
| 5 - iPaaS | ~10 | 3 | ~5 | MEDIA |
| 6 - Data Hub | ~10 | 2 | ~6 | MEDIA |
| 7 - Marketing Exec | ~8 | 4 | ~5 | MEDIA |
| 8 - Portals | ~8 | 2 | ~15 | BAIXA |

**Total Estimado:**
- ~76 novas tabelas
- ~25 Edge Functions
- ~60 novas rotas/paginas
- ~15 novos enums

---

## CONSIDERACOES TECNICAS

### Padroes Obrigatorios

1. **Toda nova tabela deve ter:**
   - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
   - `organization_id uuid REFERENCES organizations(id)`
   - `created_at timestamptz DEFAULT now()`
   - `updated_at timestamptz DEFAULT now()`
   - `created_by uuid REFERENCES profiles(id)`
   - `updated_by uuid REFERENCES profiles(id)`
   - RLS habilitado com policies

2. **Indices obrigatorios:**
   - `organization_id` em todas as tabelas
   - `created_at DESC` para listagens
   - Campos de busca frequente (email, phone, name)

3. **Seguranca:**
   - Todas as funcoes SECURITY DEFINER devem ter `SET search_path TO 'public'`
   - Nenhuma policy com `USING (true)` em operacoes criticas
   - PII deve ser mascarado em logs

### Integracao com Lovable AI

Para os agentes IA, utilizar o gateway Lovable AI:
- Endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions`
- Modelo padrao: `google/gemini-3-flash-preview`
- API Key: `LOVABLE_API_KEY` (pre-configurada)

---

## PROXIMOS PASSOS

Apos aprovacao deste plano, a implementacao seguira a ordem das fases, comecando pela **Fase 1 - Core Platform** que e a fundacao para todas as outras funcionalidades modulares.

Cada fase sera implementada com:
1. Migrations SQL para novas tabelas
2. RLS policies para seguranca
3. Edge Functions quando necessario
4. Componentes React para UI
5. Testes de integracao
6. Documentacao

