
# Redesign Radical do Sidebar: Arquitetura Dual-Panel (Rail + Content Panel)

## Visao Geral

Transformacao completa do sidebar atual (modelo tradicional colapsavel) para uma arquitetura de **dois paineis** inspirada nas imagens de referencia:

1. **Rail Pai (esquerdo)**: Barra vertical estreita (~72px) com icones + labels truncados dos modulos-pai (Principal, Intelli, Operac., Dados, Analyt., Config.)
2. **Content Panel (direito)**: Painel expandido (~240px) que exibe os sub-itens do modulo-pai selecionado, com titulo do modulo, campo de busca e agrupamentos de navegacao

O resultado final sera visualmente identico ao layout das imagens de referencia, com a barra fina escura a esquerda e o painel de conteudo contextual ao lado.

---

## Arquitetura dos Modulos-Pai

Cada item do Rail sera um "grupo pai" que agrega multiplos modulos:

| Rail Item | Label | Icone | Modulos Agrupados |
|-----------|-------|-------|-------------------|
| Principal | Princ. | LayoutDashboard | Dashboard, Leads, Contas, Contatos, Oportunidades |
| Intelli | Intelli | Brain | IA (Agentes, Ferramentas, Politicas, Avaliacoes, Execucoes, Analytics) |
| Operac. | Operac. | Workflow | Vendas avancado (Propostas, Contratos, CPQ, Assinaturas, Faturamento, Conv. Intelligence, Revenue Ops), Atendimento, Commerce, Automacoes |
| Dados | Dados | Database | Dados e Analytics, Governanca, IT/ITSM, Integracoes |
| Analyt. | Analyt. | BarChart3 | Produtos, Territorios, Cadencias, Forecast, Dashboards, Relatorios, Auditoria |
| Config. | Config. | Settings | Administracao (Modulos, Permissoes, Seguranca, Campos Custom, Integracoes, IA, Observabilidade), Configuracoes, Portais |

---

## Detalhamento Tecnico

### 1. Novo componente `AppSidebar.tsx` (reescrita completa)

O componente sera reestruturado para renderizar dois paineis lado a lado:

**Estado interno:**
- `activeRailItem`: string que controla qual grupo-pai esta selecionado
- Determinacao automatica baseada na rota atual (`useLocation`)

**Estrutura JSX:**
```text
+-------------------+----------------------------+
| RAIL (72px)       | CONTENT PANEL (240px)      |
|                   |                            |
| [Logo]            | [Titulo do Modulo]         |
|                   | [Campo de Busca]           |
| [Icon] Princ.     |                            |
| [Icon] Intelli    | Grupo Label                |
| [Icon] Operac.    |   - Sub-item 1             |
| [Icon] Dados      |   - Sub-item 2 (ativo)     |
| [Icon] Analyt.    |   - Sub-item 3             |
| [Icon] Config.    |                            |
|                   | Grupo Label                |
| ----------        |   - Sub-item 4             |
| [Avatar]          |   - Sub-item 5             |
| [Sair]            |                            |
+-------------------+----------------------------+
```

**Rail Item:**
- Icone centralizado (24px) com peso `regular`, muda para `bold` quando ativo
- Label truncado abaixo do icone (10px, uppercase)
- Fundo escuro no estado ativo com indicador lateral vermelho (3px borda esquerda)
- Hover com fundo `sidebar-accent`

**Content Panel:**
- Header com titulo do modulo em fonte `Plus Jakarta Sans`, bold, 16px
- Campo de busca inline para filtrar sub-itens (funcionalidade local, sem API)
- Sub-itens organizados por grupo com labels de secao
- Item ativo marcado com badge vermelho ou fundo accent + borda esquerda vermelha
- Scroll vertical independente com `scrollbar-thin`

### 2. `AppLayout.tsx` (ajuste)

- Remover uso do `SidebarProvider`/`Sidebar` do shadcn (que gerencia expanded/collapsed)
- O novo sidebar sera um `<aside>` fixo com dois paineis, sem depender do sistema de collapsible do shadcn
- Largura total do sidebar: `72px (rail) + 240px (content) = 312px`
- O conteudo principal (`main`) ocupa o restante com `margin-left: 312px`

### 3. `AppTopbar.tsx` (ajuste menor)

- Remover o `SidebarTrigger` pois o novo sidebar nao possui toggle de collapse
- Manter GlobalSearch, NotificationCenter, QuickCreate e ThemeToggle

### 4. `src/index.css` (ajustes de estilo)

- Novas classes CSS para o rail e content panel
- Remover a classe `.sidebar-item-active::before` antiga
- Adicionar novas variantes para o rail-item ativo e o content-item ativo
- Estilo especifico para o campo de busca inline do content panel

### 5. Responsividade Mobile

- Em telas `< 768px`, o sidebar completo sera ocultado e substituido por um drawer (Sheet) acessivel via botao hamburger no topbar
- O drawer exibira a mesma estrutura de rail + content panel em layout vertical adaptado
- O botao hamburger sera adicionado ao `AppTopbar` condicionalmente

### 6. `sidebar.tsx` (componente UI)

- Manter o componente existente pois pode ser usado em outros contextos (portal, partner)
- O novo AppSidebar nao dependera mais dele diretamente

### 7. Deteccao de Rail Ativo pela Rota

Logica automatica que determina qual rail-item esta ativo baseado no `pathname`:

- `/dashboard`, `/leads`, `/accounts`, `/contacts`, `/opportunities` -> Principal
- `/ai/*` -> Intelli
- `/quotes`, `/contracts`, `/sales/*`, `/tickets`, `/service/*`, `/knowledge`, `/customer-success`, `/orders`, `/returns`, `/promotions`, `/automations` -> Operac.
- `/duplicates`, `/merge-wizard`, `/full-funnel`, `/attribution`, `/customer-360`, `/data-hub/*`, `/governance`, `/it/*`, `/integrations/*` -> Dados
- `/products`, `/territories`, `/cadences`, `/forecast`, `/dashboards`, `/reports`, `/audit-logs` -> Analyt.
- `/admin/*`, `/settings`, `/portal`, `/partner` -> Config.

### 8. Filtro de Busca Local no Content Panel

- Input controlado no topo do content panel
- Filtra os sub-itens visualmente em tempo real (case-insensitive)
- Icone de busca (MagnifyingGlass) como prefixo
- Placeholder: "Buscar..."

---

## Arquivos Modificados

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/components/layout/AppSidebar.tsx` | Reescrita | Novo componente dual-panel completo |
| `src/components/layout/AppLayout.tsx` | Modificacao | Remover SidebarProvider, usar layout fixo |
| `src/components/layout/AppTopbar.tsx` | Modificacao | Remover SidebarTrigger, adicionar hamburger mobile |
| `src/index.css` | Modificacao | Novas classes para rail e content panel |

---

## Preservacao de Funcionalidades

- **Module-awareness**: O hook `useModuleAccess` continuara sendo usado para filtrar secoes baseado nos modulos habilitados da organizacao
- **Autenticacao**: O `useAuth` continuara gerenciando perfil do usuario e logout
- **Navegacao ativa**: Indicador visual baseado em `useLocation` sera preservado
- **Icones Phosphor**: Todos os icones permanecem vindos de `@/components/icons`
- **Tema escuro/claro**: As variaveis CSS do sidebar permanecem funcionais
- **Portais**: As rotas /portal e /partner continuam com seus proprios layouts separados
