
# PLANO DE EVOLUCAO - FASE 2: FIREWARE CRM ENTERPRISE HARDENING

## Diagnostico Atualizado

Apos analise exaustiva do codigo, banco de dados, rotas, edge functions e componentes, o Fireware CRM possui atualmente:

- 80+ paginas React implementadas com dados reais
- 26 migrations SQL executadas
- 14 arquivos de rotas cobrindo todos os modulos
- 7 Edge Functions deployadas
- Sistema de notificacoes em tempo real funcional
- Dashboard Builder customizavel com 11 tipos de widget
- Email Template Builder visual com A/B Testing
- AI Agent Studio com 25 tool handlers reais
- Omnichannel Inbox com envio real de mensagens
- Customer 360 com score de engajamento

## LACUNAS IDENTIFICADAS PARA ESTA NOVA FASE

### Categoria 1: Experiencia do Usuario Incompleta
- **Portal do Parceiro**: Login e mock (linha 19: `toast.info('Portal do Parceiro em configuracao')`) -- autenticacao nao implementada de verdade
- **Portal Layout do Cliente**: Usa dados mock (linha 59: `const user = { name: 'Joao Silva' }`) -- nao integrado com autenticacao real do portal
- **Dark Mode**: Implementacao manual via `classList.toggle('dark')` sem persistencia e sem provider adequado (next-themes instalado mas nao utilizado)
- **Global Search**: Busca apenas 5 entidades (lead, account, contact, opportunity, quote) -- faltam tickets, contratos, artigos KB, pedidos, etc.

### Categoria 2: Robustez Arquitetural
- **Nenhum loading skeleton global**: Cada pagina reimplementa skeletons manualmente
- **Nenhum error boundary**: Erros em componentes crasham a aplicacao inteira
- **Nenhum sistema de cache inteligente**: `staleTime` e `cacheTime` variados sem padrao
- **Nenhum prefetch de rotas**: Navegacao entre paginas sempre carrega do zero
- **Nenhuma protecao contra rotas protegidas**: Qualquer rota e acessivel sem login (apenas redirect manual em `useEffect`)

### Categoria 3: Funcionalidades Enterprise Ausentes
- **Import/Export em massa**: CSVImportDialog existe mas sem integracao em larga escala
- **Customizacao de campos**: Nenhum sistema de custom fields configuravel por entidade
- **Regras de SLA completas**: Tabela existe mas nenhuma UI de configuracao de SLA policies
- **Scheduling/Cron**: Journey processor e agentes IA nao possuem agendamento automatico
- **Bulk actions**: Nenhuma operacao em lote nas listagens (delete, assign, update status)
- **Audit trail visual**: AuditLogs existe como pagina mas nao mostra diffs de alteracoes

---

## BLOCOS DE IMPLEMENTACAO

### BLOCO 1: Infraestrutura de Qualidade (Error Boundaries, Theme Provider, Auth Guards)

**Objetivo:** Elevar a resiliencia e UX base de toda a aplicacao.

#### 1.1 Error Boundary Global
- Criar `src/components/ErrorBoundary.tsx` como class component React com:
  - Captura de erros em qualquer componente filho
  - UI de fallback com opcao de "Tentar novamente" e "Reportar erro"
  - Log automatico do erro no `console.error` com stack trace
  - Reset do estado ao navegar para outra rota
- Envolver toda a aplicacao no `App.tsx` dentro do ErrorBoundary

#### 1.2 Theme Provider com Persistencia
- Substituir a implementacao manual de dark mode no `AppTopbar.tsx` pelo `next-themes` (ja instalado)
- Criar `src/components/ThemeProvider.tsx` usando `ThemeProvider` do `next-themes` com:
  - `attribute="class"`, `defaultTheme="system"`, `enableSystem=true`
  - Persistencia automatica via `localStorage`
- Refatorar `AppTopbar.tsx` para usar `useTheme()` do next-themes
- Adicionar opcao "Sistema" alem de Claro/Escuro

#### 1.3 Protecao de Rotas (Auth Guard Global)
- Criar `src/components/guards/AuthGuard.tsx` que:
  - Verifica se o usuario esta autenticado via `useAuth()`
  - Redireciona para `/auth` se nao logado
  - Mostra skeleton de loading enquanto verifica sessao
  - Previne flash de conteudo nao autorizado
