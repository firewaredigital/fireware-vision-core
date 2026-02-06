

# PLANO DE IMPLEMENTACAO - FASES 4 A 8 DO FIREWARE CRM ECOSYSTEM

## Analise do Estado Atual (Pos-Fases 1-3)

### O que ja foi implementado com sucesso

**Banco de Dados:**
- 137 tabelas existentes no schema public
- 80 enums criados
- 68 funcoes RPC implementadas
- 4 Edge Functions deployadas (whatsapp-webhook, whatsapp-send, chat-widget, voice-webhook)

**Fase 1 - Core Platform (CONCLUIDA):**
- Tabelas: `org_modules`, `permission_sets`, `permission_set_assignments`, `system_metrics`, `system_events`, `integration_run_logs`
- RPCs: `is_module_enabled`, `user_has_permission`, `get_user_permissions`, `get_org_enabled_modules`, `log_system_event`, `record_system_metric`, `update_module_usage`
- Hooks: `useModuleAccess`, `usePermissions`
- Guards: `ModuleGuard`, `PermissionGuard`, `Can` component
- Admin Pages: `/admin/platform/modules`, `/admin/platform/permissions`, `/admin/platform/observability`

**Fase 2 - Omnichannel Inbox (CONCLUIDA):**
- Tabelas: `conversations`, `conversation_messages`, `conversation_participants`, `routing_queues`, `queue_members`, `routing_rules_v2`, `routing_assignments`, `agent_status`, `agent_capacity`, `agent_skills`, `business_hours`
- RPCs: `generate_conversation_number`, `assign_conversation_to_agent`, `get_next_conversation`, `update_agent_availability`
- Hook: `useConversations` com real-time subscriptions
- UI: `OmnichannelInbox.tsx` com layout de 3 paineis

**Fase 3 - WhatsApp + Chat + Voice (CONCLUIDA):**
- Tabelas: `whatsapp_accounts`, `whatsapp_templates`, `whatsapp_message_logs`, `whatsapp_optins`, `chat_widgets`, `chat_sessions`, `chat_widget_events`, `voice_providers`, `voice_calls`, `voice_call_events`, `voice_transcripts`, `voice_voicemails`
- Edge Functions: `whatsapp-webhook`, `whatsapp-send`, `chat-widget`, `voice-webhook`
- Admin Pages: `/service/whatsapp`, `/service/chat-widgets`, `/service/voice`

---

### LACUNAS CRITICAS IDENTIFICADAS

#### 1. Guards NAO Aplicados
Os `ModuleGuard` e `PermissionGuard` foram criados mas NAO estao sendo usados em nenhuma rota do `App.tsx` nem no `AppSidebar.tsx`. A sidebar nao filtra menus por modulo habilitado.

#### 2. Admin Console Incompleto
Faltam 3 rotas do Admin Console planejadas:
- `/admin/platform/security`
- `/admin/platform/integrations`
- `/admin/platform/ai`

#### 3. Sidebar sem Module-Awareness
O sidebar mostra todos os modulos sempre, sem verificar `org_modules`.

#### 4. config.toml sem Edge Functions configuradas
O `supabase/config.toml` tem apenas `project_id`, sem configuracao de `verify_jwt` para as 4 Edge Functions existentes.

---

## FASES PENDENTES - PLANO DETALHADO

---

### FASE 4: AI AGENTS (Agent Studio)
**Prioridade: ALTA | Estimativa: 12 tabelas + 2 Edge Functions + 8 paginas**

#### 4.1 Database Migration - Tabelas e Enums

**Novos Enums:**
- `ai_agent_type`: sales, service, marketing, commerce, itsm, data_steward, compliance, custom
- `ai_agent_status`: draft, testing, active, paused, deprecated
- `ai_tool_type`: http_request, database_query, rpc_call, connector_action, workflow_trigger
- `ai_policy_type`: pii_protection, rate_limit, action_restriction, content_filter, approval_required
- `ai_run_status`: pending, running, waiting_approval, completed, failed, cancelled
- `ai_risk_level`: low, medium, high, critical

**Novas Tabelas (12):**

