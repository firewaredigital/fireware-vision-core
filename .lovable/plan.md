
# Plano: Estrutura Completa de Dados de Teste para Apresentacao

## Visao Geral

Criar um ecossistema completo de dados ficticios realistas para demonstracao do Fireware CRM, abrangendo todos os modulos principais: CRM (Contas, Contatos, Leads, Oportunidades), Atendimento (Tickets, Conversas Omnichannel, WhatsApp), AI Agents, Marketing, Commerce e Knowledge Base.

**Organizacao:** Fireware (ID: `7c5e540c-2b57-404c-bc9f-100d0279976c`)
**Usuario teste:** teste@fireware.com (ID: `d9e608f3-3a87-430d-8331-cc96959d1714`)

---

## Fase 1 - Base CRM (Contas, Contatos, Leads)

### 1.1 Contas (12 empresas brasileiras ficticias)

| Empresa | Industria | Receita Anual | Funcionarios |
|---------|-----------|---------------|--------------|
| TechNova Solucoes Ltda | Tecnologia | R$ 8.500.000 | 120 |
| Grupo Meridian S.A. | Financeiro | R$ 45.000.000 | 380 |
| LogiPrime Transportes | Logistica | R$ 12.000.000 | 250 |
| HealthPlus Clinicas | Saude | R$ 6.200.000 | 85 |
| EduSmart Plataformas | Educacao | R$ 3.800.000 | 45 |
| AgroVerde Exportadora | Agronegocio | R$ 28.000.000 | 190 |
| RetailMax Comercio | Varejo | R$ 15.500.000 | 310 |
| CloudBase Infraestrutura | Cloud/SaaS | R$ 9.200.000 | 70 |
| Construtora Apex | Construcao | R$ 22.000.000 | 420 |
| MidiaForce Comunicacao | Marketing/Publicidade | R$ 4.100.000 | 55 |
| IndustrialTek Automacao | Industria | R$ 18.000.000 | 275 |
| BioFarma Labs | Farmaceutico | R$ 35.000.000 | 160 |

Cada conta inclui endereco completo (cidades brasileiras reais: Sao Paulo, Rio de Janeiro, Curitiba, Belo Horizonte, Porto Alegre, etc.), site, telefone e tags.

### 1.2 Contatos (30+ contatos vinculados as contas)

2-3 contatos por conta com cargos reais: Diretor de TI, Gerente de Compras, Head de Marketing, CFO, CEO, Coordenador de Operacoes, etc. Cada contato com email, telefone, celular e role (decision_maker, technical, financial, influencer, end_user).

### 1.3 Leads (15 leads em diferentes estagios)

| Status | Qtd | Exemplo |
|--------|-----|---------|
| new | 5 | Mariana Costa - Diretora de Inovacao na StartupXYZ |
| contacted | 4 | Roberto Nunes - CTO da FinEdge |
| qualified | 3 | Carla Mendonca - VP Comercial na OmegaTrade |
| converted | 2 | (vinculados a contas e oportunidades criadas) |
| unqualified | 1 | Lead descartado com motivo |

Cada lead com score (0-100), source (website, referral, event, linkedin, outbound), empresa, industria e descricao detalhada.

---

## Fase 2 - Pipeline de Vendas (Oportunidades, Contratos, Produtos)

### 2.1 Produtos (8 produtos/servicos)

| Produto | SKU | Preco | Categoria |
|---------|-----|-------|-----------|
| Fireware CRM Enterprise | FW-CRM-ENT | R$ 4.500/mes | Software |
| Fireware Service Cloud | FW-SVC-PRO | R$ 2.800/mes | Software |
| Fireware Marketing Suite | FW-MKT-STD | R$ 1.900/mes | Software |
| Consultoria de Implantacao | FW-CONS-IMP | R$ 35.000 | Servico |
| Treinamento Presencial | FW-TRN-PRS | R$ 8.500 | Servico |
| Suporte Premium 24/7 | FW-SUP-PRM | R$ 3.200/mes | Suporte |
| Integracao Customizada | FW-INT-CST | R$ 18.000 | Servico |
| Modulo IA Advanced | FW-AI-ADV | R$ 2.200/mes | Software |

### 2.2 Oportunidades (10 oportunidades)

Distribuidas nos estagios do pipeline:
- **Prospecting** (2): Oportunidades iniciais com valores de R$ 85.000 e R$ 120.000
- **Qualification** (2): Em processo de qualificacao, R$ 250.000 e R$ 180.000
- **Proposal** (2): Propostas enviadas, R$ 450.000 e R$ 320.000
- **Negotiation** (2): Em negociacao, R$ 380.000 e R$ 540.000
- **Closed Won** (1): Ganho, R$ 280.000
- **Closed Lost** (1): Perdido com motivo "Preco acima do orcamento"

Cada oportunidade com close_date, probability, forecast_category, source, competitor e next_step.

### 2.3 Contratos (4 contratos)

- 1 ativo (12 meses, R$ 280.000 anual)
- 1 em negociacao (draft)
- 1 assinado recentemente
- 1 proximo do vencimento (para demonstrar renewal alerts)