- Criar `src/components/guards/ProtectedLayout.tsx` que combina `AuthGuard` + `AppLayout`
- Refatorar `App.tsx` para usar o `ProtectedLayout` em todas as rotas internas, eliminando a necessidade de `useEffect` + `navigate('/auth')` repetido em cada pagina individualmente

#### 1.4 Sistema de Cache Padronizado
- Criar `src/lib/queryConfig.ts` com constantes de cache:
  - `STALE_TIMES`: static (30min), dynamic (2min), realtime (30s)
  - `CACHE_TIMES`: long (1h), medium (10min), short (2min)
  - `RETRY_CONFIG`: maxRetries, retryDelay por tipo de query
- Configurar o `QueryClient` no `App.tsx` com defaults globais coerentes

---

### BLOCO 2: Global Search Expandido + Busca com IA

**Objetivo:** Transformar a busca global em um comando center universal (Cmd+K).

#### 2.1 Busca Universal Expandida
- Refatorar `GlobalSearch.tsx` para buscar em 12 entidades:
  - Leads, Contas, Contatos, Oportunidades, Propostas (ja existem)
  - **Novos**: Tickets, Contratos, Artigos KB, Pedidos, Produtos, Agentes IA, Campanhas
- Adicionar busca em `tickets` (por titulo e numero), `contracts` (por titulo), `knowledge_articles` (por titulo), `orders` (por numero), `products` (por nome/sku), `ai_agents` (por nome), `campaigns` (por nome)
- Implementar navegacao por teclado com setas, Enter para navegar, Esc para fechar
- Agrupar resultados por tipo com headers de secao
- Mostrar atalhos recentes (ultimas 5 entidades visitadas) quando a busca esta vazia

#### 2.2 Busca com IA via Linguagem Natural
- Adicionar tab "IA" no GlobalSearch para perguntas em linguagem natural
- Integrar com Lovable AI (modelo `google/gemini-2.5-flash`) via Edge Function
- Criar Edge Function `ai-search` que:
  - Recebe query em linguagem natural (ex: "quais oportunidades estao paradas ha mais de 30 dias?")
  - Traduz para SQL seguro usando schema pre-definido
  - Executa a query com RLS ativo (usando token do usuario)
  - Retorna resultados formatados
- UI de resultados da IA com cards interativos que linkam para as entidades encontradas

---

### BLOCO 3: Operacoes em Lote (Bulk Actions) em Todas as Listagens

**Objetivo:** Permitir acoes massivas em todas as tabelas de listagem do CRM.

#### 3.1 Hook Generico useBulkActions
- Criar `src/hooks/useBulkActions.ts` com:
  - Gerenciamento de selecao (select all, select page, select individual)
  - Estado de selecao com contagem
  - Acoes genericas: delete, update field, assign, export CSV
  - Confirmacao via AlertDialog antes de acoes destrutivas
  - Feedback com progress bar durante operacoes longas

#### 3.2 Componente BulkActionBar
- Criar `src/components/BulkActionBar.tsx` com:
  - Barra flutuante no topo da tabela quando itens estao selecionados
  - Exibe contagem de selecionados
  - Botoes de acao contextuais por entidade
  - Animacao de entrada/saida suave
  - Suporte a desfazer (undo) com timer de 5 segundos

#### 3.3 Integracao em Listagens Principais
- Integrar BulkActionBar em: Leads, Contacts, Accounts, Opportunities, Tickets, Orders
- Acoes especificas por entidade:
  - **Leads**: Atribuir dono, alterar status, converter em massa, excluir
  - **Contacts**: Atribuir conta, adicionar a segmento, excluir
  - **Opportunities**: Alterar estagio, atribuir dono, excluir
  - **Tickets**: Alterar prioridade, atribuir agente, alterar status, excluir
  - **Orders**: Alterar status, excluir
- Cada operacao gera registro em `audit_logs` e timeline_events

---

### BLOCO 4: Custom Fields Dinamicos

**Objetivo:** Permitir que organizacoes criem campos personalizados em qualquer entidade.