1. `ai_agents` - Registro central de agentes IA
   - id, organization_id, name, description, agent_type (enum), scope text, system_prompt text, model_config jsonb, version int, status (enum), is_native boolean, icon text, created_by, updated_by, created_at, updated_at
   
2. `ai_agent_versions` - Historico de versoes
   - id, organization_id, agent_id FK, version_number int, config_snapshot jsonb, changelog text, published_at, published_by
   
3. `ai_tools` - Ferramentas disponiveis para agentes
   - id, organization_id, name, description, tool_type (enum), parameters_schema jsonb, action_config jsonb, requires_approval boolean, risk_level (enum), is_system boolean, created_by, created_at, updated_at
   
4. `ai_tool_permissions` - Permissoes por tool
   - id, tool_id FK, permission_set_id FK, can_execute boolean, created_at
   
5. `ai_agent_tools` - Relacao M:N agente-ferramenta
   - id, agent_id FK, tool_id FK, is_enabled boolean, custom_config jsonb, created_at
   
6. `ai_policies` - Politicas de governanca
   - id, organization_id, name, description, policy_type (enum), rules jsonb, actions_on_violation text, is_active boolean, priority int, created_by, created_at, updated_at
   
7. `ai_agent_policies` - Relacao M:N agente-politica
   - id, agent_id FK, policy_id FK, is_active boolean, created_at
   
8. `ai_evals` - Suites de avaliacao
   - id, organization_id, agent_id FK, name, description, test_cases jsonb, last_run_at, last_run_results jsonb, pass_rate numeric, created_by, created_at, updated_at
   
9. `ai_runs` - Execucoes de agentes
   - id, organization_id, agent_id FK, triggered_by uuid, trigger_type text, input_context jsonb, output_result jsonb, status (enum), started_at, completed_at, total_tokens_used int, cost_estimate numeric, error_message text, created_at
   
10. `ai_run_steps` - Passos de cada execucao
    - id, run_id FK, organization_id, step_order int, step_type text, tool_id uuid FK, input_data jsonb, output_data jsonb, status text, started_at, completed_at, duration_ms int, error_message text, tokens_used int
    
11. `ai_run_audit_receipts` - Comprovantes de auditoria (CRITICO para governanca)
    - id, run_id FK, organization_id, action_type text, action_description text, affected_entity_type text, affected_entity_id text, data_accessed jsonb (com masking de PII), tool_used text, approved_by uuid, approval_timestamp timestamptz, evidence_attachments jsonb, created_at
    
12. `ai_conversations` - Conversas com agentes (chat)
    - id, organization_id, agent_id FK, user_id FK, title text, messages jsonb, status text, created_at, updated_at

**RLS Policies (todas as 12 tabelas):**
- SELECT: `is_member_of_org(auth.uid(), organization_id)`
- INSERT: `is_member_of_org(auth.uid(), organization_id)`
- UPDATE: `is_member_of_org(auth.uid(), organization_id)`
- DELETE: `user_has_role(auth.uid(), 'admin')`

**Indices:**
- `ai_agents(organization_id, status)`
- `ai_runs(organization_id, agent_id, created_at DESC)`
- `ai_run_audit_receipts(organization_id, run_id, created_at DESC)`
- `ai_runs(status)` para monitoramento

#### 4.2 Edge Function: `ai-agent-execute`

Edge Function que:
1. Recebe o agent_id e input do usuario
2. Carrega config do agente (model, prompt, tools, policies)
3. Valida politicas (PII masking, limites de uso)
4. Chama o Lovable AI Gateway (`google/gemini-3-flash-preview`)
5. Processa tool calls via function calling
6. Registra steps em `ai_run_steps`
7. Gera audit receipts em `ai_run_audit_receipts`
8. Verifica human-in-the-loop: se acao requer aprovacao, cria `approval_request`
9. Retorna resultado via streaming SSE

**Corpo do request para Lovable AI Gateway:**
```text
POST https://ai.gateway.lovable.dev/v1/chat/completions
Headers: Authorization: Bearer LOVABLE_API_KEY
Body: { model, messages, tools (function calling), stream: true }
```

#### 4.3 Edge Function: `ai-agent-tool-executor`

