// ─── Documentation Content for CR Platform ────────────────────────
// This file contains the full structured documentation for every module.

export interface DocSection {
  heading: string;
  content: string;
}

export interface DocArticle {
  slug: string;
  title: string;
  description: string;
  sections: DocSection[];
}

export interface DocCategory {
  slug: string;
  title: string;
  icon: string; // icon key name
  articles: DocArticle[];
}

export const documentationData: DocCategory[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 1. INÍCIO RÁPIDO
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'inicio-rapido',
    title: 'Início Rápido',
    icon: 'Home',
    articles: [
      {
        slug: 'acesso-login',
        title: 'Acesso e Login',
        description: 'Como acessar o sistema, criar sua conta e realizar o login.',
        sections: [
          {
            heading: 'Acessando a Plataforma',
            content: `A CR Platform é acessada diretamente pelo navegador web. Navegue até a URL fornecida pela sua organização. A tela de autenticação será exibida automaticamente.

**Requisitos do navegador:**
- Google Chrome 90+ (recomendado)
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 14+

**Dica:** Para melhor experiência, utilize o navegador em modo desktop com resolução mínima de 1366×768 pixels.`,
          },
          {
            heading: 'Criando sua Conta',
            content: `1. Na tela de autenticação, clique na aba **"Cadastrar"**
2. Preencha seu **e-mail corporativo** e defina uma **senha segura** (mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e números)
3. Clique em **"Criar Conta"**
4. Verifique sua caixa de entrada e clique no link de **confirmação de e-mail**
5. Após a confirmação, faça login normalmente

**Importante:** O administrador da organização pode precisar vincular seu perfil a uma organização e atribuir as permissões corretas antes que você tenha acesso completo aos módulos.`,
          },
          {
            heading: 'Realizando o Login',
            content: `1. Insira seu **e-mail** cadastrado
2. Insira sua **senha**
3. Clique em **"Entrar"**
4. Você será redirecionado ao **App Launcher** para selecionar o aplicativo desejado

**Recuperação de senha:** Caso tenha esquecido sua senha, clique em "Esqueci minha senha" na tela de login. Um e-mail com instruções de redefinição será enviado.`,
          },
        ],
      },
      {
        slug: 'app-launcher',
        title: 'App Launcher',
        description: 'Navegação entre os diferentes aplicativos da plataforma.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O **App Launcher** é a tela central que permite selecionar qual aplicativo você deseja utilizar. Cada aplicativo possui um contexto independente com menus, dashboards e funcionalidades específicas.

**Aplicativos disponíveis:**

| App | Descrição |
|-----|-----------|
| **CRM (Vendas)** | Gestão de leads, contas, contatos, oportunidades, propostas, contratos e forecast |
| **Atendimento Omnichannel** | Inbox unificado, tickets, filas, chat, telefonia, WhatsApp e base de conhecimento |
| **Marketing** | Campanhas multicanal, segmentos, jornadas, templates e analytics |
| **Commerce** | Pedidos, devoluções, promoções e gestão de catálogo |
| **ITSM** | Incidentes, mudanças, CMDB e gestão de ativos de TI |`,
          },
          {
            heading: 'Alternando entre Apps',
            content: `Existem duas formas de alternar entre aplicativos:

1. **App Launcher (rota /apps):** Clique no logo da plataforma ou navegue diretamente para /apps
2. **Seletor rápido (Waffle):** Use o atalho **Ctrl+Shift+A** (ou Cmd+Shift+A no macOS) para abrir o seletor rápido de apps a partir de qualquer tela

**Dica:** O seletor waffle está disponível na barra superior (Topbar) como um ícone de grade, permitindo transição instantânea sem perder o contexto atual.`,
          },
        ],
      },
      {
        slug: 'interface-navegacao',
        title: 'Interface e Navegação',
        description: 'Compreenda a estrutura visual e os elementos de navegação do sistema.',
        sections: [
          {
            heading: 'Estrutura da Interface',
            content: `A interface é composta por quatro áreas principais:

1. **Topbar (Barra Superior):** Contém o logo, seletor de apps (waffle), busca global (Cmd+K), centro de notificações, seletor de tema e menu do usuário
2. **Sidebar (Painel Lateral):** Navegação principal organizada em dois painéis:
   - **Rail (72px):** Módulos pai representados por ícones (Home, Pipeline, Canais, IA, Dados, Gestão, Admin)
   - **Content Panel (240px):** Sub-itens contextuais agrupados por seção com filtro de busca local
3. **Área de Conteúdo:** Região principal onde as páginas e formulários são renderizados
4. **Breadcrumbs:** Navegação hierárquica no topo da área de conteúdo`,
          },
          {
            heading: 'Busca Global (Cmd+K)',
            content: `A busca global permite localizar rapidamente qualquer registro, página ou funcionalidade do sistema:

1. Pressione **Cmd+K** (macOS) ou **Ctrl+K** (Windows/Linux)
2. Digite o termo de busca
3. Os resultados são categorizados por tipo (Leads, Contas, Contatos, Oportunidades, Tickets, etc.)
4. Clique no resultado desejado para navegar diretamente

**Dica:** A busca também aceita comandos rápidos como "novo lead", "novo ticket" para atalhos de criação.`,
          },
          {
            heading: 'Notificações',
            content: `O **Centro de Notificações** (ícone de sino na Topbar) exibe alertas em tempo real sobre:

- Novos leads atribuídos
- Tickets escalados ou com SLA próximo do vencimento
- Aprovações pendentes
- Menções em notas e comentários
- Atualizações de oportunidades

As notificações podem ser marcadas como lidas individualmente ou em lote. A página completa de notificações está disponível em Configurações > Notificações.`,
          },
          {
            heading: 'Tema Claro e Escuro',
            content: `O sistema suporta três modos de exibição:

- **Claro:** Fundo branco com texto escuro (padrão)
- **Escuro:** Fundo escuro com texto claro, ideal para ambientes com pouca luz
- **Sistema:** Segue automaticamente a preferência do sistema operacional

Para alternar, clique no ícone de sol/lua na Topbar ou acesse Configurações > Aparência.`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. CRM — PIPELINE E VENDAS
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'crm',
    title: 'CRM — Pipeline e Vendas',
    icon: 'TrendingUp',
    articles: [
      {
        slug: 'leads',
        title: 'Leads',
        description: 'Captura, qualificação, scoring e conversão de leads.',
        sections: [
          {
            heading: 'Visão Geral de Leads',
            content: `O módulo de Leads é o ponto de entrada do funil de vendas. Um lead representa uma pessoa ou empresa que demonstrou interesse nos seus produtos/serviços mas ainda não foi qualificada como oportunidade de negócio.

**Campos principais:**

| Campo | Descrição | Obrigatório |
|-------|-----------|-------------|
| Nome | Nome completo do lead | Sim |
| E-mail | E-mail principal de contato | Não |
| Telefone | Telefone de contato | Não |
| Empresa | Nome da empresa (se B2B) | Não |
| Origem | Canal de captação (site, indicação, evento, etc.) | Sim |
| Status | Novo, Contactado, Qualificado, Desqualificado | Sim |
| Responsável | Vendedor atribuído ao lead | Sim |
| Score | Pontuação automática de qualificação | Automático |`,
          },
          {
            heading: 'Criando um Lead',
            content: `1. Navegue até **CRM > Leads**
2. Clique no botão **"+ Novo Lead"** no canto superior direito
3. Preencha os campos obrigatórios (Nome, Origem, Status)
4. Adicione informações complementares (e-mail, telefone, empresa, cargo)
5. Atribua um **responsável** (vendedor)
6. Clique em **"Salvar"**

**Importação em massa:** Utilize o botão "Importar CSV" para importar múltiplos leads de uma planilha. O sistema mapeia automaticamente as colunas e valida os dados antes da importação.`,
          },
          {
            heading: 'Lead Scoring',
            content: `O sistema atribui automaticamente uma pontuação (score) a cada lead baseada em critérios configuráveis:

- **Dados demográficos:** Cargo, tamanho da empresa, setor (0–30 pontos)
- **Engajamento:** Abertura de e-mails, cliques em links, visitas ao site (0–40 pontos)
- **Comportamento:** Downloads de materiais, participação em webinars (0–30 pontos)

**Faixas de classificação:**
- 🔴 **Frio** (0–30): Pouco engajamento
- 🟡 **Morno** (31–60): Interesse moderado
- 🟢 **Quente** (61–100): Alto potencial de conversão

Os critérios de scoring podem ser personalizados pelo administrador em Admin > IA > Scoring.`,
          },
          {
            heading: 'Qualificação e Conversão',
            content: `Quando um lead atinge pontuação ou critérios suficientes, ele pode ser convertido em uma oportunidade:

1. Abra o lead desejado
2. Clique no botão **"Converter Lead"**
3. O assistente de conversão será aberto com três opções:
   - **Criar nova Conta** ou vincular a uma conta existente
   - **Criar novo Contato** ou vincular a um contato existente
   - **Criar nova Oportunidade** com dados pré-preenchidos
4. Revise as informações e clique em **"Converter"**

**Importante:** Após a conversão, o lead original é marcado como "Convertido" e mantém o vínculo com os registros criados para rastreabilidade.`,
          },
          {
            heading: 'Roteamento Automático',
            content: `O sistema distribui leads automaticamente para vendedores com base em regras configuráveis:

- **Round Robin:** Distribuição sequencial igualitária entre os vendedores da equipe
- **Por Território:** Atribuição baseada na região geográfica do lead
- **Por Capacidade:** Prioriza vendedores com menor carga de trabalho
- **Por Especialização:** Direciona para vendedores especializados no segmento do lead

As regras de roteamento são configuradas em **CRM > Leads > Regras de Roteamento**.`,
          },
          {
            heading: 'Deduplicação',
            content: `O sistema detecta automaticamente possíveis leads duplicados com base em:

- E-mail idêntico
- Combinação de nome + empresa
- Telefone idêntico

Quando duplicatas são encontradas, um alerta é exibido na criação e o usuário pode optar por mesclar os registros usando o **Merge Wizard** (Dados > Merge Wizard).`,
          },
        ],
      },
      {
        slug: 'contas',
        title: 'Contas',
        description: 'Gestão completa de contas corporativas e hierarquias.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Contas representam empresas ou organizações com as quais você mantém relacionamento comercial. Cada conta pode ter múltiplos contatos, oportunidades, contratos e atividades vinculados.

**Campos principais:**

| Campo | Descrição |
|-------|-----------|
| Nome | Razão social ou nome fantasia |
| Setor | Segmento de atuação |
| Receita Anual | Faturamento anual estimado |
| Nº de Funcionários | Porte da empresa |
| Endereço | Endereço completo (rua, cidade, estado, CEP, país) |
| Website | URL do site da empresa |
| Telefone | Telefone principal |
| E-mail | E-mail corporativo |
| Responsável | Vendedor responsável pela conta |
| Conta Pai | Hierarquia de contas (matriz/filial) |
| Tags | Etiquetas para categorização livre |`,
          },
          {
            heading: 'Hierarquia de Contas',
            content: `O campo **"Conta Pai"** permite criar hierarquias de contas para representar estruturas corporativas complexas:

- **Matriz** → Filial A, Filial B, Filial C
- Cada filial herda dados da matriz mas pode ter seus próprios contatos e oportunidades
- A visão hierárquica pode ser acessada no detalhe da conta

**Exemplo prático:** Uma holding com 5 subsidiárias pode ter a holding como conta pai e cada subsidiária como conta filha, permitindo consolidar métricas no nível da holding.`,
          },
          {
            heading: 'Detalhes e Widgets',
            content: `A página de detalhe de uma conta inclui os seguintes widgets:

- **Timeline:** Histórico cronológico de todas as interações
- **Notas:** Anotações livres dos usuários
- **Anexos:** Documentos, propostas e contratos vinculados
- **Atividades:** Tarefas, chamadas e reuniões programadas
- **Campos Custom:** Campos personalizados definidos pelo administrador
- **Contatos vinculados:** Lista de contatos da conta
- **Oportunidades:** Pipeline de negócios da conta
- **Histórico de Alterações:** Log de todas as modificações no registro`,
          },
        ],
      },
      {
        slug: 'contatos',
        title: 'Contatos',
        description: 'Gestão de contatos vinculados a contas corporativas.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Contatos representam pessoas individuais vinculadas a contas. Um contato pode ser um decisor, influenciador ou usuário final dos seus produtos/serviços.

**Campos principais:**

| Campo | Descrição |
|-------|-----------|
| Nome | Nome completo |
| E-mail | E-mail corporativo |
| Telefone | Telefone direto |
| Cargo | Posição na empresa |
| Departamento | Área de atuação |
| Conta | Empresa vinculada |
| Responsável | Vendedor responsável |
| Tags | Etiquetas de categorização |`,
          },
          {
            heading: 'Vinculação com Contas',
            content: `Cada contato deve ser vinculado a pelo menos uma conta. A vinculação permite:

- Visualizar todos os contatos de uma conta na página de detalhe
- Associar contatos a oportunidades como stakeholders
- Rastrear histórico de comunicação por contato
- Enviar campanhas segmentadas por cargo/departamento

Para vincular um contato a uma conta, selecione a conta no campo "Conta" durante a criação ou edição do contato.`,
          },
          {
            heading: 'Histórico de Interações',
            content: `O sistema registra automaticamente todas as interações com cada contato:

- **E-mails enviados e recebidos** (quando integrado)
- **Chamadas realizadas** (com duração e resultado)
- **Reuniões agendadas e realizadas**
- **Notas e comentários** de vendedores
- **Atividades em campanhas** (aberturas, cliques)

Este histórico é exibido na timeline do contato e pode ser filtrado por tipo de interação e período.`,
          },
        ],
      },
      {
        slug: 'oportunidades',
        title: 'Oportunidades',
        description: 'Pipeline de vendas, estágios, probabilidade e gestão de negócios.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Oportunidades representam negócios em andamento no pipeline de vendas. Cada oportunidade passa por estágios definidos até o fechamento (ganho ou perdido).

**Campos principais:**

| Campo | Descrição |
|-------|-----------|
| Nome | Título do negócio |
| Conta | Empresa associada |
| Contato Principal | Decisor principal |
| Valor | Valor estimado do negócio |
| Probabilidade | % de chance de fechamento |
| Estágio | Fase atual no pipeline |
| Data de Fechamento | Previsão de fechamento |
| Responsável | Vendedor responsável |`,
          },
          {
            heading: 'Pipeline Kanban',
            content: `A visão Kanban exibe as oportunidades organizadas por estágio em colunas arrastáveis:

**Estágios padrão:**
1. **Prospecção** (10%) — Identificação inicial
2. **Qualificação** (25%) — Validação de fit e orçamento
3. **Proposta** (50%) — Envio de proposta comercial
4. **Negociação** (75%) — Discussão de termos e valores
5. **Fechamento** (90%) — Aprovação final
6. **Ganho** (100%) — Negócio fechado com sucesso
7. **Perdido** (0%) — Negócio perdido

**Interação:** Arraste cards entre colunas para atualizar o estágio. O valor ponderado (valor × probabilidade) é recalculado automaticamente.`,
          },
          {
            heading: 'Produtos Vinculados',
            content: `Cada oportunidade pode ter múltiplos produtos vinculados com:

- Quantidade
- Preço unitário (com possibilidade de desconto)
- Desconto percentual ou em valor absoluto
- Valor total calculado automaticamente

Para adicionar produtos, abra a oportunidade e clique em "Adicionar Produto". Selecione do catálogo de produtos e ajuste quantidade e preço conforme negociado.`,
          },
          {
            heading: 'Aprovação de Descontos',
            content: `Quando o desconto concedido excede o limite autorizado do vendedor, o sistema dispara automaticamente um fluxo de aprovação:

1. Vendedor aplica desconto acima do limite na proposta
2. Sistema cria uma **Solicitação de Aprovação** para o gerente
3. Gerente recebe notificação e pode **Aprovar** ou **Rejeitar**
4. Se aprovado, o desconto é aplicado automaticamente
5. Se rejeitado, o vendedor é notificado para ajustar a proposta

Os limites de desconto são configurados em Admin > Permissões > Permission Sets.`,
          },
        ],
      },
      {
        slug: 'propostas',
        title: 'Propostas (Quotes)',
        description: 'Criação, gestão e aprovação de propostas comerciais.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Propostas (Quotes) são documentos comerciais formais enviados aos clientes com detalhamento de produtos, preços, condições e validade.

**Status de uma proposta:**

| Status | Descrição |
|--------|-----------|
| Rascunho | Em elaboração, ainda não enviada |
| Pendente Aprovação | Aguardando aprovação interna (desconto alto) |
| Aprovada | Aprovada internamente, pronta para envio |
| Enviada | Enviada ao cliente |
| Aceita | Cliente aceitou a proposta |
| Rejeitada | Cliente ou gerente rejeitou |
| Expirada | Validade da proposta venceu |`,
          },
          {
            heading: 'Criando uma Proposta',
            content: `1. Navegue até **CRM > Propostas** e clique em **"+ Nova Proposta"**
2. Vincule a uma **oportunidade existente** (os dados são pré-preenchidos)
3. Adicione os **itens da proposta** (produtos do catálogo)
4. Para cada item, defina: quantidade, preço unitário, desconto
5. Configure **condições comerciais**: validade, prazo de pagamento, frete
6. Adicione **observações** e **termos contratuais**
7. Clique em **"Salvar"**

**Dica:** Propostas podem ser duplicadas para criar variações rapidamente.`,
          },
        ],
      },
      {
        slug: 'contratos',
        title: 'Contratos',
        description: 'Ciclo de vida completo de contratos comerciais.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Contratos formalizam os termos comerciais acordados com o cliente. O módulo gerencia todo o ciclo de vida do contrato desde a criação até a renovação ou encerramento.

**Ciclo de vida:**
1. **Rascunho** — Contrato em elaboração
2. **Em Revisão** — Aguardando revisão jurídica
3. **Pendente Assinatura** — Enviado para assinatura
4. **Ativo** — Contrato assinado e vigente
5. **Expirado** — Prazo de vigência encerrado
6. **Cancelado** — Contrato cancelado antes do término

**Numeração automática:** O sistema gera automaticamente um número sequencial único para cada contrato (ex: CTR-2025-00001).`,
          },
          {
            heading: 'Criando um Contrato',
            content: `1. Navegue até **CRM > Contratos** e clique em **"+ Novo Contrato"**
2. Vincule a uma **oportunidade** e/ou **conta**
3. Defina o **tipo de contrato** (Venda, Serviço, SaaS, etc.)
4. Configure **datas de início e término**
5. Defina o **valor do contrato** e condições de pagamento
6. Adicione **cláusulas e termos** específicos
7. Clique em **"Salvar"**

O contrato será criado com status "Rascunho" e poderá avançar no fluxo conforme revisões e aprovações.`,
          },
        ],
      },
      {
        slug: 'cpq',
        title: 'CPQ (Configure, Price, Quote)',
        description: 'Configurações de produtos e regras avançadas de precificação.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo CPQ permite criar configurações complexas de produtos com regras de precificação dinâmica. Ideal para empresas que vendem soluções customizáveis.

**Funcionalidades:**
- Configuração de bundles de produtos
- Regras de compatibilidade e exclusão entre itens
- Tabelas de preço por volume
- Descontos escalonados
- Aprovações automáticas baseadas em margem`,
          },
        ],
      },
      {
        slug: 'assinaturas',
        title: 'Assinaturas',
        description: 'Gestão de receita recorrente e ciclos de renovação.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Assinaturas gerencia contratos com cobrança recorrente (mensal, trimestral, anual). Permite acompanhar MRR (Monthly Recurring Revenue), churn e renovações.

**Funcionalidades:**
- Dashboard de MRR e ARR
- Alertas de renovação próxima
- Histórico de upgrades/downgrades
- Métricas de churn e retenção
- Vinculação com faturamento automático`,
          },
        ],
      },
      {
        slug: 'faturamento',
        title: 'Faturamento',
        description: 'Gestão de faturas, pagamentos e cobranças.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Faturamento permite criar, acompanhar e gerenciar faturas vinculadas a contratos e assinaturas.

**Status de fatura:**

| Status | Descrição |
|--------|-----------|
| Rascunho | Fatura em elaboração |
| Emitida | Fatura emitida e enviada |
| Paga | Pagamento confirmado |
| Vencida | Prazo de pagamento expirado |
| Cancelada | Fatura cancelada |

**Funcionalidades:**
- Geração automática a partir de assinaturas
- Parcelamento e condições de pagamento
- Histórico de pagamentos
- Alertas de inadimplência`,
          },
        ],
      },
      {
        slug: 'conversation-intelligence',
        title: 'Conversation Intelligence',
        description: 'Análise inteligente de conversas de vendas.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Conversation Intelligence utiliza IA para analisar chamadas e reuniões de vendas, extraindo insights sobre:

- **Sentimento do cliente:** Positivo, neutro ou negativo durante a conversa
- **Tópicos discutidos:** Identificação automática de assuntos abordados
- **Próximos passos:** Compromissos identificados na conversa
- **Objeções levantadas:** Catalogação de objeções comuns
- **Talk ratio:** Proporção de fala vendedor vs. cliente
- **Palavras-chave:** Menções a concorrentes, preço, prazo

Os insights são exibidos em dashboards consolidados para gestores e individualmente para cada vendedor.`,
          },
        ],
      },
      {
        slug: 'revenue-ops',
        title: 'Revenue Ops',
        description: 'Métricas e otimização de receita.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Revenue Ops centraliza métricas de receita e eficiência do time de vendas:

- **Pipeline velocity:** Velocidade de progressão dos deals
- **Win rate:** Taxa de conversão por estágio, vendedor e produto
- **Average deal size:** Ticket médio por segmento
- **Sales cycle length:** Duração média do ciclo de vendas
- **CAC (Customer Acquisition Cost):** Custo de aquisição por canal
- **LTV (Lifetime Value):** Valor vitalício do cliente
- **Quota attainment:** Atingimento de meta por vendedor`,
          },
        ],
      },
      {
        slug: 'produtos',
        title: 'Produtos',
        description: 'Catálogo de produtos, categorias e preços.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O catálogo de Produtos é a base para propostas, pedidos e contratos. Cada produto possui:

| Campo | Descrição |
|-------|-----------|
| Nome | Nome do produto |
| SKU | Código único de identificação |
| Categoria | Classificação (Software, Hardware, Serviço, etc.) |
| Preço Base | Valor unitário padrão |
| Descrição | Detalhamento do produto |
| Status | Ativo ou Inativo |
| Campos Custom | Campos personalizados por categoria |

**Operações:**
- Criar, editar e desativar produtos
- Definir preços por lista (tabela de preços)
- Vincular produtos a oportunidades e propostas
- Importar catálogo via CSV`,
          },
        ],
      },
      {
        slug: 'territorios',
        title: 'Territórios',
        description: 'Hierarquia territorial e atribuição de vendedores.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Territórios permite organizar a equipe de vendas por regiões geográficas ou segmentos de mercado:

- **Hierarquia:** Brasil > Região > Estado > Cidade
- **Atribuição:** Vincular vendedores a territórios específicos
- **Regras:** Leads e contas são automaticamente atribuídos ao vendedor do território correspondente
- **Métricas:** Performance por território (receita, pipeline, conversão)

**Configuração:**
1. Navegue até **Gestão > Territórios**
2. Crie a hierarquia territorial
3. Atribua vendedores a cada nó da hierarquia
4. Ative o roteamento automático por território em Leads > Regras de Roteamento`,
          },
        ],
      },
      {
        slug: 'cadencias',
        title: 'Cadências',
        description: 'Sequências multicanal de prospecção automatizadas.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Cadências são sequências automatizadas de atividades de prospecção que combinam múltiplos canais:

**Tipos de passos:**
- 📧 **E-mail automático:** Envio de e-mail personalizado
- 📞 **Tarefa de ligação:** Lembrete para o vendedor ligar
- 💬 **Mensagem LinkedIn:** Tarefa de abordagem social
- ⏰ **Espera:** Intervalo entre passos (1–30 dias)

**Criando uma cadência:**
1. Navegue até **Gestão > Cadências**
2. Clique em **"+ Nova Cadência"**
3. Nomeie a cadência e defina o objetivo
4. Adicione passos arrastando blocos para a timeline
5. Configure o conteúdo de cada passo
6. Defina critérios de saída (resposta do lead, conversão, etc.)
7. Ative a cadência

**Métricas:**
- Taxa de resposta por passo
- Taxa de conversão da cadência completa
- Melhor canal por segmento`,
          },
        ],
      },
      {
        slug: 'forecast',
        title: 'Forecast',
        description: 'Previsão de receita e metas de vendas.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Forecast permite prever a receita futura com base no pipeline atual e histórico de conversão:

**Visões disponíveis:**
- **Por vendedor:** Meta individual vs. pipeline ponderado
- **Por equipe:** Consolidação por gerente
- **Por produto:** Previsão por linha de produto
- **Por período:** Mensal, trimestral e anual

**Categorias de forecast:**
| Categoria | Descrição |
|-----------|-----------|
| Comprometido | Alta confiança de fechamento |
| Provável | Boa chance de fechamento |
| Pipeline | Em estágio inicial |
| Upside | Possibilidade adicional |

**Cálculo ponderado:** O sistema multiplica o valor de cada oportunidade pela sua probabilidade para gerar a previsão ponderada. Gestores podem ajustar manualmente as categorias.`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. ATENDIMENTO OMNICHANNEL
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'atendimento',
    title: 'Atendimento Omnichannel',
    icon: 'Headphones',
    articles: [
      {
        slug: 'dashboard-atendimento',
        title: 'Dashboard de Atendimento',
        description: 'KPIs, SLAs e métricas em tempo real do atendimento.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Dashboard de Atendimento exibe métricas em tempo real e consolidadas do desempenho da operação:

**KPIs principais:**

| Métrica | Descrição |
|---------|-----------|
| Tickets Abertos | Total de tickets com status aberto |
| Tempo Médio de Resposta | Média de tempo até a primeira resposta |
| Tempo Médio de Resolução | Média de tempo até o fechamento |
| SLA Cumprido (%) | Percentual de tickets dentro do SLA |
| CSAT Score | Nota média de satisfação do cliente |
| NPS | Net Promoter Score |
| Volume por Canal | Distribuição de tickets por canal |
| Fila Atual | Tickets aguardando atendimento por fila |

**Filtros:** Por período (hoje, 7 dias, 30 dias, customizado), por fila, por agente, por canal, por prioridade.`,
          },
        ],
      },
      {
        slug: 'inbox-omnichannel',
        title: 'Inbox Omnichannel',
        description: 'Painel unificado de conversas de todos os canais.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Inbox Omnichannel é o painel central onde agentes gerenciam todas as conversas em tempo real, independentemente do canal de origem.

**Layout do Inbox:**
- **Painel esquerdo:** Lista de conversas ordenadas por prioridade/SLA, com filtros por status, canal e agente
- **Painel central:** Thread de mensagens da conversa selecionada com histórico completo
- **Painel direito:** Informações contextuais do cliente (dados, tickets anteriores, contratos, notas)

**Canais suportados:**
- 📧 E-mail
- 💬 Chat ao vivo (widget no site)
- 📱 WhatsApp Business API
- 📲 SMS
- 🌐 Redes sociais (Facebook, Instagram, Twitter)
- 📞 Telefonia (integrada ao softphone)`,
          },
          {
            heading: 'Ações Disponíveis',
            content: `No Inbox, o agente pode:

- **Responder:** Enviar mensagem de texto, com formatação e anexos
- **Transferir:** Mover a conversa para outro agente ou fila
- **Escalar:** Aumentar a prioridade e notificar o supervisor
- **Resolver:** Marcar a conversa como resolvida
- **Adicionar nota interna:** Comentário visível apenas para a equipe
- **Mesclar:** Unificar conversas duplicadas do mesmo cliente
- **Usar respostas rápidas:** Inserir templates de respostas padronizadas (Canned Responses)
- **Criar ticket:** Converter a conversa em um ticket formal`,
          },
        ],
      },
      {
        slug: 'tickets',
        title: 'Tickets',
        description: 'Criação, priorização, SLA e gestão completa de tickets.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Tickets são registros formais de solicitações, incidentes ou problemas reportados por clientes. Cada ticket possui um ciclo de vida definido e é monitorado por SLA.

**Campos principais:**

| Campo | Descrição |
|-------|-----------|
| Número | Identificador único automático (TKT-XXXX) |
| Assunto | Título resumido do problema |
| Descrição | Detalhamento completo |
| Canal | Origem (e-mail, chat, WhatsApp, telefone) |
| Prioridade | Crítica, Alta, Média, Baixa |
| Status | Aberto, Em Andamento, Pendente Cliente, Resolvido, Fechado |
| Agente | Responsável pelo atendimento |
| Fila | Fila de atendimento |
| SLA | Tempos de resposta e resolução esperados |
| Contato | Cliente que abriu o ticket |
| Conta | Empresa do cliente |`,
          },
          {
            heading: 'Matriz de Prioridade',
            content: `A prioridade é calculada automaticamente pela combinação de **Impacto** e **Urgência**:

|  | Urgência Alta | Urgência Média | Urgência Baixa |
|--|--------------|----------------|----------------|
| **Impacto Alto** | 🔴 Crítica | 🟠 Alta | 🟡 Média |
| **Impacto Médio** | 🟠 Alta | 🟡 Média | 🟢 Baixa |
| **Impacto Baixo** | 🟡 Média | 🟢 Baixa | 🟢 Baixa |

**Impacto:** Quantidade de usuários/processos afetados
**Urgência:** Velocidade com que a solução é necessária`,
          },
          {
            heading: 'SLA Countdown',
            content: `Cada ticket exibe um contador regressivo de SLA com base na prioridade:

| Prioridade | 1ª Resposta | Resolução |
|------------|-------------|-----------|
| Crítica | 15 minutos | 1 hora |
| Alta | 30 minutos | 4 horas |
| Média | 2 horas | 8 horas |
| Baixa | 4 horas | 24 horas |

O contador altera a cor conforme o tempo restante:
- 🟢 Verde: >50% do tempo restante
- 🟡 Amarelo: 25–50% do tempo restante
- 🔴 Vermelho: <25% do tempo restante ou estourado

**Alertas automáticos:** Notificações são enviadas ao agente e ao supervisor quando o SLA está prestes a estourar.`,
          },
          {
            heading: 'Mensagens e Timeline',
            content: `A página de detalhe do ticket inclui:

- **Thread de mensagens:** Histórico completo de comunicação (mensagens do cliente e do agente)
- **Notas internas:** Comentários visíveis apenas para a equipe
- **Timeline:** Registro cronológico de todos os eventos (criação, atribuição, mudança de status, SLA, etc.)
- **Anexos:** Arquivos enviados pelo cliente ou pela equipe

Os agentes podem usar **respostas rápidas** (canned responses) para agilizar o atendimento com templates padronizados.`,
          },
        ],
      },
      {
        slug: 'filas',
        title: 'Filas de Atendimento',
        description: 'Distribuição e gestão de filas.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Filas organizam e distribuem tickets e conversas entre os agentes da equipe:

**Tipos de distribuição:**
- **Round Robin:** Distribuição igualitária sequencial
- **Menos ocupado:** Prioriza agente com menor carga
- **Por habilidade:** Direciona para agente com skill específico
- **Manual:** Supervisor atribui manualmente

**Configuração de fila:**
1. Navegue até **Atendimento > Filas**
2. Clique em **"+ Nova Fila"**
3. Defina nome, descrição e horário de funcionamento
4. Adicione agentes à fila
5. Configure a regra de distribuição
6. Defina SLAs específicos (opcional)
7. Ative a fila`,
          },
        ],
      },
      {
        slug: 'qa-nps',
        title: 'QA e NPS',
        description: 'Qualidade de atendimento e pesquisas de satisfação.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de QA e NPS permite medir e melhorar a qualidade do atendimento:

**QA (Quality Assurance):**
- Avaliação de tickets por supervisores
- Critérios configuráveis (empatia, precisão, tempo, etc.)
- Score de qualidade por agente
- Tendências de melhoria ao longo do tempo

**NPS (Net Promoter Score):**
- Pesquisa enviada automaticamente após resolução do ticket
- Escala de 0–10
- Classificação: Detratores (0–6), Neutros (7–8), Promotores (9–10)
- NPS = % Promotores − % Detratores

**CSAT (Customer Satisfaction):**
- Avaliação rápida de 1–5 estrelas
- Média por agente, fila e período`,
          },
        ],
      },
      {
        slug: 'social-inbox',
        title: 'Social Inbox',
        description: 'Monitoramento de redes sociais e mensagens diretas.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Social Inbox centraliza mensagens e menções de redes sociais:

**Canais suportados:**
- Facebook (Messenger + comentários)
- Instagram (DMs + comentários)
- Twitter/X (DMs + menções)

**Funcionalidades:**
- Resposta direta pela plataforma
- Conversão de menção em ticket
- Análise de sentimento por IA
- Classificação por assunto
- Métricas de tempo de resposta por canal social`,
          },
        ],
      },
      {
        slug: 'whatsapp',
        title: 'WhatsApp',
        description: 'Configuração e gestão de atendimento via WhatsApp.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `A integração com WhatsApp Business API permite atendimento automatizado e humano via WhatsApp:

**Funcionalidades:**
- Envio e recebimento de mensagens de texto, imagem, documento e áudio
- Templates de mensagem aprovados pelo Meta (HSM)
- Status de entrega (enviado, entregue, lido)
- Chatbot para triagem inicial
- Transferência para agente humano
- Métricas de SLA e volume

**Configuração:**
1. Navegue até **Atendimento > WhatsApp**
2. Configure o número de telefone e a API key
3. Crie e submeta templates de mensagem para aprovação do Meta
4. Configure regras de roteamento para filas
5. Ative o canal`,
          },
        ],
      },
      {
        slug: 'chat-widgets',
        title: 'Chat Widgets',
        description: 'Configuração de widgets de chat para sites.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Chat Widgets permitem incorporar um chat ao vivo no seu site ou aplicação web:

**Personalização:**
- Cores e logo da marca
- Mensagem de boas-vindas
- Formulário de pré-atendimento (nome, e-mail, assunto)
- Horário de disponibilidade
- Mensagem fora do expediente

**Instalação:**
1. Navegue até **Atendimento > Chat Widgets**
2. Crie um novo widget
3. Personalize aparência e comportamento
4. Copie o código de incorporação (snippet JavaScript)
5. Cole o snippet no HTML do seu site antes do </body>`,
          },
        ],
      },
      {
        slug: 'telefonia',
        title: 'Telefonia',
        description: 'Softphone integrado, gravações e transcrições.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Telefonia integra um softphone diretamente na plataforma:

**Funcionalidades:**
- Realizar e receber chamadas pelo navegador
- Gravação automática de chamadas
- Transcrição por IA
- Identificação automática do cliente (caller ID → contato)
- Registro automático de atividade na timeline
- Transferência entre agentes
- Conferência (chamada com múltiplos participantes)

**Configuração:**
1. Navegue até **Atendimento > Telefonia**
2. Configure o provedor de telefonia (SIP trunk)
3. Atribua ramais aos agentes
4. Configure filas de chamada e IVR (URA)
5. Ative gravação e transcrição`,
          },
        ],
      },
      {
        slug: 'analytics-atendimento',
        title: 'Analytics de Atendimento',
        description: 'Métricas detalhadas e relatórios de performance.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Analytics de Atendimento oferece dashboards detalhados com:

- **Volume:** Tickets criados vs. resolvidos por período
- **SLA:** Cumprimento por fila, prioridade e agente
- **Tempo médio:** Primeira resposta, resolução, espera
- **Satisfação:** CSAT e NPS por período e agente
- **Canal:** Distribuição e eficiência por canal
- **Agente:** Produtividade, qualidade e carga de trabalho
- **Tendências:** Gráficos de evolução temporal

Todos os relatórios podem ser exportados em CSV ou PDF.`,
          },
        ],
      },
      {
        slug: 'base-conhecimento',
        title: 'Base de Conhecimento',
        description: 'Artigos, categorias e self-service para clientes.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `A Base de Conhecimento permite criar e publicar artigos de ajuda para autoatendimento de clientes e como referência interna para agentes.

**Estrutura:**
- **Categorias:** Agrupamento temático de artigos
- **Artigos:** Conteúdo detalhado com texto, imagens e vídeos
- **Tags:** Etiquetas para busca e categorização cruzada
- **Status:** Rascunho, Publicado, Arquivado

**Métricas por artigo:**
- Visualizações
- Feedback (útil/não útil)
- Tickets resolvidos com o artigo
- Termos de busca que levaram ao artigo`,
          },
          {
            heading: 'Criando um Artigo',
            content: `1. Navegue até **Atendimento > Base de Conhecimento**
2. Clique em **"+ Novo Artigo"**
3. Selecione a **categoria**
4. Escreva o **título** e o **conteúdo** (editor rich text)
5. Adicione **tags** relevantes
6. Defina a **visibilidade** (público para clientes ou interno para agentes)
7. Clique em **"Publicar"** ou **"Salvar como Rascunho"**`,
          },
        ],
      },
      {
        slug: 'customer-success',
        title: 'Customer Success',
        description: 'Health scores, playbooks e gestão proativa de clientes.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Customer Success permite gestão proativa da satisfação e retenção de clientes:

**Health Score:**
Score composto calculado a partir de múltiplos indicadores:
- Engajamento com o produto (logins, features usadas)
- Volume de tickets (muitos tickets = baixo score)
- NPS/CSAT recentes
- Status de pagamento
- Interações com CSM

**Faixas:**
- 🟢 Saudável (80–100)
- 🟡 Atenção (50–79)
- 🔴 Risco (0–49)

**Playbooks:**
Sequências automatizadas de ações baseadas no health score:
- Score < 50 → Agendar call de resgate
- Renovação em 60 dias → Iniciar processo de renovação
- NPS detrator → Escalar para gerente de CS`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. MARKETING
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'marketing',
    title: 'Marketing',
    icon: 'Megaphone',
    articles: [
      {
        slug: 'dashboard-marketing',
        title: 'Dashboard de Marketing',
        description: 'KPIs de campanhas e engajamento.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Dashboard de Marketing centraliza métricas de todas as campanhas e canais:

| Métrica | Descrição |
|---------|-----------|
| E-mails Enviados | Volume total de envios |
| Taxa de Abertura | % de e-mails abertos |
| Taxa de Clique | % de cliques em links |
| Taxa de Bounce | % de e-mails não entregues |
| Unsubscribes | Descadastros no período |
| Leads Gerados | Novos leads via campanhas |
| Conversões | Leads convertidos em oportunidades |
| ROI | Retorno sobre investimento por campanha |`,
          },
        ],
      },
      {
        slug: 'campanhas',
        title: 'Campanhas',
        description: 'Criação e gestão de campanhas multicanal.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Campanhas permitem criar e executar ações de marketing direcionadas por múltiplos canais:

**Canais suportados:**
- 📧 E-mail marketing
- 📱 SMS
- 💬 WhatsApp
- 🌐 Web push

**Tipos de campanha:**
- **Pontual:** Envio único para um segmento
- **Recorrente:** Envio programado periódico
- **Triggered:** Disparada por evento (ex: abandono de carrinho)
- **A/B Test:** Teste de variações para otimização`,
          },
          {
            heading: 'Criando uma Campanha',
            content: `1. Navegue até **Marketing > Campanhas** e clique em **"+ Nova Campanha"**
2. Defina **nome**, **tipo** e **canal**
3. Selecione o **segmento** de destinatários
4. Escolha ou crie o **template** de conteúdo
5. Configure **personalização** (merge fields: nome, empresa, etc.)
6. Defina **data e hora de envio** (ou trigger)
7. Revise e clique em **"Agendar"** ou **"Enviar Agora"**

**Teste A/B:**
1. Ative a opção "Teste A/B"
2. Crie a **Variante A** e a **Variante B** (assunto, conteúdo ou horário diferentes)
3. Defina o % da audiência para teste (ex: 20%)
4. Defina o critério vencedor (abertura ou clique)
5. O restante da audiência (80%) receberá a variante vencedora automaticamente`,
          },
        ],
      },
      {
        slug: 'segmentos',
        title: 'Segmentos',
        description: 'Construtor de regras dinâmicas para segmentação.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Segmentos permitem criar audiências dinâmicas baseadas em regras compostas:

**Tipos de critério:**
- **Demográfico:** Cargo, setor, localização, porte da empresa
- **Comportamental:** Abriu e-mail, clicou em link, visitou página
- **Transacional:** Comprou produto X, valor de compra > Y
- **Engajamento:** Score de lead, último contato há N dias
- **Custom:** Qualquer campo personalizado

**Operadores:** igual, diferente, contém, não contém, maior que, menor que, está em, não está em, entre

**Combinação:** Regras podem ser combinadas com AND/OR e agrupadas em blocos

**Segmentos dinâmicos:** A audiência é recalculada automaticamente a cada envio, incluindo novos registros que atendam aos critérios.`,
          },
        ],
      },
      {
        slug: 'jornadas',
        title: 'Jornadas (Journey Builder)',
        description: 'Construtor visual de jornadas automatizadas.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Journey Builder é um editor visual drag-and-drop para criar jornadas automatizadas multicanal:

**Tipos de blocos:**

| Bloco | Descrição |
|-------|-----------|
| **Trigger** | Evento de entrada (cadastro, compra, data, tag) |
| **Ação** | Enviar e-mail, SMS, WhatsApp, criar tarefa, atualizar campo |
| **Condição** | If/else baseado em atributo ou comportamento |
| **Espera** | Aguardar N minutos/horas/dias |
| **Split** | Dividir audiência em % para A/B test |
| **Saída** | Remover da jornada (critério ou manual) |

**Exemplo de jornada de onboarding:**
1. Trigger: Novo cadastro
2. Ação: Enviar e-mail de boas-vindas
3. Espera: 2 dias
4. Condição: Abriu o e-mail?
   - Sim → Enviar e-mail com tutorial
   - Não → Reenviar e-mail com assunto diferente
5. Espera: 3 dias
6. Ação: Enviar SMS com oferta especial
7. Saída: Após 30 dias ou conversão`,
          },
        ],
      },
      {
        slug: 'provedores',
        title: 'Provedores de Envio',
        description: 'Configuração de provedores de e-mail, SMS e WhatsApp.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Provedores são os serviços de envio configurados para cada canal de comunicação:

**E-mail:**
- SMTP personalizado
- Serviços integrados (SendGrid, Mailgun, Amazon SES, etc.)
- Configuração de domínio (SPF, DKIM, DMARC)

**SMS:**
- Provedores de SMS integrados
- Configuração de remetente (short code ou número)

**WhatsApp:**
- WhatsApp Business API
- Templates HSM aprovados pelo Meta

Para configurar, navegue até **Marketing > Provedores** e adicione as credenciais do serviço desejado.`,
          },
        ],
      },
      {
        slug: 'preferencias',
        title: 'Centro de Preferências',
        description: 'Gestão de preferências de comunicação do cliente.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Centro de Preferências permite que clientes gerenciem suas preferências de comunicação:

- **Canais:** Optar por receber via e-mail, SMS, WhatsApp ou todos
- **Frequência:** Diário, semanal, mensal
- **Categorias:** Marketing, transacional, produto, eventos
- **Opt-out global:** Descadastro de todas as comunicações

Uma página de preferências é gerada automaticamente e pode ser personalizada com a identidade visual da empresa. O link é incluído automaticamente no rodapé de todos os e-mails.`,
          },
        ],
      },
      {
        slug: 'personalizacao',
        title: 'Personalização',
        description: 'Conteúdo dinâmico e personalização avançada.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `A Personalização permite criar conteúdo dinâmico que se adapta ao perfil de cada destinatário:

**Merge Fields:** Variáveis como {{nome}}, {{empresa}}, {{cargo}} inseridas no conteúdo
**Blocos condicionais:** Exibir seções diferentes baseado em atributos (ex: mostrar oferta A para clientes do setor tech e oferta B para varejo)
**Recomendações:** Sugestões de produtos baseadas em comportamento anterior

Essas funcionalidades estão disponíveis tanto em campanhas de e-mail quanto em jornadas automatizadas.`,
          },
        ],
      },
      {
        slug: 'intelligence',
        title: 'Marketing Intelligence',
        description: 'Insights e analytics avançados de marketing.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Marketing Intelligence fornece insights avançados para otimização contínua:

- **Melhor horário de envio:** IA identifica o melhor horário para cada contato
- **Análise de fadiga:** Alerta quando um contato está recebendo excesso de comunicação
- **Análise de conteúdo:** Quais assuntos e CTAs geram mais engajamento
- **Previsão de churn:** Identificação de clientes em risco de desengajamento
- **Benchmarks:** Comparação com médias do setor`,
          },
        ],
      },
      {
        slug: 'email-templates',
        title: 'Templates de E-mail',
        description: 'Editor visual para criação de templates.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O editor visual de templates permite criar e-mails profissionais sem necessidade de código:

**Componentes drag-and-drop:**
- Cabeçalho com logo
- Blocos de texto
- Imagens e banners
- Botões de CTA
- Colunas (1, 2, 3 colunas)
- Espaçadores e divisores
- Rodapé com links de descadastro
- Blocos de produto (imagem + nome + preço + CTA)

**Funcionalidades:**
- Preview em desktop e mobile
- Teste de envio para e-mail de verificação
- Versionamento de templates
- Biblioteca de templates pré-aprovados
- Personalização com merge fields`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 5. COMMERCE
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'commerce',
    title: 'Commerce',
    icon: 'ShoppingCart',
    articles: [
      {
        slug: 'dashboard-commerce',
        title: 'Dashboard Commerce',
        description: 'KPIs de e-commerce e vendas online.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Dashboard Commerce apresenta métricas essenciais de operação de e-commerce:

| Métrica | Descrição |
|---------|-----------|
| Receita Total | Faturamento no período |
| Pedidos | Total de pedidos realizados |
| Ticket Médio | Valor médio por pedido |
| Taxa de Conversão | % de visitantes que compraram |
| Devoluções | Total de devoluções processadas |
| Produtos Mais Vendidos | Ranking por volume e receita |`,
          },
        ],
      },
      {
        slug: 'pedidos',
        title: 'Pedidos',
        description: 'Criação, gestão e acompanhamento de pedidos.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Pedidos gerencia todo o ciclo de vida de um pedido:

**Status do pedido:**

| Status | Descrição |
|--------|-----------|
| Rascunho | Pedido em elaboração |
| Confirmado | Pedido confirmado, aguardando pagamento |
| Pago | Pagamento recebido |
| Em Separação | Produtos sendo separados no estoque |
| Enviado | Pedido despachado |
| Entregue | Entrega confirmada |
| Cancelado | Pedido cancelado |

**Numeração automática:** Cada pedido recebe um número sequencial (ORD-2025-XXXXX).`,
          },
          {
            heading: 'Criando um Pedido Manual',
            content: `1. Navegue até **Commerce > Pedidos** e clique em **"+ Novo Pedido"**
2. Selecione o **cliente** (conta/contato existente)
3. Busque e adicione **produtos** do catálogo
4. Para cada produto, ajuste **quantidade** e **preço** (se diferente do catálogo)
5. Aplique **cupons de desconto** (se houver)
6. Defina **método de pagamento** e **endereço de entrega**
7. Revise o **resumo do pedido** (subtotal, descontos, frete, total)
8. Clique em **"Confirmar Pedido"**`,
          },
          {
            heading: 'Pagamentos e Entregas',
            content: `**Pagamentos:**
- Registro manual de pagamento (transferência, boleto, cartão)
- Status: Pendente, Pago, Reembolsado
- Histórico de transações por pedido

**Entregas:**
- Registro de código de rastreio
- Status de entrega atualizado manualmente ou via integração
- Notificação automática ao cliente sobre atualizações

**Timeline:** Cada pedido possui uma timeline com todos os eventos (criação, pagamento, envio, entrega, devoluções).`,
          },
        ],
      },
      {
        slug: 'devolucoes',
        title: 'Devoluções',
        description: 'Processamento de RMA e retornos de produtos.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Devoluções gerencia solicitações de retorno de produtos (RMA - Return Merchandise Authorization):

**Fluxo de devolução:**
1. Cliente solicita devolução (portal do cliente ou agente)
2. Solicitação é criada com motivo e produtos a devolver
3. Equipe aprova ou rejeita a solicitação
4. Se aprovada, instruções de envio são geradas
5. Produto recebido é inspecionado
6. Reembolso ou troca é processado

**Motivos de devolução:**
- Produto com defeito
- Produto errado enviado
- Desistência da compra (arrependimento)
- Produto não corresponde à descrição
- Outros`,
          },
        ],
      },
      {
        slug: 'promocoes',
        title: 'Promoções',
        description: 'Motor de cupons e descontos.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O motor de promoções permite criar regras de desconto flexíveis:

**Tipos de promoção:**

| Tipo | Descrição |
|------|-----------|
| Cupom de Desconto | Código que aplica % ou valor fixo |
| Frete Grátis | Isenção de frete para pedidos qualificados |
| Compre X Leve Y | Promoção de pacote |
| Desconto Progressivo | % maior conforme quantidade comprada |
| Flash Sale | Desconto por tempo limitado |

**Regras de elegibilidade:**
- Valor mínimo do pedido
- Categorias de produto específicas
- Segmento de clientes
- Período de validade
- Limite de uso (total e por cliente)`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6. ITSM
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'itsm',
    title: 'ITSM',
    icon: 'Server',
    articles: [
      {
        slug: 'dashboard-itsm',
        title: 'Dashboard ITSM',
        description: 'Métricas de TI, SLAs e incidentes críticos.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Dashboard ITSM exibe KPIs da operação de TI:

| Métrica | Descrição |
|---------|-----------|
| Incidentes Abertos | Total de incidentes com status aberto |
| Incidentes Críticos | Incidentes com prioridade P1 |
| MTTR | Tempo médio de recuperação |
| Mudanças Planejadas | Mudanças agendadas para o período |
| SLA de Incidentes | % de incidentes dentro do SLA |
| Disponibilidade | Uptime dos serviços monitorados |
| CMDB Itens | Total de itens de configuração cadastrados |`,
          },
        ],
      },
      {
        slug: 'incidentes',
        title: 'Incidentes',
        description: 'Registro e resolução de incidentes de TI.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Incidentes são eventos não planejados que interrompem ou degradam um serviço de TI. O módulo segue as práticas ITIL.

**Campos principais:**

| Campo | Descrição |
|-------|-----------|
| Número | Identificador automático (INC-XXXXX) |
| Título | Resumo do incidente |
| Descrição | Detalhamento técnico |
| Impacto | Alto, Médio, Baixo |
| Urgência | Alta, Média, Baixa |
| Prioridade | Calculada automaticamente (P1–P4) |
| Status | Novo, Em Investigação, Pendente, Resolvido, Fechado |
| Serviço Afetado | Item de configuração do CMDB |
| Atribuído a | Técnico responsável |

**Matriz de prioridade (mesma lógica de tickets):**

|  | Urgência Alta | Urgência Média | Urgência Baixa |
|--|--------------|----------------|----------------|
| **Impacto Alto** | P1 | P2 | P3 |
| **Impacto Médio** | P2 | P3 | P4 |
| **Impacto Baixo** | P3 | P4 | P4 |`,
          },
        ],
      },
      {
        slug: 'mudancas',
        title: 'Mudanças',
        description: 'Gestão de mudanças de TI com planos de implementação.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Mudanças gerencia alterações planejadas na infraestrutura de TI:

**Tipos de mudança:**
- **Normal:** Requer aprovação do CAB (Change Advisory Board)
- **Padrão:** Pré-aprovada, procedimento documentado
- **Emergencial:** Aprovação acelerada para incidentes críticos

**Campos do registro de mudança:**
- Plano de implementação (passos detalhados)
- Plano de rollback (como reverter em caso de falha)
- Janela de manutenção (data/hora de execução)
- Serviços afetados (CMDB)
- Aprovações necessárias
- Risco e impacto

**Fluxo:**
1. Solicitante cria a RFC (Request for Change)
2. Gerente de mudanças avalia risco e impacto
3. CAB aprova ou rejeita
4. Implementação dentro da janela planejada
5. Verificação pós-implementação
6. Fechamento da mudança`,
          },
        ],
      },
      {
        slug: 'cmdb',
        title: 'CMDB',
        description: 'Banco de dados de gerenciamento de configuração.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O CMDB (Configuration Management Database) é o repositório central de todos os itens de configuração (CI) da infraestrutura de TI:

**Tipos de CI:**
- Servidores (físicos e virtuais)
- Aplicações e serviços
- Bancos de dados
- Equipamentos de rede (switches, firewalls, load balancers)
- Estações de trabalho
- Licenças de software

**Relacionamentos:**
- Dependência (Serviço A depende de Servidor B)
- Impacto (se Servidor B cair, Serviço A é afetado)
- Composição (Cluster é composto por Servidor 1, 2 e 3)

A visualização de relacionamentos permite análise de impacto antes de mudanças e identificação rápida da causa raiz em incidentes.`,
          },
        ],
      },
      {
        slug: 'ativos',
        title: 'Ativos de TI',
        description: 'Gestão de hardware, software, licenças e garantias.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Ativos gerencia o inventário de hardware e software da organização:

**Categorias:**
- **Hardware:** Notebooks, desktops, impressoras, celulares, monitores
- **Software:** Licenças, assinaturas SaaS, certificados SSL
- **Rede:** Switches, roteadores, access points
- **Periféricos:** Teclados, mouses, headsets

**Campos por ativo:**
| Campo | Descrição |
|-------|-----------|
| Tag | Identificador de patrimônio |
| Tipo | Categoria do ativo |
| Fabricante | Marca/fabricante |
| Modelo | Modelo específico |
| Número de Série | Serial number |
| Atribuído a | Usuário responsável |
| Localização | Local físico |
| Data de Compra | Data de aquisição |
| Garantia até | Fim da garantia |
| Status | Ativo, Em Manutenção, Aposentado |`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 7. INTELIGÊNCIA ARTIFICIAL
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'inteligencia-artificial',
    title: 'Inteligência Artificial',
    icon: 'Brain',
    articles: [
      {
        slug: 'agentes-ia',
        title: 'Agentes de IA',
        description: 'Criação, configuração e gestão de agentes inteligentes.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Agentes de IA são assistentes inteligentes configuráveis que executam tarefas automatizadas ou auxiliam usuários em tempo real.

**Tipos de agente:**
- **Assistente:** Responde perguntas e auxilia usuários
- **Automação:** Executa tarefas sem intervenção humana
- **Análise:** Processa dados e gera insights

**Campos de configuração:**

| Campo | Descrição |
|-------|-----------|
| Nome | Nome do agente |
| Tipo | Assistente, Automação ou Análise |
| Modelo | LLM utilizado (GPT-4, Gemini, etc.) |
| System Prompt | Instruções de comportamento do agente |
| Temperatura | Criatividade das respostas (0–1) |
| Max Tokens | Limite de tokens por resposta |
| Max Turns | Número máximo de turnos por conversa |
| Timeout | Tempo limite de execução (segundos) |
| Status | Rascunho, Ativo, Pausado, Arquivado |
| Escopo | Módulos/entidades que o agente pode acessar |`,
          },
          {
            heading: 'Criando um Agente',
            content: `1. Navegue até **IA > Agentes** e clique em **"+ Novo Agente"**
2. Defina **nome**, **tipo** e **descrição**
3. Configure o **modelo** e parâmetros (temperatura, max tokens)
4. Escreva o **System Prompt** com instruções detalhadas de comportamento
5. Vincule **ferramentas** (tools) que o agente pode usar
6. Vincule **políticas** de segurança e guardrails
7. Teste no **Playground** (IA > Agentes > [Agente] > Testar)
8. Publique o agente mudando o status para **"Ativo"**`,
          },
          {
            heading: 'Playground de Testes',
            content: `O Playground permite testar o agente em uma interface de chat interativa:

- Envie mensagens e veja as respostas do agente
- Visualize as ferramentas chamadas (function calling)
- Ajuste o system prompt e parâmetros em tempo real
- Compare versões do agente
- Visualize tokens consumidos e latência

**Dica:** Use o playground extensivamente antes de publicar o agente em produção. Teste cenários normais, edge cases e tentativas de jailbreak.`,
          },
        ],
      },
      {
        slug: 'ferramentas-ia',
        title: 'Ferramentas de IA',
        description: 'Registro de funções para function calling.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Ferramentas (Tools) são funções que os agentes de IA podem invocar durante uma conversa para executar ações concretas:

**Tipos de ferramenta:**
- **Consulta:** Buscar dados no CRM, tickets, base de conhecimento
- **Ação:** Criar lead, atualizar ticket, enviar e-mail
- **Cálculo:** Gerar relatórios, calcular métricas
- **Integração:** Chamar APIs externas

**Configuração de uma ferramenta:**
| Campo | Descrição |
|-------|-----------|
| Nome | Nome da função |
| Descrição | O que a ferramenta faz (para o agente entender) |
| Tipo | Consulta, Ação, Cálculo, Integração |
| Parâmetros | Schema JSON dos parâmetros aceitos |
| Nível de Risco | Baixo, Médio, Alto, Crítico |
| Requer Aprovação | Se ações destrutivas precisam de aprovação |
| Categoria | Classificação organizacional |`,
          },
        ],
      },
      {
        slug: 'politicas-ia',
        title: 'Políticas de IA',
        description: 'Guardrails e regras de uso seguro.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Políticas definem guardrails e limites para garantir o uso seguro e ético dos agentes de IA:

**Tipos de política:**
- **Conteúdo:** Filtros de linguagem inapropriada, PII
- **Acesso:** Quais dados o agente pode acessar
- **Ação:** Quais ações requerem aprovação humana
- **Rate Limit:** Limites de uso por usuário/período
- **Custo:** Orçamento máximo de tokens/custo

**Ações em caso de violação:**
- Bloquear a resposta
- Alertar o supervisor
- Registrar no log de auditoria
- Solicitar aprovação humana
- Encerrar a conversa`,
          },
        ],
      },
      {
        slug: 'avaliacoes-ia',
        title: 'Avaliações de IA',
        description: 'Testes de qualidade e acurácia dos agentes.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Avaliações (Evals) são suítes de testes para medir a qualidade dos agentes:

**Estrutura de um eval:**
- **Caso de teste:** Input (pergunta/contexto) + Output esperado
- **Critério de avaliação:** Exato, parcial, semântico, regex
- **Suite:** Conjunto de casos de teste agrupados

**Métricas:**
- Pass rate (% de testes aprovados)
- Latência média
- Custo por teste
- Evolução do pass rate entre versões

**Boas práticas:**
- Crie evals para cenários comuns e edge cases
- Execute evals automaticamente a cada nova versão
- Compare pass rate entre versões antes de publicar`,
          },
        ],
      },
      {
        slug: 'execucoes-ia',
        title: 'Execuções (Runs)',
        description: 'Histórico de execuções com inputs/outputs detalhados.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `A página de Execuções exibe o histórico completo de todas as runs dos agentes:

**Informações por run:**
- ID da execução e correlation ID
- Agente que executou
- Trigger (manual, automação, API)
- Status (running, completed, failed, cancelled)
- Input context e output result
- Steps executados (com ferramentas chamadas)
- Tokens consumidos (prompt + completion)
- Custo estimado
- Duração total
- Usuário que disparou

**Filtros:** Por agente, status, período, usuário, trigger type.

**Drill-down:** Clique em uma run para ver cada step individualmente, incluindo os inputs/outputs de cada ferramenta chamada e o raciocínio do agente.`,
          },
        ],
      },
      {
        slug: 'analytics-ia',
        title: 'Analytics de IA',
        description: 'Métricas de uso, performance e custos.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Analytics de IA fornece dashboards detalhados sobre o uso dos agentes:

- **Volume:** Número de runs por período, por agente
- **Latência:** Tempo médio de resposta (p50, p95, p99)
- **Tokens:** Consumo de tokens por agente e período
- **Custos:** Custo estimado por agente, por dia
- **Erros:** Taxa de falha e tipos de erro mais comuns
- **Satisfação:** Feedback dos usuários sobre respostas
- **Ferramentas:** Quais tools são mais utilizadas
- **Tendências:** Evolução do uso ao longo do tempo`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 8. DADOS E INTEGRAÇÃO
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'dados-integracao',
    title: 'Dados e Integração',
    icon: 'Database',
    articles: [
      {
        slug: 'governanca-lgpd',
        title: 'Governança e LGPD',
        description: 'Solicitações de titulares, anonimização e consentimento.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Governança gerencia conformidade com a LGPD e outras regulamentações de proteção de dados:

**Tipos de solicitação do titular:**
- **Acesso:** Relatório com todos os dados do titular
- **Retificação:** Correção de dados incorretos
- **Eliminação:** Exclusão de dados pessoais
- **Portabilidade:** Exportação de dados em formato padrão
- **Revogação de consentimento:** Cancelamento de autorizações

**Fluxo de solicitação:**
1. Solicitação recebida (portal, e-mail ou manual)
2. Validação de identidade do titular
3. Análise do escopo da solicitação
4. Execução da ação (geração de relatório, exclusão, etc.)
5. Resposta ao titular dentro do prazo legal (15 dias úteis)

**Auditoria:** Todas as solicitações e ações são registradas no log de auditoria para compliance.`,
          },
        ],
      },
      {
        slug: 'duplicatas',
        title: 'Duplicatas',
        description: 'Detecção e resolução de registros duplicados.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Duplicatas detecta automaticamente registros potencialmente duplicados em todas as entidades do sistema:

**Critérios de detecção:**
- E-mail idêntico
- Nome + empresa similar (fuzzy matching)
- Telefone idêntico
- Documento (CPF/CNPJ) idêntico

**Ações disponíveis:**
- **Mesclar:** Unificar dois registros usando o Merge Wizard
- **Ignorar:** Marcar como "não duplicata"
- **Revisar:** Comparação lado a lado dos registros

Os pares de duplicatas são listados com um **score de confiança** (0–100%) indicando a probabilidade de serem realmente duplicados.`,
          },
        ],
      },
      {
        slug: 'merge-wizard',
        title: 'Merge Wizard',
        description: 'Fusão assistida de registros duplicados.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Merge Wizard é um assistente passo-a-passo para mesclar registros duplicados:

**Fluxo:**
1. Selecione os registros a mesclar (2 ou mais)
2. Comparação lado a lado de todos os campos
3. Para cada campo, escolha qual valor manter (ou edite)
4. Defina o registro "mestre" (que será mantido)
5. Revise as relações que serão migradas (contatos, oportunidades, tickets)
6. Confirme e execute a mesclagem

**Importante:**
- Registros secundários são desativados (não excluídos) para rastreabilidade
- Todas as relações (contatos, oportunidades, atividades) são migradas para o registro mestre
- A ação é registrada no log de auditoria
- Merge pode ser revertido pelo administrador em até 30 dias`,
          },
        ],
      },
      {
        slug: 'customer-360',
        title: 'Customer 360',
        description: 'Visão unificada e completa do cliente.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Customer 360 fornece uma visão consolidada de todas as interações e dados de um cliente:

**Informações exibidas:**
- **Dados cadastrais:** Conta, contatos, endereços
- **Financeiro:** Contratos ativos, faturamento, pagamentos
- **Pipeline:** Oportunidades abertas e históricas
- **Atendimento:** Tickets, CSAT, NPS
- **Engajamento:** Interações com campanhas, eventos
- **Health Score:** Pontuação de saúde do cliente
- **Timeline unificada:** Todos os eventos em ordem cronológica

**Navegação:** Acesse via Dados > Customer 360 ou clicando em "360°" no detalhe de qualquer conta ou contato.`,
          },
        ],
      },
      {
        slug: 'golden-records',
        title: 'Golden Records',
        description: 'Registros mestres unificados e deduplicados.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Golden Records são registros mestres que unificam dados de múltiplas fontes, resolvendo conflitos e garantindo uma "verdade única":

**Processo de criação:**
1. Dados são ingeridos de múltiplas fontes (CRM, ERP, e-commerce, etc.)
2. Algoritmos de matching identificam registros correspondentes
3. Regras de sobrevivência definem qual valor usar em caso de conflito
4. O Golden Record é gerado com os melhores dados de cada fonte

**Regras de sobrevivência:**
- Mais recente vence
- Fonte prioritária vence (ex: ERP > CRM para dados financeiros)
- Completude (campo preenchido vence sobre campo vazio)
- Votação (valor mais frequente entre as fontes)`,
          },
        ],
      },
      {
        slug: 'fontes-dados',
        title: 'Fontes de Dados, Event Schemas e Activation',
        description: 'Ingestão, esquemas de eventos e ativação de dados.',
        sections: [
          {
            heading: 'Fontes de Dados',
            content: `Fontes de Dados permitem conectar sistemas externos para ingestão de dados:

**Tipos de fonte:**
- API REST
- Banco de dados (PostgreSQL, MySQL, SQL Server)
- Arquivos (CSV, JSON)
- Webhooks
- Streams (Kafka, RabbitMQ)

**Configuração:**
1. Navegue até **Dados > Fontes de Dados**
2. Clique em **"+ Nova Fonte"**
3. Selecione o tipo de fonte
4. Configure credenciais e mapeamento de campos
5. Defina frequência de sincronização
6. Ative a fonte`,
          },
          {
            heading: 'Event Schemas',
            content: `Event Schemas definem a estrutura dos eventos capturados pelo sistema:

- Cada evento tem um nome, versão e schema (JSON Schema)
- Validação automática de eventos contra o schema
- Versionamento de schemas com retrocompatibilidade
- Catálogo de eventos para documentação`,
          },
          {
            heading: 'Activation',
            content: `Activation permite enviar dados processados para destinos externos:

**Destinos suportados:**
- Data warehouses (BigQuery, Snowflake, Redshift)
- Ferramentas de marketing (Google Ads, Facebook Ads)
- Plataformas de analytics
- APIs customizadas

**Configuração:**
1. Navegue até **Dados > Activation**
2. Configure o destino
3. Selecione o segmento ou dataset
4. Defina mapeamento de campos
5. Programe a frequência de sincronização`,
          },
        ],
      },
      {
        slug: 'integracoes',
        title: 'Integrações',
        description: 'Catálogo, instâncias, monitoramento, DLQ e webhooks.',
        sections: [
          {
            heading: 'Catálogo de Integrações',
            content: `O Catálogo lista todas as integrações disponíveis organizadas por categoria:

- **CRM:** Salesforce, HubSpot, Pipedrive
- **ERP:** SAP, Oracle, TOTVS
- **E-commerce:** Shopify, WooCommerce, VTEX
- **Comunicação:** Slack, Teams, Discord
- **Marketing:** Google Ads, Facebook Ads, Mailchimp
- **Pagamento:** Stripe, PagSeguro, Mercado Pago
- **Telefonia:** Twilio, Vonage
- **Cloud:** AWS, Azure, GCP`,
          },
          {
            heading: 'Instâncias',
            content: `Cada integração ativada cria uma instância com:
- Status de conexão (ativa, inativa, erro)
- Credenciais configuradas
- Mapeamento de campos
- Histórico de sincronizações
- Métricas de volume e erros`,
          },
          {
            heading: 'Monitoramento',
            content: `O painel de monitoramento exibe em tempo real:
- Status de cada integração
- Volume de dados processados
- Erros e alertas
- Latência de sincronização
- Últimas execuções`,
          },
          {
            heading: 'Dead Letter Queue (DLQ)',
            content: `A DLQ armazena mensagens que falharam no processamento:
- Visualização do payload da mensagem
- Motivo da falha
- Número de tentativas
- Opções: reprocessar, descartar ou mover

**Importante:** Monitore a DLQ regularmente para evitar perda de dados.`,
          },
          {
            heading: 'Webhooks',
            content: `Webhooks permitem receber notificações em tempo real de sistemas externos:

**Configuração:**
1. Navegue até **Dados > Webhooks**
2. Clique em **"+ Novo Webhook"**
3. Defina o endpoint URL
4. Selecione os eventos a capturar
5. Configure autenticação (API key, HMAC)
6. Ative o webhook

**Monitoramento:** Cada webhook exibe histórico de chamadas com payload, status HTTP e tempo de resposta.`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 9. GESTÃO E AUTOMAÇÃO
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'gestao-automacao',
    title: 'Gestão e Automação',
    icon: 'BarChart3',
    articles: [
      {
        slug: 'workflows',
        title: 'Workflows (Automações)',
        description: 'Criação de fluxos de trabalho automatizados.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Workflow Builder permite criar automações visuais usando drag-and-drop:

**Tipos de trigger:**
- **Evento:** Quando um registro é criado, atualizado ou excluído
- **Agendamento:** Execução periódica (diária, semanal, mensal)
- **Manual:** Acionado pelo usuário via botão
- **Webhook:** Acionado por chamada externa

**Tipos de ação:**
- Atualizar campo
- Criar registro
- Enviar e-mail/SMS/WhatsApp
- Criar tarefa
- Chamar webhook
- Executar agente de IA
- Esperar (delay)
- Condição (if/else)

**Exemplo:** Quando um lead é criado com score > 80, criar uma oportunidade automaticamente, atribuir ao vendedor do território e enviar notificação.`,
          },
        ],
      },
      {
        slug: 'dashboards-custom',
        title: 'Dashboards Customizados',
        description: 'Criação de dashboards personalizados com drag-and-drop.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Dashboard Builder permite criar painéis visuais personalizados:

**Tipos de widget:**
- Gráfico de barras, linhas, pizza, donut
- KPI card (número com variação %)
- Tabela de dados
- Lista de registros
- Mapa de calor
- Funil
- Gauge (velocímetro)

**Funcionalidades:**
- Drag-and-drop para posicionar widgets
- Redimensionamento livre
- Filtros globais e por widget
- Atualização em tempo real ou periódica
- Compartilhamento com equipes
- Exportação para PDF

**Dados disponíveis:** Leads, oportunidades, tickets, contratos, pedidos, atividades e qualquer entidade do sistema.`,
          },
        ],
      },
      {
        slug: 'relatorios',
        title: 'Relatórios',
        description: 'Construção e exportação de relatórios analíticos.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Relatórios permite criar análises detalhadas com filtros e agrupamentos:

**Construtor de relatório:**
1. Selecione a **entidade base** (Leads, Oportunidades, Tickets, etc.)
2. Escolha os **campos** a exibir (colunas)
3. Defina **filtros** (período, status, responsável, etc.)
4. Configure **agrupamentos** (por mês, por vendedor, por status)
5. Adicione **métricas** (soma, média, contagem, mín, máx)
6. Escolha a **visualização** (tabela, gráfico, ambos)
7. **Salve** e **agende** envio periódico por e-mail

**Exportação:** CSV, Excel, PDF
**Compartilhamento:** Por link, por equipe, público ou privado`,
          },
        ],
      },
      {
        slug: 'auditoria',
        title: 'Auditoria',
        description: 'Log de auditoria de todas as operações do sistema.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Log de Auditoria registra todas as operações realizadas no sistema:

**Informações registradas:**
- **Quem:** Usuário que realizou a ação
- **O quê:** Tipo de ação (criar, editar, excluir, login, logout)
- **Quando:** Data e hora com precisão de milissegundos
- **Onde:** Entidade e registro afetado
- **Antes/Depois:** Valores anteriores e novos (para edições)
- **IP:** Endereço IP de origem
- **User Agent:** Navegador/dispositivo utilizado

**Filtros:** Por usuário, tipo de ação, entidade, período, IP.

**Retenção:** Logs são mantidos por 365 dias por padrão (configurável pelo administrador).

**Compliance:** O log de auditoria é essencial para conformidade com LGPD, SOX, ISO 27001 e outras regulamentações.`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 10. ADMINISTRAÇÃO
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'administracao',
    title: 'Administração',
    icon: 'Settings',
    articles: [
      {
        slug: 'modulos',
        title: 'Módulos',
        description: 'Ativação e desativação de módulos por organização.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O painel de Módulos permite ativar ou desativar funcionalidades da plataforma:

**Módulos disponíveis:**

| Módulo | Descrição |
|--------|-----------|
| CRM | Pipeline de vendas completo |
| Service | Atendimento omnichannel |
| Marketing | Campanhas e automação de marketing |
| Commerce | Gestão de pedidos e e-commerce |
| ITSM | Gestão de serviços de TI |
| AI Agents | Agentes de inteligência artificial |
| Data Hub | Governança e gestão de dados |
| Governance | LGPD e compliance |
| Integrations | Hub de integrações |
| Automations | Workflows automatizados |

Quando um módulo é desativado, as rotas, menus e funcionalidades correspondentes são ocultadas para todos os usuários da organização. Os dados são preservados e ficam acessíveis novamente se o módulo for reativado.`,
          },
        ],
      },
      {
        slug: 'permissoes',
        title: 'Permissões',
        description: 'Permission Sets granulares com controle de acesso baseado em atributos.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O sistema utiliza Permission Sets para controle de acesso granular baseado em atributos (ABAC):

**Conceitos:**
- **Permission Set:** Conjunto nomeado de capacidades (ex: "Vendedor Sênior", "Agente de Suporte")
- **Capability:** Permissão individual (ex: "leads.create", "tickets.delete", "reports.export")
- **Escopo:** Alcance da permissão (próprio, equipe, organização)

**Exemplo de Permission Set:**

| Capability | Escopo |
|-----------|--------|
| leads.view | Equipe |
| leads.create | Próprio |
| leads.edit | Próprio |
| leads.delete | Nenhum |
| opportunities.view | Organização |
| reports.export | Próprio |

**Atribuição:** Cada usuário pode ter um ou mais Permission Sets. As permissões são cumulativas (mais permissivo vence).`,
          },
        ],
      },
      {
        slug: 'seguranca',
        title: 'Segurança',
        description: 'Políticas de segurança e proteção de dados.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O módulo de Segurança permite configurar políticas de proteção:

- **Política de senha:** Comprimento mínimo, complexidade, expiração
- **MFA:** Autenticação multifator (TOTP, SMS)
- **Sessões:** Tempo de expiração, sessões simultâneas
- **IP Allowlist:** Restrição de acesso por IP
- **Auditoria:** Configuração de retenção de logs
- **Criptografia:** Dados em repouso e em trânsito`,
          },
        ],
      },
      {
        slug: 'campos-custom',
        title: 'Campos Custom',
        description: 'Criação de campos personalizados por entidade.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Campos Custom permitem estender qualquer entidade do sistema com campos personalizados:

**Tipos de campo suportados:**
- Texto curto e longo
- Número (inteiro e decimal)
- Data e data/hora
- Seleção única (dropdown)
- Seleção múltipla (multi-select)
- Checkbox (booleano)
- URL
- E-mail
- Telefone
- Moeda
- Porcentagem

**Configuração:**
1. Navegue até **Admin > Campos Custom**
2. Selecione a **entidade** (Leads, Contas, Tickets, etc.)
3. Clique em **"+ Novo Campo"**
4. Defina nome, tipo, obrigatoriedade e valor padrão
5. Para dropdowns, adicione as opções disponíveis
6. Clique em **"Salvar"**

O campo aparecerá automaticamente nos formulários de criação/edição e poderá ser usado em filtros, relatórios e segmentos.`,
          },
        ],
      },
      {
        slug: 'observabilidade',
        title: 'Observabilidade',
        description: 'Métricas de sistema, eventos e performance.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O painel de Observabilidade fornece métricas técnicas da plataforma:

- **Tempo de resposta:** Latência de APIs e páginas
- **Erros:** Taxa de erros por endpoint e módulo
- **Uso:** Requisições por segundo, usuários ativos
- **Banco de dados:** Queries lentas, conexões ativas
- **Edge Functions:** Execuções, erros, latência
- **Eventos:** Stream de eventos do sistema em tempo real

**Alertas:** Configure alertas para ser notificado quando métricas excedem thresholds (ex: latência > 2s, taxa de erro > 5%).`,
          },
        ],
      },
      {
        slug: 'configuracoes-gerais',
        title: 'Configurações Gerais',
        description: 'Preferências do sistema e personalização.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `A página de Configurações permite personalizar diversos aspectos da plataforma:

- **Perfil:** Nome, avatar, e-mail, idioma
- **Notificações:** Canais e tipos de notificação
- **Aparência:** Tema (claro/escuro/sistema)
- **Organização:** Nome, logo, fuso horário, moeda padrão
- **E-mail:** Assinatura de e-mail, templates padrão
- **Integrações:** Chaves de API, webhooks configurados`,
          },
        ],
      },
      {
        slug: 'respostas-rapidas',
        title: 'Respostas Rápidas (Canned Responses)',
        description: 'Templates de respostas padronizadas para atendimento.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Respostas Rápidas são templates de texto pré-definidos que agentes podem usar para agilizar o atendimento:

**Organização:**
- Respostas são organizadas por **categoria** (Saudação, Encerramento, Troubleshooting, Informativo)
- Cada resposta tem um **atalho** para inserção rápida (ex: /saudacao, /encerrar)
- Suporte a **merge fields** para personalização ({{nome_cliente}}, {{numero_ticket}})

**Criação:**
1. Navegue até **Configurações > Respostas Rápidas**
2. Clique em **"+ Nova Resposta"**
3. Defina **título**, **atalho**, **categoria** e **conteúdo**
4. Use merge fields para personalização
5. Clique em **"Salvar"**

**Uso no atendimento:**
- No Inbox ou no Ticket, digite **"/"** seguido do atalho
- Ou clique no ícone de respostas rápidas e selecione da lista
- O texto é inserido automaticamente com os merge fields substituídos`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 11. PORTAL DO CLIENTE
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'portal-cliente',
    title: 'Portal do Cliente',
    icon: 'UserCircle',
    articles: [
      {
        slug: 'portal-login',
        title: 'Login do Portal',
        description: 'Acesso ao portal de autoatendimento do cliente.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Portal do Cliente é uma interface de autoatendimento que permite aos clientes:

- Abrir e acompanhar tickets
- Visualizar pedidos e faturas
- Solicitar devoluções
- Consultar a base de conhecimento
- Gerenciar preferências de comunicação

**Acesso:** O portal é acessado por uma URL separada (/portal) com autenticação própria para clientes.`,
          },
        ],
      },
      {
        slug: 'portal-tickets',
        title: 'Tickets (Portal)',
        description: 'Abertura e acompanhamento de tickets pelo cliente.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `No portal, o cliente pode:

1. **Abrir novo ticket:** Preenchendo assunto, descrição e categoria
2. **Anexar arquivos:** Screenshots, documentos de referência
3. **Acompanhar status:** Visualizar o progresso do ticket em tempo real
4. **Responder mensagens:** Comunicar-se com o agente pela thread do ticket
5. **Avaliar atendimento:** Dar nota (CSAT) após resolução
6. **Consultar histórico:** Ver todos os tickets anteriores`,
          },
        ],
      },
      {
        slug: 'portal-pedidos',
        title: 'Pedidos e Faturas (Portal)',
        description: 'Visualização de pedidos, faturas e devoluções pelo cliente.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O cliente pode consultar:

**Pedidos:**
- Lista de pedidos com status (confirmado, enviado, entregue)
- Detalhes de cada pedido (produtos, valores, tracking)
- Solicitar devolução de itens

**Faturas:**
- Faturas emitidas e respectivos status (paga, pendente, vencida)
- Download de PDF da fatura
- Histórico de pagamentos

**Devoluções:**
- Status de devoluções solicitadas
- Instruções de envio
- Acompanhamento de reembolso`,
          },
        ],
      },
      {
        slug: 'portal-conhecimento',
        title: 'Base de Conhecimento (Portal)',
        description: 'Consulta de artigos de ajuda pelo cliente.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `A Base de Conhecimento no portal permite ao cliente buscar soluções antes de abrir um ticket:

- Busca por palavras-chave
- Navegação por categorias
- Artigos sugeridos baseados no assunto do ticket
- Feedback de utilidade (foi útil? sim/não)
- Artigos mais populares e mais recentes`,
          },
        ],
      },
      {
        slug: 'portal-preferencias',
        title: 'Preferências (Portal)',
        description: 'Gestão de dados pessoais e preferências de comunicação.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Na seção de Preferências do portal, o cliente pode:

- **Dados pessoais:** Atualizar nome, e-mail, telefone, endereço
- **Senha:** Alterar senha de acesso ao portal
- **Comunicação:** Gerenciar canais e frequência de comunicação
- **Privacidade:** Solicitar acesso, retificação ou exclusão de dados (LGPD)
- **Idioma:** Selecionar idioma preferido`,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 12. PORTAL DO PARCEIRO
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'portal-parceiro',
    title: 'Portal do Parceiro',
    icon: 'Handshake',
    articles: [
      {
        slug: 'parceiro-login',
        title: 'Login do Parceiro',
        description: 'Acesso ao portal de parceiros e revendedores.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Portal do Parceiro permite que revendedores e parceiros de negócio:

- Registrem e acompanhem deals
- Visualizem comissões e pagamentos
- Acessem materiais de vendas e treinamento
- Comuniquem-se com o channel manager

**Acesso:** URL separada (/partner) com autenticação própria para parceiros.`,
          },
        ],
      },
      {
        slug: 'parceiro-dashboard',
        title: 'Dashboard do Parceiro',
        description: 'Métricas e KPIs do programa de parceiros.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `O Dashboard do Parceiro exibe:

- **Deals ativos:** Pipeline de negócios registrados
- **Comissões:** Valor pendente e acumulado
- **Tier:** Nível no programa de parceiros (Silver, Gold, Platinum)
- **Meta:** Progresso em relação à meta do período
- **Recursos:** Materiais recentes disponibilizados`,
          },
        ],
      },
      {
        slug: 'parceiro-deals',
        title: 'Deals do Parceiro',
        description: 'Registro e acompanhamento de oportunidades de parceiros.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `Parceiros podem registrar deals (oportunidades) para garantir a proteção de deal:

1. Clique em **"+ Novo Deal"**
2. Preencha dados do cliente potencial (empresa, contato, valor estimado)
3. Descreva a oportunidade e o escopo
4. Submeta para aprovação do channel manager
5. Acompanhe o status: Pendente, Aprovado, Em Andamento, Ganho, Perdido

**Proteção de deal:** Uma vez aprovado, o deal é exclusivo do parceiro por um período definido (geralmente 90 dias).`,
          },
        ],
      },
      {
        slug: 'parceiro-comissoes',
        title: 'Comissões',
        description: 'Visualização de comissões e pagamentos.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `A tela de Comissões exibe:

- **Comissões pendentes:** Deals ganhos aguardando pagamento
- **Comissões pagas:** Histórico de pagamentos recebidos
- **Extrato:** Detalhamento por deal (valor do deal, % de comissão, valor da comissão)
- **Regras:** Tabela de comissão por tier e tipo de produto

**Cálculo:** A comissão é calculada automaticamente com base no valor do deal, no tier do parceiro e na tabela de comissão vigente.`,
          },
        ],
      },
      {
        slug: 'parceiro-recursos',
        title: 'Recursos do Parceiro',
        description: 'Materiais de vendas, treinamento e certificação.',
        sections: [
          {
            heading: 'Visão Geral',
            content: `A seção de Recursos disponibiliza materiais para parceiros:

- **Materiais de vendas:** Apresentações, datasheets, casos de sucesso
- **Treinamento:** Vídeos, webinars, documentação técnica
- **Certificação:** Trilhas de certificação com provas online
- **Logos e brand assets:** Materiais de co-marketing
- **Atualizações:** Release notes e roadmap de produto

Os materiais são organizados por categoria e podem ser filtrados por produto, idioma e tipo de conteúdo.`,
          },
        ],
      },
    ],
  },
];

// ─── Helper functions ──────────────────────────────────────────────

export function getAllArticlesFlat(): { category: DocCategory; article: DocArticle }[] {
  return documentationData.flatMap(cat =>
    cat.articles.map(article => ({ category: cat, article }))
  );
}

export function findCategory(slug: string): DocCategory | undefined {
  return documentationData.find(c => c.slug === slug);
}

export function findArticle(categorySlug: string, articleSlug: string): { category: DocCategory; article: DocArticle } | undefined {
  const cat = findCategory(categorySlug);
  if (!cat) return undefined;
  const article = cat.articles.find(a => a.slug === articleSlug);
  if (!article) return undefined;
  return { category: cat, article };
}

export function searchDocumentation(query: string): { category: DocCategory; article: DocArticle }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return getAllArticlesFlat().filter(({ article }) => {
    if (article.title.toLowerCase().includes(q)) return true;
    if (article.description.toLowerCase().includes(q)) return true;
    return article.sections.some(s =>
      s.heading.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
  });
}
