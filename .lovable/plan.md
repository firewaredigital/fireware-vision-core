
# Documentacao Completa do Sistema CR Platform

## Objetivo
Criar uma secao de documentacao interna do sistema acessivel a partir de todos os apps, com conteudo extremamente detalhado sobre cada modulo, aplicacao e funcionalidade da plataforma. A documentacao sera implementada como paginas React navegaveis dentro do proprio sistema.

## Estrutura da Implementacao

### 1. Novo arquivo de conteudo da documentacao
**Arquivo:** `src/config/documentation.ts`

Um arquivo centralizado contendo toda a estrutura da documentacao organizada por categorias:

- **Inicio Rapido** -- Primeiros passos, login, navegacao, App Launcher
- **CRM (Vendas)** -- Leads, Contas, Contatos, Oportunidades, Propostas, Contratos, CPQ, Assinaturas, Faturamento, Conversation Intelligence, Revenue Ops, Produtos, Territorios, Cadencias, Forecast
- **Atendimento Omnichannel** -- Dashboard, Inbox Omnichannel, Tickets, Filas, QA/NPS, Social Inbox, WhatsApp, Chat Widgets, Telefonia, Analytics, Base de Conhecimento, Customer Success
- **Marketing** -- Dashboard, Campanhas, Segmentos, Jornadas, Provedores, Preferencias, Personalizacao, Intelligence, Templates de Email
- **Commerce** -- Dashboard, Pedidos, Devolucoes, Promocoes
- **ITSM** -- Dashboard, Incidentes, Mudancas, CMDB, Ativos
- **Inteligencia Artificial** -- Agentes, Ferramentas, Politicas, Avaliacoes, Execucoes, Analytics
- **Dados e Integracao** -- Governanca/LGPD, Duplicatas, Merge Wizard, Full Funnel, Atribuicao, Customer 360, Golden Records, Fontes de Dados, Event Schemas, Activation, Catalogo de Integracoes, Instancias, Monitoramento, DLQ, Webhooks
- **Gestao e Automacao** -- Workflows, Dashboards, Relatorios, Auditoria
- **Administracao** -- Modulos, Permissoes, Seguranca, Campos Custom, Integracoes, IA, Observabilidade, Configuracoes, Respostas Rapidas
- **Portal do Cliente** -- Login, Tickets, Pedidos, Devolucoes, Knowledge, Faturas, Preferencias
- **Portal do Parceiro** -- Login, Dashboard, Deals, Comissoes, Recursos

Cada topico tera:
- Titulo e descricao
- Secoes com subtitulos e conteudo em markdown
- Dicas e avisos contextuais
- Passos numerados para fluxos operacionais
- Tabelas de referencia de campos e status

### 2. Pagina principal da documentacao
**Arquivo:** `src/pages/Documentation.tsx`

- Layout com sidebar de navegacao a esquerda (indice de categorias e topicos)
- Area de conteudo principal a direita com renderizacao do conteudo
- Barra de busca com filtro em tempo real por titulo e conteudo
- Breadcrumbs de navegacao
- Navegacao anterior/proximo entre artigos
- Design responsivo com sidebar colapsavel em mobile
- Estilizacao consistente com o restante do sistema (cards, tipografia, cores)

### 3. Pagina de detalhe do artigo
**Arquivo:** `src/pages/DocumentationArticle.tsx`

- Renderizacao completa do conteudo do artigo selecionado
- Indice lateral (table of contents) gerado automaticamente a partir dos headings
- Navegacao entre artigos da mesma categoria
- Botao de voltar para o indice

### 4. Registro de rotas
**Arquivo:** `src/routes/SharedRoutes.tsx` (editar)

Adicionar rotas:
- `{prefix}/docs` -- Pagina principal da documentacao
- `{prefix}/docs/:categorySlug` -- Categoria filtrada
- `{prefix}/docs/:categorySlug/:articleSlug` -- Artigo especifico

### 5. Item de navegacao na sidebar
**Arquivo:** `src/components/layout/AppSidebarConfig.ts` (editar)

Adicionar item "Documentacao" na secao de Administracao ou como modulo independente no rail com icone `BookOpen`.

## Conteudo da Documentacao (Resumo dos Capitulos)

### Inicio Rapido
- Como acessar o sistema (URL, login, cadastro)
- Navegacao pelo App Launcher (selecao de apps)
- Visao geral da interface (sidebar, topbar, busca global Cmd+K, notificacoes)
- Alternancia entre apps via seletor "waffle" (Ctrl+Shift+A)
- Tema claro/escuro

### CRM -- Pipeline e Vendas
- **Leads**: Captura, scoring, qualificacao, conversao para oportunidade, importacao CSV, roteamento automatico, deduplicacao
- **Contas**: Cadastro completo, hierarquia, anexos, notas, timeline, campos custom
- **Contatos**: Vinculacao com contas, historico de interacoes, comunicacao multicanal
- **Oportunidades**: Pipeline Kanban, estagios, probabilidade, valor, produtos vinculados, propostas, aprovacao de descontos
- **Propostas (Quotes)**: Criacao, itens, descontos, aprovacao, PDF
- **Contratos**: Ciclo de vida (rascunho ate ativo), numeracao automatica, vinculo com oportunidades
- **CPQ**: Configuracoes de produtos, regras de precificacao
- **Assinaturas**: Gestao recorrente, renovacoes
- **Faturamento**: Faturas, pagamentos, detalhamento
- **Conversation Intelligence**: Analise de conversas de vendas
- **Revenue Ops**: Metricas e otimizacao de receita
- **Produtos**: Catalogo, categorias, precos
- **Territorios**: Hierarquia territorial, atribuicao de vendedores
- **Cadencias**: Sequencias multicanal de prospecção, drag-and-drop
- **Forecast**: Previsao mensal/trimestral, metas por vendedor