Executa ferramentas individuais com:
- Validacao de permissoes
- Rate limiting por org
- Logging de auditoria
- Masking de PII nos logs

#### 4.4 Seed de Agentes Nativos (INSERT via migration)

Inserir 7 agentes pre-configurados com tools e policies:
- **Sales Agent**: system_prompt focado em vendas, tools de lead/opportunity
- **Service Agent**: triagem omnichannel, KB search, ticket management
- **Marketing Agent**: criacao de campanha, segmentacao, A/B testing
- **Commerce Agent**: rastreamento de pedidos, devolucoes, pagamentos
- **ITSM Agent**: triagem de incidentes, CMDB search, workarounds
- **Data Steward Agent**: deteccao de duplicatas, merge, qualidade
- **Compliance Agent**: processamento LGPD, validacao de consentimento

#### 4.5 Frontend - Paginas do Agent Studio (8 paginas)

1. **`/ai/agents`** - Lista de agentes com cards, filtros por tipo/status, metricas rapidas
2. **`/ai/agents/new`** - Formulario de criacao com editor de system prompt, selecao de modelo, configuracao de tools
3. **`/ai/agents/:id`** - Detalhe do agente com abas: Config, Tools, Policies, Versoes, Runs, Metricas
4. **`/ai/agents/:id/test`** - Playground de chat com streaming, mostrando tool calls em tempo real
5. **`/ai/tools`** - Catalogo de ferramentas com schema, risk level, permissoes
6. **`/ai/policies`** - Lista de politicas com editor de regras JSON, prioridades
7. **`/ai/evals`** - Suites de teste com execucao e resultado pass/fail
8. **`/ai/runs`** - Historico de execucoes com filtros, timeline de steps, audit receipts

#### 4.6 Sidebar Update

Adicionar secao "Inteligencia / IA" no sidebar com links para as rotas acima.

---

### FASE 5: iPaaS NATIVO (Connector Framework)
**Prioridade: MEDIA | Estimativa: 10 tabelas + 1 Edge Function + 5 paginas**

#### 5.1 Database Migration

**Novos Enums:**
- `connector_type`: email, sms, whatsapp, voice, crm, erp, payment, storage, analytics, custom
- `connector_auth_type`: none, api_key, oauth2, basic_auth, custom
- `connector_instance_status`: active, inactive, error, configuring
- `integration_run_status_v2`: pending, running, completed, failed, retrying, dead_letter
- `dlq_status`: pending_review, retrying, resolved, expired, manually_resolved
- `outbox_status`: pending, processing, completed, failed

**Novas Tabelas (10):**

1. `connectors` - Catalogo de conectores nativos
   - id, name, description, connector_type (enum), icon_url, auth_type (enum), config_schema jsonb, capabilities jsonb, documentation_url, is_native boolean, version text, created_at, updated_at

2. `connector_instances` - Instancias configuradas por org
   - id, organization_id, connector_id FK, name, config jsonb, credentials_encrypted text, status (enum), last_health_check timestamptz, health_status text, error_message text, created_by, created_at, updated_at

3. `connector_actions` - Acoes de cada conector
   - id, connector_id FK, action_name, action_type text (trigger/action), description, input_schema jsonb, output_schema jsonb, is_async boolean, rate_limit int, created_at

4. `integration_runs` - Execucoes de integracoes (substitui/expande integration_run_logs)
   - id, organization_id, connector_instance_id FK, workflow_run_id FK, action_name, status (enum), input_payload jsonb, output_payload jsonb, started_at, completed_at, duration_ms int, retry_count int, error_code text, error_message text, idempotency_key text, created_at

5. `dlq_messages` - Dead Letter Queue
   - id, organization_id, original_run_id FK, connector_instance_id FK, action_name, payload jsonb, error_history jsonb, retry_count int, max_retries int, status (enum), created_at, last_retry_at, expires_at, resolved_at, resolved_by uuid

6. `replay_requests` - Solicitacoes de replay
   - id, organization_id, dlq_message_id FK, requested_by FK, request_reason text, status text, new_run_id uuid, replayed_at, result jsonb, created_at

7. `outbox_events` - Event bus outbox
   - id, organization_id, event_type text, aggregate_type text, aggregate_id text, payload jsonb, metadata jsonb (correlation_id, causation_id), status (enum), created_at, processed_at, processor_id text, retry_count int