#### 4.1 Database Migration - Custom Fields Engine
- Novas tabelas:
  - `custom_field_definitions`: Definicao de campos custom por entidade
    - `id`, `organization_id`, `entity_type` (lead, contact, account, opportunity, ticket, order), `field_name`, `field_label`, `field_type` (text, number, decimal, date, datetime, boolean, select, multiselect, url, email, phone, textarea, lookup), `is_required`, `default_value`, `options` (JSONB para select/multiselect), `validation_rules` (JSONB), `display_order`, `section_name`, `is_active`, `created_at`, `updated_at`
  - `custom_field_values`: Valores dos campos custom
    - `id`, `organization_id`, `field_definition_id` FK, `entity_type`, `entity_id`, `value_text`, `value_number`, `value_date`, `value_boolean`, `value_json`, `created_at`, `updated_at`
    - Indice unico em (`field_definition_id`, `entity_id`)
- RLS baseada em `is_member_of_org(organization_id)`
- Trigger `updated_at` automatico

#### 4.2 Hook useCustomFields
- Criar `src/hooks/useCustomFields.ts` com:
  - `useCustomFieldDefinitions(entityType)` -- busca definicoes de campos para uma entidade
  - `useCustomFieldValues(entityType, entityId)` -- busca valores de um registro
  - `useSaveCustomFieldValues()` -- mutation para salvar valores
  - Validacao client-side baseada em `validation_rules`
  - Cache inteligente para definicoes (staleTime longo pois mudam raramente)

#### 4.3 Componente CustomFieldsRenderer
- Criar `src/components/CustomFieldsRenderer.tsx`:
  - Renderiza campos custom dinamicamente baseado no `field_type`
  - Suporta todos os 13 tipos de campo
  - Agrupamento por `section_name` com acordeoes
  - Validacao em tempo real
  - Skeleton loading enquanto carrega definicoes

#### 4.4 Pagina de Administracao de Custom Fields
- Criar `src/pages/admin/CustomFieldsAdmin.tsx`:
  - Tabs por tipo de entidade (Lead, Contato, Conta, Oportunidade, Ticket, Pedido)
  - Lista de campos com drag-and-drop para reordenar (`display_order`)
  - Dialog de criacao/edicao de campo com preview ao vivo
  - Opcao de desativar campo (nao excluir, para preservar dados historicos)
- Adicionar rota `/admin/platform/custom-fields` e link no sidebar de Administracao

#### 4.5 Integracao nos Formularios Existentes
- Integrar `CustomFieldsRenderer` nos formularios: `LeadForm`, `ContactForm`, `AccountForm`, `OpportunityForm`, `TicketForm`, `OrderForm`
- Integrar visualizacao de custom fields nas paginas de detalhe correspondentes

---

### BLOCO 5: SLA Management Console + Alertas Proativos

**Objetivo:** Criar interface completa de gestao de SLAs com alertas em tempo real.

#### 5.1 Database Migration - SLA Policies
- Novas tabelas:
  - `sla_policies`: Politicas de SLA configuráveis
    - `id`, `organization_id`, `name`, `description`, `entity_type` (ticket, conversation), `priority_rules` (JSONB: array de `{ priority, first_response_minutes, resolution_minutes }`), `business_hours_id` FK, `escalation_rules` (JSONB: array de `{ threshold_percent, action, notify_user_ids }`), `is_active`, `is_default`, `created_at`, `updated_at`
  - `business_hours`: Horarios comerciais
    - `id`, `organization_id`, `name`, `timezone`, `schedule` (JSONB: `{ monday: { start: "09:00", end: "18:00" }, ... }`), `holidays` (JSONB: array de datas), `is_default`, `created_at`, `updated_at`
  - `sla_breaches`: Registro de violacoes de SLA
    - `id`, `organization_id`, `sla_policy_id` FK, `entity_type`, `entity_id`, `breach_type` (first_response, resolution), `target_minutes`, `actual_minutes`, `breached_at`, `assignee_id`, `metadata` (JSONB)
- RLS baseada em `is_member_of_org`

#### 5.2 SLA Management UI
- Criar `src/pages/service/SLAManagement.tsx`:
  - Lista de SLA policies com status ativo/inativo
  - Editor de policy com:
    - Regras por prioridade (urgente, alta, media, baixa) com tempos de primeira resposta e resolucao
    - Vinculacao a horarios comerciais
    - Regras de escalation (a 50%, 80%, 100% do tempo)
    - Preview visual do SLA timeline
  - Dashboard de compliance: % SLA atendido por periodo, por fila, por agente
  - Lista de breaches recentes com link para o ticket/conversa