### Atendimento Omnichannel
- **Dashboard**: KPIs de atendimento, SLAs, volume de tickets
- **Inbox Omnichannel**: Painel unificado de conversas de todos os canais
- **Tickets**: Criacao, prioridade (matriz impacto x urgencia), status, SLA countdown, mensagens, timeline
- **Filas**: Distribuicao e gestao de filas de atendimento
- **QA e NPS**: Qualidade de atendimento, pesquisas de satisfacao
- **Social Inbox**: Monitoramento de redes sociais
- **WhatsApp**: Templates, mensagens de midia, status de entrega
- **Chat Widgets**: Configuracao de widgets para sites
- **Telefonia**: Softphone, gravacoes, transcricoes
- **Analytics**: Metricas detalhadas de atendimento
- **Base de Conhecimento**: Artigos, categorias, publicacao, metricas de utilidade
- **Customer Success**: Health scores, playbooks, enrollments

### Marketing
- **Dashboard**: KPIs de campanhas, engajamento
- **Campanhas**: Criacao multicanal (email, SMS, WhatsApp), metricas de abertura/clique, teste A/B
- **Segmentos**: Construtor de regras dinamicas
- **Jornadas**: Journey Builder visual com passos de decisao, espera e acoes
- **Provedores**: Configuracao de provedores de envio
- **Preferencias**: Centro de preferencias de comunicacao
- **Personalizacao**: Conteudo dinamico
- **Intelligence**: Insights de marketing
- **Templates de Email**: Editor visual de templates

### Commerce
- **Dashboard**: KPIs de e-commerce
- **Pedidos**: Criacao manual, busca de produtos, numeracao automatica, pagamentos, entregas, timeline
- **Devolucoes**: RMA, processamento de retornos
- **Promocoes**: Motor de cupons e descontos

### ITSM
- **Dashboard**: Metricas de TI, SLAs, incidentes criticos
- **Incidentes**: Registro, matriz de prioridade (impacto x urgencia), numeracao automatica
- **Mudancas**: Planos de implementacao, rollback, aprovacoes
- **CMDB**: Itens de configuracao, relacionamentos e dependencias
- **Ativos**: Hardware, software, licencas, garantias

### Inteligencia Artificial
- **Agentes**: Criacao, configuracao de modelo, system prompt, tools vinculadas, playground de testes
- **Ferramentas**: Registro de funcoes para function calling
- **Politicas**: Guardrails e regras de uso
- **Avaliacoes**: Testes de qualidade dos agentes
- **Execucoes**: Historico de runs com inputs/outputs
- **Analytics**: Metricas de uso, latencia, custos

### Dados e Integracao
- **Governanca/LGPD**: Solicitacoes de titulares, anonimizacao, consentimento
- **Duplicatas**: Deteccao e resolucao
- **Merge Wizard**: Fusao de registros duplicados
- **Customer 360**: Visao unificada do cliente
- **Golden Records**: Registros mestres unificados
- **Fontes de Dados / Event Schemas / Activation**: Ingestao e ativacao de dados
- **Integracoes**: Catalogo, instancias, monitoramento, DLQ, webhooks

### Administracao
- **Modulos**: Ativacao/desativacao de modulos por organizacao
- **Permissoes**: Permission Sets granulares com capabilities (ABAC)
- **Seguranca**: Politicas de seguranca
- **Campos Custom**: Criacao de campos personalizados por entidade
- **Observabilidade**: Metricas de sistema e eventos

## Detalhes Tecnicos

### Arquivos a Criar
| Arquivo | Descricao |
|---|---|
| `src/config/documentation.ts` | Estrutura completa da documentacao (~2000+ linhas) |
| `src/pages/Documentation.tsx` | Pagina principal com sidebar + busca + renderizacao |
| `src/pages/DocumentationArticle.tsx` | Visualizacao de artigo individual |

### Arquivos a Editar
| Arquivo | Alteracao |
|---|---|
| `src/routes/SharedRoutes.tsx` | Adicionar rotas /docs, /docs/:category, /docs/:category/:article |
| `src/components/layout/AppSidebarConfig.ts` | Adicionar item "Documentacao" no rail de navegacao |

### Abordagem de Renderizacao
- O conteudo sera armazenado como strings com formatacao simples (blocos de texto, listas, tabelas)
- Um componente de renderizacao customizado transformara o conteudo em JSX com estilizacao Tailwind
- Sem dependencia de bibliotecas externas de markdown para manter o bundle enxuto

### Navegacao
- Sidebar lateral com categorias colapsaveis (Accordion)
- Busca textual com debounce filtrando por titulo e conteudo
- Breadcrumbs: Documentacao > Categoria > Artigo
- Navegacao sequencial (anterior/proximo) no rodape de cada artigo