8. `event_subscriptions` - Assinaturas de eventos
   - id, organization_id, event_type text, subscriber_type text (workflow/connector/webhook), subscriber_config jsonb, is_active boolean, created_by, created_at, updated_at

9. `webhook_endpoints` - Endpoints de webhook de saida
   - id, organization_id, url text, secret text, events text[], is_active boolean, last_triggered_at, failure_count int, created_at, updated_at

10. `webhook_deliveries` - Log de entregas de webhook
    - id, webhook_endpoint_id FK, organization_id, event_type text, payload jsonb, response_status int, response_body text, attempt_count int, status text, created_at, delivered_at

**Seed de Conectores Nativos:**
Inserir registros para os conectores ja implementados:
- WhatsApp Business API (vincula com edge functions existentes)
- Chat Widget (vincula com edge function existente)
- Voice Provider (vincula com edge function existente)
- Email SMTP (placeholder)
- SMS Provider (placeholder)

#### 5.2 Frontend - 5 Paginas

1. **`/integrations/catalog`** - Catalogo visual de conectores nativos com cards, icones, descricoes
2. **`/integrations/instances`** - Instancias configuradas com status de saude, acoes
3. **`/integrations/monitoring`** - Dashboard de execucoes: timeline, taxa de sucesso, latencia p95
4. **`/integrations/dlq`** - Gerenciamento de DLQ: mensagens pendentes, retry, resolve manual
5. **`/integrations/webhooks`** - Gestao de webhooks de saida com logs de entrega

#### 5.3 Sidebar Update
Adicionar secao "Integracoes" no sidebar.

---

### FASE 6: DATA HUB (Golden Record + Activation)
**Prioridade: MEDIA | Estimativa: 10 tabelas + 2 RPCs + 5 paginas**

#### 6.1 Database Migration

**Novos Enums:**
- `golden_profile_type`: person, company
- `data_source_type`: internal, api, file_upload, webhook, connector
- `ingestion_status`: pending, running, completed, failed, partial
- `activation_destination_type`: marketing_campaign, cadence, routing_queue, personalization, external_system
- `activation_status`: pending, running, completed, failed, paused

**Novas Tabelas (10):**

1. `golden_profiles` - Perfil unificado (Golden Record)
   - id, organization_id, profile_type (enum), display_name text, primary_email, primary_phone, primary_document, consolidated_data jsonb, confidence_score numeric, source_count int, tags text[], first_seen_at, last_activity_at, created_at, updated_at

2. `golden_profile_links` - Vinculos entre golden profile e entidades
   - id, golden_profile_id FK, organization_id, entity_type text, entity_id uuid, source text, link_confidence numeric, is_primary boolean, linked_at, linked_by

3. `profile_merge_history` - Historico de unificacoes
   - id, organization_id, target_golden_profile_id FK, source_golden_profile_ids uuid[], merge_reason text, field_resolutions jsonb, merged_by, merged_at, can_undo boolean, undo_deadline timestamptz

4. `data_sources` - Fontes de dados catalogadas
   - id, organization_id, name, description, source_type (enum), connection_config jsonb, status text, last_sync_at, sync_frequency text, record_count int, created_by, created_at, updated_at

5. `data_connectors` - Vinculo fonte-conector
   - id, organization_id, data_source_id FK, connector_instance_id uuid, sync_config jsonb, field_mappings jsonb, last_sync_status text, created_at, updated_at

6. `ingestion_jobs` - Jobs de ingestao
   - id, organization_id, data_source_id FK, status (enum), records_processed int, records_created int, records_updated int, records_failed int, started_at, completed_at, error_summary jsonb, created_by

7. `event_schemas` - Registro de schemas de eventos
   - id, organization_id, event_name, schema_version int, properties_schema jsonb, description text, is_active boolean, created_at, updated_at

8. `segment_versions` - Versionamento de segmentos
   - id, segment_id FK, organization_id, version_number int, rules_snapshot jsonb, member_count int, published_at, published_by

9. `activation_destinations` - Destinos de ativacao
   - id, organization_id, name, destination_type (enum), config jsonb, is_active boolean, created_by, created_at, updated_at