#### 5.3 Business Hours UI
- Criar `src/pages/service/BusinessHours.tsx`:
  - Editor visual de horarios por dia da semana
  - Gestao de feriados com calendario
  - Suporte a multiplos fusos horarios
  - Associacao com SLA policies

#### 5.4 Rotas e Sidebar
- Adicionar `/service/sla` e `/service/business-hours` no `ServiceRoutes.tsx`
- Adicionar "Gestao SLA" e "Horarios" na secao de Atendimento do sidebar

---

### BLOCO 6: Import/Export Universal com Mapeamento de Campos

**Objetivo:** Sistema robusto de importacao e exportacao de dados para todas as entidades.

#### 6.1 Database Migration - Import Jobs
- Novas tabelas:
  - `import_jobs`: Historico de importacoes
    - `id`, `organization_id`, `entity_type`, `file_name`, `file_size_bytes`, `total_rows`, `processed_rows`, `success_rows`, `error_rows`, `duplicate_rows`, `field_mapping` (JSONB), `status` (pending, processing, completed, failed, cancelled), `error_log` (JSONB: array de `{ row, field, error }`), `started_by`, `started_at`, `completed_at`, `created_at`
  - `export_jobs`: Historico de exportacoes
    - `id`, `organization_id`, `entity_type`, `filters` (JSONB), `columns` (JSONB), `format` (csv, xlsx, json), `total_rows`, `status`, `file_url`, `started_by`, `started_at`, `completed_at`, `created_at`
- RLS baseada em `is_member_of_org`

#### 6.2 Componente ImportWizard Universal
- Criar `src/components/ImportWizard.tsx`:
  - Wizard de 4 etapas:
    1. **Upload**: Arrastar arquivo CSV/XLSX, preview das primeiras 5 linhas
    2. **Mapeamento**: Associar colunas do arquivo com campos da entidade (incluindo custom fields), deteccao automatica por nome similar
    3. **Validacao**: Pre-validacao de todos os registros, exibicao de erros por linha, opcao de corrigir ou pular
    4. **Execucao**: Barra de progresso com contagem de sucesso/erro/duplicata, log de erros downloadable
  - Deteccao de duplicatas baseada em email/CNPJ/telefone
  - Suporte a dry-run (simular sem importar)

#### 6.3 Componente ExportDialog Universal
- Criar `src/components/ExportDialog.tsx`:
  - Selecao de colunas para exportar (incluindo custom fields)
  - Aplicacao dos filtros atuais da listagem
  - Formatos: CSV, JSON
  - Geracao client-side para ate 5.000 registros
  - Para volumes maiores: fila de exportacao com notificacao quando pronto

#### 6.4 Integracao nas Listagens
- Adicionar botoes de Import/Export em: Leads, Contacts, Accounts, Opportunities, Products, Tickets, Orders
- Cada importacao gera registro em `audit_logs` com tipo `data_import`

---

### BLOCO 7: Portal do Parceiro - Autenticacao Real e Dashboards

**Objetivo:** Transformar o Portal do Parceiro de mock para producao.

#### 7.1 Autenticacao Real do Partner Portal
- Refatorar `PartnerLogin.tsx` para:
  - Chamar RPC `authenticate_partner_user(email, password)` que ja existe no banco
  - Armazenar session token em localStorage com expiracao
  - Implementar `usePartnerAuth()` hook com: login, logout, isAuthenticated, partnerProfile
  - Implementar interceptor que verifica sessao valida em toda navegacao do portal
- Refatorar `PartnerLayout.tsx` para:
  - Usar `usePartnerAuth()` ao inves de dados mock
  - Mostrar nome real do parceiro e logo da empresa
  - Implementar auto-redirect para login se sessao expirada

#### 7.2 Portal do Cliente - Autenticacao Real
- Refatorar `PortalLayout.tsx` para:
  - Eliminar dados mock (linhas 58-63)
  - Usar RPC `authenticate_portal_user` + sessao real
  - Implementar `usePortalAuth()` hook
  - Carregar dados reais do contato logado

#### 7.3 Dashboard do Parceiro com Dados Reais
- Verificar e corrigir `PartnerDashboard.tsx` para que:
  - Todos os KPIs busquem dados reais de `partner_deals` e `partner_commissions`
  - Graficos usem Recharts com dados do banco
  - Filtro por periodo (mes, trimestre, ano)

---

### BLOCO 8: Scheduling Engine para Jornadas e Agentes IA

**Objetivo:** Implementar agendamento automatico para processos que precisam rodar periodicamente.