---

## Fase 3 - Atendimento e Omnichannel (Foco Principal)

### 3.1 Filas de Atendimento (4 filas)

| Fila | Metodo | Descricao |
|------|--------|-----------|
| Suporte Nivel 1 | round_robin | Primeiro atendimento geral |
| Suporte Nivel 2 | skill_based | Escalonamento tecnico |
| Comercial | priority_first | Atendimento comercial |
| VIP | manual | Clientes estrategicos |

### 3.2 Agent Status e Capacity

Configurar o usuario teste como agente ativo (status: available) com capacidade em whatsapp (max 5), chat (max 3) e email (max 10).

### 3.3 Tickets (15 tickets)

Distribuidos por status, canal e prioridade:

| Ticket | Canal | Prioridade | Status | Assunto |
|--------|-------|------------|--------|---------|
| TKT-001 | whatsapp | critical | open | Sistema fora do ar para cliente TechNova |
| TKT-002 | email | high | in_progress | Erro de integracao com API de pagamentos |
| TKT-003 | portal | medium | waiting_customer | Duvida sobre configuracao de relatorios |
| TKT-004 | chat | low | new | Solicitacao de alteracao de cadastro |
| TKT-005 | phone | high | escalated | Falha recorrente no modulo financeiro |
| TKT-006 | email | medium | resolved | Treinamento para novos usuarios |
| TKT-007 | whatsapp | critical | in_progress | Dados inconsistentes apos importacao |
| TKT-008 | portal | low | closed | Ajuste de permissoes de usuario |
| TKT-009 | chat | medium | new | Integracao com ERP SAP |
| TKT-010 | email | high | waiting_customer | Migracao de dados legados |
| TKT-011 | whatsapp | medium | open | Problemas com nota fiscal eletronica |
| TKT-012 | phone | critical | in_progress | Indisponibilidade parcial do servico |
| TKT-013 | portal | low | resolved | Customizacao de dashboard |
| TKT-014 | chat | high | new | Vazamento de dados detectado |
| TKT-015 | email | medium | closed | Atualizacao de contrato de suporte |

Cada ticket com ticket_number gerado via RPC, descricao detalhada, conta e contato vinculados, SLA configurado.

### 3.4 Conversas Omnichannel (12 conversas com mensagens)

**Conversas WhatsApp (4):**
- Conversa ativa com cliente TechNova pedindo suporte urgente (5-7 mensagens trocadas)
- Conversa em espera com Grupo Meridian sobre proposta comercial (3-4 mensagens)
- Conversa com bot handling de triagem inicial (2 mensagens automatizadas)
- Conversa fechada com resolucao de duvida (8 mensagens completas)

**Conversas Chat (3):**
- Chat ao vivo em andamento com visitante do site (4-6 mensagens)
- Chat aguardando resposta do cliente (3 mensagens)
- Chat encerrado com avaliacao de satisfacao

**Conversas Email (3):**
- Thread de email com 4 mensagens sobre incidente
- Email de acompanhamento de proposta (2 mensagens)
- Email resolvido com nota interna do agente

**Conversas Portal (2):**
- Conversa via portal do cliente sobre pedido
- Conversa via portal com escalonamento

Cada conversa tera:
- `conversation_number` gerado automaticamente
- `contact_id` e `account_id` vinculados
- `owner_id` do agente (usuario teste)
- Contadores `message_count` e `unread_count` corretos
- Timestamps de `first_message_at`, `last_message_at`, etc.
- Prioridades e tags variadas

### 3.5 Mensagens das Conversas (~60 mensagens)

Mensagens realisticas em portugues brasileiro com:
- `sender_type`: customer, agent, system
- `content_type`: text, image, template
- `delivery_status`: delivered, read, sent
- Mensagens internas (is_internal: true) entre agentes
- Mensagens automatizadas do bot (is_automated: true)
- Timestamps sequenciais realistas (ao longo dos ultimos 7 dias)
- Algumas mensagens com `ai_generated: true` e `ai_confidence`

---

## Fase 4 - AI Agents

### 4.1 Ferramentas de IA (8 tools)

| Ferramenta | Tipo | Risco | Aprovacao |
|------------|------|-------|-----------|
| Buscar Ticket | rpc_call | low | Nao |
| Criar Ticket | rpc_call | medium | Nao |
| Atualizar Ticket | rpc_call | medium | Nao |
| Buscar Oportunidade | database_query | low | Nao |
| Aprovar Desconto | rpc_call | high | Sim |
| Analisar Sentimento | http_request | low | Nao |
| Enviar Email | connector_action | medium | Nao |
| Excluir Registro | rpc_call | critical | Sim |

### 4.2 Agentes de IA (5 agentes)

| Agente | Tipo | Status | Descricao |
|--------|------|--------|-----------|
| Aria - Assistente de Vendas | sales | active | Analisa pipeline, sugere proximas acoes, qualifica leads |
| Atlas - Suporte Tecnico | service | active | Diagnostica problemas, sugere artigos da KB, escala tickets |
| Iris - Marketing Intelligence | marketing | testing | Segmentacao, analise de campanhas, personalizacao |
| Sentinel - Compliance Guardian | compliance | active | Verifica conformidade LGPD, audita acessos |
| Nova - Data Steward | data_steward | draft | Deteccao de duplicatas, limpeza de dados |