10. `activation_jobs` - Jobs de ativacao de segmentos
    - id, organization_id, segment_id FK, destination_id FK, status (enum), records_synced int, started_at, completed_at, next_run_at, error_message text, created_by, created_at

**Novas RPCs:**
- `resolve_identity(org_id uuid, identifiers jsonb)` - Resolve identidade para golden_profile_id
- `get_unified_customer_view(golden_profile_id uuid)` - Retorna visao unificada com dados de todas as fontes

#### 6.2 Frontend - 5 Paginas

1. **`/data-hub/golden-records`** - Lista de golden profiles com busca, unificacao visual
2. **`/data-hub/golden-records/:id`** - Detalhe do golden record com todas as fontes linkadas, timeline
3. **`/data-hub/sources`** - Catalogo de fontes de dados, status de sync, field mappings
4. **`/data-hub/schemas`** - Registry de event schemas com editor visual
5. **`/data-hub/activation`** - Gestao de activation jobs: segmentos publicados, destinos, status

#### 6.3 Sidebar Update
Expandir secao "Dados & Analytics" com novos links.

---

### FASE 7: MARKETING EXECUCAO REAL
**Prioridade: MEDIA | Estimativa: 8 tabelas + 2 Edge Functions + 4 paginas**

#### 7.1 Database Migration

**Novos Enums:**
- `message_provider_type`: email, sms, whatsapp, push
- `message_send_status`: pending, sending, sent, delivered, opened, clicked, bounced, failed
- `journey_run_status`: active, paused, completed, failed, waiting
- `preference_channel`: email, sms, whatsapp, push, phone

**Novas Tabelas (8):**

1. `message_providers` - Provedores de mensageria por org
   - id, organization_id, provider_type (enum), name, connector_instance_id uuid, config jsonb, is_default boolean, status text, daily_limit int, monthly_limit int, created_by, created_at, updated_at

2. `message_sends` - Log de envios individuais
   - id, organization_id, provider_id FK, campaign_id uuid, journey_run_id uuid, recipient_type text, recipient_id text, recipient_address text, message_type text, subject text, content text, template_id text, status (enum), sent_at, delivered_at, opened_at, clicked_at, bounce_type text, error_message text, external_message_id text, metadata jsonb, created_at

3. `journey_runs` - Execucoes de jornadas
   - id, organization_id, journey_id FK, enrollment_id FK, current_step_id uuid, status (enum), started_at, completed_at, next_step_at, paused_at, error_message text, metadata jsonb

4. `journey_step_runs` - Execucoes de passos individuais
   - id, journey_run_id FK, organization_id, step_id FK, status text, input_data jsonb, output_data jsonb, started_at, completed_at, error_message text, message_send_id uuid

5. `journey_event_log` - Log de eventos de jornada
   - id, journey_run_id FK, organization_id, event_type text, event_data jsonb, external_event_id text, received_at

6. `preference_centers` - Centros de preferencia
   - id, organization_id, name, config jsonb, public_url_slug text, branding jsonb, is_default boolean, created_by, created_at, updated_at

7. `contact_preferences` - Preferencias por contato
   - id, organization_id, contact_id FK, golden_profile_id uuid, channel_preferences jsonb, topic_preferences jsonb, frequency_limit text, global_optout boolean, updated_at, updated_source text

8. `ad_spend` - Gastos com midia/publicidade
   - id, organization_id, campaign_id FK, platform text, date date, spend numeric, impressions int, clicks int, conversions int, currency text, created_at

#### 7.2 Edge Functions

1. **`send-message`** - Motor de envio unificado
   - Recebe provider_id, destinatario, conteudo
   - Roteia para o provider correto (email SMTP, SMS API, WhatsApp via whatsapp-send)
   - Registra em `message_sends`
   - Suporta templates e variaveis

2. **`journey-processor`** - Processador de jornadas
   - Recebe journey_run_id
   - Avalia condicao do proximo step
   - Executa acao (envio, espera, split)
   - Registra em `journey_step_runs`

#### 7.3 Frontend - 4 Paginas