#### 8.1 Database Migration - Scheduled Tasks
- Nova tabela:
  - `scheduled_tasks`: Tarefas agendadas
    - `id`, `organization_id`, `task_type` (journey_process, ai_agent_run, report_generation, data_sync, sla_check), `entity_type`, `entity_id`, `cron_expression`, `next_run_at`, `last_run_at`, `status` (active, paused, completed, failed), `retry_count`, `max_retries`, `config` (JSONB), `created_by`, `created_at`, `updated_at`
  - `task_executions`: Historico de execucoes
    - `id`, `scheduled_task_id` FK, `started_at`, `completed_at`, `status` (running, completed, failed, timeout), `result` (JSONB), `error_message`, `duration_ms`
- RPC `get_due_tasks()` que retorna tarefas com `next_run_at <= now()` e status active
- RPC `complete_task_execution(task_id, status, result)` que atualiza a proxima execucao baseada no cron

#### 8.2 Edge Function - Task Scheduler
- Criar Edge Function `task-scheduler`:
  - Chamada via cron externo (ou manualmente via botao no admin)
  - Busca tarefas devidas via `get_due_tasks()`
  - Para cada tarefa, executa a acao correspondente:
    - `journey_process`: chama `journey-processor` Edge Function
    - `ai_agent_run`: chama `ai-agent-execute` Edge Function
    - `report_generation`: gera relatorio e salva resultado
    - `sla_check`: verifica SLAs proximos de vencer e cria notificacoes
  - Registra execucao em `task_executions`
  - Calcula proximo `next_run_at` baseado no `cron_expression`

#### 8.3 UI de Gestao de Tarefas Agendadas
- Criar `src/pages/admin/ScheduledTasks.tsx`:
  - Lista de tarefas agendadas com status, proxima execucao, historico
  - Criacao/edicao com expressao cron visual (selecionar frequencia: a cada X minutos/horas/dias)
  - Botao de execucao manual
  - Log de execucoes com detalhes e duracao
  - Indicadores de saude (tarefas falhadas, atrasadas)

#### 8.4 Rota e Sidebar
- Adicionar `/admin/platform/scheduled-tasks` no `AdminRoutes.tsx`
- Adicionar "Agendamentos" na secao de Administracao do sidebar

---

### BLOCO 9: Audit Trail com Diffs Visuais

**Objetivo:** Expandir o sistema de auditoria para mostrar exatamente o que mudou em cada registro.

#### 9.1 Database Migration - Change Tracking
- Nova tabela:
  - `entity_change_log`: Log detalhado de mudancas
    - `id`, `organization_id`, `entity_type`, `entity_id`, `entity_name`, `action` (create, update, delete), `changed_by`, `changed_at`, `changes` (JSONB: array de `{ field, old_value, new_value, field_label }`), `ip_address`, `user_agent`, `metadata` (JSONB)
- Trigger generico `track_entity_changes()` que:
  - Em UPDATE: compara OLD vs NEW row e registra apenas campos alterados
  - Em INSERT: registra todos os campos como `old_value: null`
  - Em DELETE: registra todos os campos como `new_value: null`
- Aplicar trigger em: `leads`, `contacts`, `accounts`, `opportunities`, `tickets`, `orders`, `contracts`, `quotes`

#### 9.2 Componente ChangeHistory
- Criar `src/components/ChangeHistory.tsx`:
  - Timeline de alteracoes com avatar do usuario, data e hora
  - Para cada alteracao, mostrar diff visual:
    - Texto: highlight vermelho (removido) e verde (adicionado)
    - Status: badge anterior -> badge novo
    - Numeros: valor anterior vs novo
    - Datas: data anterior vs nova
  - Paginacao com "Carregar mais"
  - Filtro por usuario e por campo

#### 9.3 Integracao nas Paginas de Detalhe
- Adicionar tab "Historico" em: LeadDetail, ContactDetail, AccountDetail, OpportunityDetail, TicketDetail, OrderDetail, ContractDetail, QuoteDetail
- O tab usa `ChangeHistory` com o `entity_type` e `entity_id` do registro

---

### BLOCO 10: Dashboard Principal Modular

**Objetivo:** Transformar o Dashboard principal em um hub modular que agrega dados de todos os modulos habilitados.