Cada agente com:
- `system_prompt` completo e detalhado (200-400 palavras)
- `model_config` configurado (temperatura, max_tokens, modelo)
- Ferramentas vinculadas via `ai_agent_tools`
- Versao e status adequados

### 4.3 Execucoes de IA (8 runs com steps)

- 3 runs completed (com output_result, tokens, duracao)
- 2 runs running (em execucao)
- 1 run failed (com error_message)
- 1 run waiting_approval (com approval_request)
- 1 run cancelled

Cada run com 2-5 `ai_run_steps` detalhando raciocinio, chamadas de ferramentas e resultados.

### 4.4 Recibos de Auditoria (10+ receipts)

Registros imutaveis de cada acao executada pelos agentes, incluindo:
- Tipo de acao (query, create, update)
- Entidade afetada
- Dados acessados/modificados
- Nivel de risco e status de aprovacao

---

## Fase 5 - Marketing e Knowledge Base

### 5.1 Campanhas (5 campanhas)

| Campanha | Tipo | Status | Metricas |
|----------|------|--------|----------|
| Lancamento Fireware 4.0 | email | completed | 5000 enviados, 42% abertura |
| Webinar IA para Negocios | webinar | active | 800 inscritos |
| Black Friday 2026 | email | scheduled | 12000 destinatarios |
| Retargeting Leads Frios | ads | active | R$ 15.000 budget |
| Programa de Indicacao | referral | active | 45 indicacoes |

### 5.2 Categorias e Artigos da Knowledge Base (3 categorias, 8 artigos)

**Categorias:**
- Primeiros Passos (slug: primeiros-passos)
- Configuracoes Avancadas (slug: configuracoes-avancadas)
- FAQ e Troubleshooting (slug: faq-troubleshooting)

**Artigos:**
- Como configurar seu primeiro pipeline de vendas (published)
- Guia completo de integracao WhatsApp (published)
- Configurando automacoes e workflows (published)
- Gerenciando permissoes e roles de usuario (published)
- FAQ: Problemas comuns de login (published, featured)
- Melhores praticas de atendimento omnichannel (published)
- Personalizando dashboards e relatorios (draft)
- Guia de conformidade LGPD (in_review)

### 5.3 Respostas Rapidas (6 canned responses)

Templates de resposta com variaveis dinamicas para diferentes cenarios (saudacao, escalonamento, resolucao, etc.)

---

## Fase 6 - Atividades e Notas

### 6.1 Atividades (15 atividades)

- 4 calls (ligacoes realizadas e agendadas)
- 3 meetings (reunioes presenciais e online)
- 4 tasks (tarefas de follow-up)
- 2 emails (acompanhamentos enviados)
- 2 notes (anotacoes internas)

Vinculadas a contas, contatos, leads e oportunidades diferentes.

### 6.2 Notas (10 notas)

Anotacoes detalhadas sobre negociacoes, reunioes e insights de clientes.

---

## Resumo Tecnico da Implementacao

A implementacao sera feita atraves de comandos SQL INSERT executados diretamente no banco de dados usando a ferramenta de insercao de dados. A ordem de execucao respeitara as dependencias de chaves estrangeiras:

```text
1. accounts (12 registros)
2. contacts (30+ registros) -- depende de accounts
3. leads (15 registros)
4. products (8 registros)
5. opportunities (10 registros) -- depende de accounts
6. contracts (4 registros) -- depende de accounts
7. routing_queues (4 registros)
8. agent_status (1 registro)
9. agent_capacity (3 registros)
10. queue_members (4 registros)
11. tickets (15 registros) -- depende de accounts, contacts
12. conversations (12 registros) -- depende de contacts, accounts
13. conversation_messages (60+ registros) -- depende de conversations
14. ai_tools (8 registros)
15. ai_agents (5 registros)
16. ai_agent_tools (15+ vinculos)
17. ai_runs (8 registros) -- depende de ai_agents
18. ai_run_steps (25+ registros) -- depende de ai_runs
19. ai_run_audit_receipts (10+ registros) -- depende de ai_runs
20. knowledge_categories (3 registros)
21. knowledge_articles (8 registros) -- depende de categories
22. canned_responses (6 registros)
23. campaigns (5 registros)
24. activities (15 registros) -- depende de accounts, contacts, etc.
25. notes (10 registros) -- depende de accounts, contacts, etc.
```

Total estimado: **250+ registros** distribuidos em 25 tabelas.

Todos os registros usarao:
- `organization_id`: `7c5e540c-2b57-404c-bc9f-100d0279976c`
- `owner_id` / `created_by` / `assigned_to`: `d9e608f3-3a87-430d-8331-cc96959d1714`
- UUIDs gerados via `gen_random_uuid()`
- Timestamps realistas nos ultimos 30-90 dias
- Dados 100% em portugues brasileiro