1. **`/marketing/providers`** - Configuracao de provedores de email/SMS/WhatsApp/Push
2. **`/marketing/preference-center`** - Configuracao de centros de preferencia, preview
3. **`/marketing/personalization`** - Regras de personalizacao e conteudo dinamico
4. **`/marketing/intelligence`** - Dashboard de ROI, CAC, LTV, coortes, ad spend

---

### FASE 8: PORTALS (Customer + Partner)
**Prioridade: MEDIA-BAIXA | Estimativa: 8 tabelas + 15 paginas**

#### 8.1 Database Migration

**Novos Enums:**
- `partner_type`: reseller, referral, affiliate, technology, service
- `partner_tier`: bronze, silver, gold, platinum
- `partner_status`: prospect, pending_approval, active, suspended, terminated
- `partner_user_role`: admin, sales, viewer
- `partner_deal_type`: lead_referral, co_sell, resale
- `partner_deal_status`: submitted, under_review, approved, rejected, won, lost
- `commission_status`: pending, approved, paid, cancelled

**Novas Tabelas - Partner Portal (6):**

1. `partners` - Empresas parceiras
   - id, organization_id, partner_type (enum), company_name, trading_name, tax_id, tier (enum), status (enum), commission_rate numeric, territory_ids uuid[], contact_email, contact_phone, address jsonb, website text, logo_url text, created_by, created_at, updated_at

2. `partner_users` - Usuarios do portal de parceiros
   - id, partner_id FK, organization_id, email, first_name, last_name, password_hash text, role (enum), permissions jsonb, status text, last_login_at, login_count int, failed_login_attempts int, locked_until timestamptz, created_at, updated_at

3. `partner_deals` - Deals/indicacoes de parceiros
   - id, organization_id, partner_id FK, deal_type (enum), lead_id uuid, opportunity_id uuid, order_id uuid, status (enum), deal_value numeric, commission_amount numeric, commission_status (enum), submitted_at, approved_at, paid_at, approved_by uuid, notes text, created_at, updated_at

4. `partner_commissions` - Registro de comissoes
   - id, organization_id, partner_id FK, deal_id FK, amount numeric, currency text, status (enum), calculated_at, approved_at, approved_by uuid, paid_at, payment_reference text, created_at

5. `partner_entitlements` - Beneficios dos parceiros
   - id, partner_id FK, organization_id, entitlement_type text, value jsonb, valid_from, valid_until, created_at, updated_at

6. `partner_sessions` - Sessoes do portal de parceiros
   - id, user_id FK, organization_id, session_token text, ip_address text, user_agent text, expires_at, is_active boolean, last_activity_at, created_at, ended_at

**Novas Tabelas - Customer Portal Expandido (2):**

7. `customer_portal_sessions` - Sessoes do portal (se nao existir)
   - id, user_id FK, organization_id, session_token text, ip_address text, user_agent text, expires_at, is_active boolean, last_activity_at, created_at, ended_at

8. `portal_preferences` - Preferencias de comunicacao do portal
   - id, portal_user_id FK, organization_id, channel_preferences jsonb, notification_settings jsonb, language text, timezone text, updated_at

**RPCs para Partner Portal:**
- `authenticate_partner_user(email, password, org_id)` - Autenticacao
- `create_partner_session(user_id)` - Criacao de sessao
- `validate_partner_session(token)` - Validacao

#### 8.2 Frontend - Customer Portal Expandido (4 paginas)

1. **`/portal/orders`** - Historico de pedidos com rastreamento
2. **`/portal/invoices`** - Faturas e pagamentos
3. **`/portal/returns`** - Gerenciamento de devolucoes
4. **`/portal/preferences`** - Centro de preferencias de comunicacao

#### 8.3 Frontend - Partner Portal (11 paginas)

1. **`/partner/login`** - Login do portal de parceiros
2. **`/partner/dashboard`** - Dashboard com metricas, deals recentes, comissoes
3. **`/partner/deals`** - Lista de deals/indicacoes
4. **`/partner/deals/new`** - Formulario de nova indicacao
5. **`/partner/deals/:id`** - Detalhe do deal
6. **`/partner/commissions`** - Historico de comissoes e pagamentos
7. **`/partner/resources`** - Materiais e recursos do parceiro
8. **`/partner/training`** - Treinamentos e certificacoes
9. **`/partner/profile`** - Perfil da empresa parceira
10. **`/partner/users`** - Gestao de usuarios do parceiro (role: admin)
11. **`/partner/layout`** - Layout wrapper para rotas do partner portal