#### 10.1 Refatoracao do Dashboard.tsx
- Reestruturar `Dashboard.tsx` para:
  - Carregar dados condicionalmente baseado nos modulos habilitados (`useModuleAccess`)
  - Secao de vendas: Pipeline, Top Deals, Atividades (ja existe, melhorar)
  - **Nova secao de Atendimento**: Tickets abertos por prioridade, SLA compliance %, conversas aguardando resposta
  - **Nova secao de Marketing**: Campanhas ativas, leads gerados no periodo, taxa de abertura de emails
  - **Nova secao de IA**: Agentes ativos, execucoes recentes, taxa de sucesso
  - **Nova secao de Commerce**: Pedidos do dia, receita do mes, devolucoes pendentes
- Cada secao so aparece se o modulo correspondente esta habilitado

#### 10.2 Widgets Compactos Reutilizaveis
- Criar `src/components/dashboard/` com widgets:
  - `KPICardCompact.tsx`: Card generico com icone, titulo, valor, variacao %
  - `MiniChartWidget.tsx`: Sparkline chart compacto para tendencias
  - `AlertsWidget.tsx`: Lista de alertas criticos (SLA breach, deals parados, contratos expirando)
  - `TasksWidget.tsx`: Tarefas pendentes do usuario logado
  - `QuickStatsRow.tsx`: Linha horizontal de KPIs condensados

---

## SEQUENCIA DE IMPLEMENTACAO

```text
PASSO 1: Bloco 1 (Infraestrutura)
  - Error Boundary, Theme Provider, Auth Guard, Cache config
  - Impacta toda a aplicacao mas nao requer migrations
  - Estimativa: 1 mensagem

PASSO 2: Bloco 4 (Custom Fields) + Bloco 9 (Audit Trail)
  - Migration com ~4 tabelas + triggers
  - Hook, componente renderizador, pagina admin
  - Estimativa: 2-3 mensagens

PASSO 3: Bloco 3 (Bulk Actions) + Bloco 6 (Import/Export)
  - Migration com ~2 tabelas
  - Hooks e componentes genericos + integracao
  - Estimativa: 2 mensagens

PASSO 4: Bloco 2 (Global Search Expandido)
  - Edge Function ai-search
  - Refatoracao do GlobalSearch
  - Estimativa: 1-2 mensagens

PASSO 5: Bloco 5 (SLA Management)
  - Migration com ~3 tabelas
  - 2 novas paginas
  - Estimativa: 1-2 mensagens

PASSO 6: Bloco 7 (Portais - Auth Real)
  - Refatoracao de hooks e layouts
  - Nao requer migrations
  - Estimativa: 1-2 mensagens

PASSO 7: Bloco 8 (Scheduling Engine)
  - Migration com ~2 tabelas
  - Nova Edge Function
  - Pagina admin
  - Estimativa: 1-2 mensagens

PASSO 8: Bloco 10 (Dashboard Modular)
  - Componentes de widget + refatoracao
  - Estimativa: 1 mensagem
```

---

## TOTAIS ESTIMADOS

| Item | Quantidade |
|------|-----------|
| Novas tabelas SQL | ~12 |
| Novos triggers | ~9 |
| Novas RPCs | ~4 |
| Nova Edge Function | 2 (ai-search, task-scheduler) |
| Novos hooks reutilizaveis | ~6 |
| Novos componentes genericos | ~8 |
| Novas paginas | ~5 |
| Paginas refatoradas | ~15+ |
| Rotas adicionadas | ~5 |
| Entradas no sidebar | ~4 |

## PADROES OBRIGATORIOS

1. Toda nova tabela: `id uuid PK DEFAULT gen_random_uuid()`, `organization_id uuid FK NOT NULL`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`, RLS habilitado
2. RLS: Policies baseadas em `is_member_of_org(organization_id)` para SELECT/INSERT/UPDATE/DELETE, sem `USING (true)` em operacoes criticas
3. Funcoes SQL: `SECURITY DEFINER SET search_path TO 'public'`
4. Frontend: Componentes shadcn/radix, hooks `useQuery`/`useMutation` com staleTime padronizado, toast para feedback, locale `ptBR`
5. Todas as paginas internas dentro de `ProtectedLayout` (novo), portais usam seus layouts proprios com auth guards dedicados
6. Custom fields renderizados automaticamente em todos os formularios que suportam a entidade
7. Toda operacao de escrita gera entrada em `entity_change_log` via trigger automatico