---

## TAREFAS TRANSVERSAIS (aplicar em todas as fases)

### T1. Module-Aware Sidebar
Refatorar `AppSidebar.tsx` para:
- Importar `useModuleAccess`
- Filtrar cada secao de navegacao baseado no modulo habilitado
- Exemplo: secao "Vendas" so aparece se `isModuleEnabled('sales')`
- Secao "IA / Agent Studio" so aparece se `isModuleEnabled('ai_agents')`

### T2. Aplicar ModuleGuard nas Rotas
Envolver rotas no `App.tsx` com `<ModuleGuard>`:
```text
<Route path="/ai/agents" element={
  <ModuleGuard moduleKey="ai_agents" redirectTo="/dashboard">
    <AIAgents />
  </ModuleGuard>
} />
```

### T3. config.toml Atualizado
Configurar `verify_jwt = false` para todas as Edge Functions que precisam ser publicas (webhooks) e manter JWT para as demais.

### T4. Admin Console Complementar
Criar as 3 paginas admin faltantes:
- `/admin/platform/security` - Politicas de senha, sessoes, IP whitelist
- `/admin/platform/integrations` - Visao geral de conectores ativos
- `/admin/platform/ai` - Configuracao global de IA (modelo padrao, limites)

---

## ORDEM DE IMPLEMENTACAO RECOMENDADA

A implementacao deve seguir esta sequencia para maximizar interdependencias:

```text
ETAPA 1 (Primeiro): Tarefas Transversais T1-T4
  - Sidebar module-aware
  - ModuleGuard nas rotas existentes  
  - config.toml
  - Admin pages faltantes

ETAPA 2: Fase 4 - Agent Studio (maior valor de negocio)
  - Migration com 12 tabelas + 6 enums
  - Edge Function ai-agent-execute
  - Seed dos 7 agentes nativos
  - 8 paginas de UI
  - Sidebar update

ETAPA 3: Fase 5 - iPaaS (fundamenta as fases seguintes)
  - Migration com 10 tabelas + 6 enums
  - Seed de conectores nativos
  - 5 paginas de UI

ETAPA 4: Fase 6 - Data Hub
  - Migration com 10 tabelas + 5 enums
  - 2 RPCs de unificacao
  - 5 paginas de UI

ETAPA 5: Fase 7 - Marketing Execucao
  - Migration com 8 tabelas + 4 enums
  - 2 Edge Functions (send-message, journey-processor)
  - 4 paginas de UI

ETAPA 6: Fase 8 - Portals
  - Migration com 8 tabelas + 7 enums
  - RPCs de autenticacao
  - 15 paginas de UI (4 customer + 11 partner)
```

---

## TOTAIS ESTIMADOS PARA IMPLEMENTACAO RESTANTE

| Item | Quantidade |
|------|-----------|
| Novas tabelas | ~48 |
| Novos enums | ~28 |
| Novas RPCs | ~10 |
| Novas Edge Functions | ~5 |
| Novas paginas/rotas | ~42 |
| Refatoracoes (sidebar, guards, config) | ~4 arquivos |

---

## PADROES OBRIGATORIOS EM TODAS AS FASES

1. **Toda tabela**: id uuid PK, organization_id FK, created_at, updated_at, RLS habilitado
2. **RLS**: Policies baseadas em `is_member_of_org()`, sem `USING (true)` em operacoes criticas
3. **Funcoes SQL**: `SECURITY DEFINER SET search_path TO 'public'`
4. **Indices**: organization_id + campos de busca frequente + created_at DESC
5. **Edge Functions**: CORS headers, logging, tratamento de 429/402 do Lovable AI
6. **Frontend**: Usar componentes shadcn/radix, hooks customizados, toast para feedback
7. **Agentes IA**: Usar Lovable AI Gateway com `google/gemini-3-flash-preview`, LOVABLE_API_KEY pre-configurada

