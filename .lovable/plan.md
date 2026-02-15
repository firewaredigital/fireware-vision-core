
# Redesign Drastico do Design System — Modernizacao Visual Completa

## Objetivo
Transformar drasticamente o design visual de todos os componentes do sistema para alinhar com a estetica moderna, sofisticada e tecnologica das imagens de referencia, **mantendo a paleta de cores existente** (#FF0000 primario, #212427 dark, #F5F5F5 background) e o **layout do sidebar dual-panel** inalterado.

## Analise das Imagens de Referencia

As imagens apresentam um design system com as seguintes caracteristicas visuais marcantes:

1. **Cards com bordas ultra-arredondadas** (16-20px) e superficies limpas com sombras difusas
2. **Inputs com fundo solido** (cinza claro no light, dark no dark mode) em vez de bordas finas — estilo "filled input"
3. **Botoes com cantos completamente arredondados** (pill-shaped, border-radius ~999px) e peso visual forte
4. **Badges/Tags com formato pill** e cores vibrantes com fundo translucido
5. **Tabelas com linhas separadas, espacamento generoso** e avatares circulares integrados
6. **KPI Cards com icones coloridos** e indicadores de variacao (setas verde/vermelha)
7. **Tipografia com maior contraste** — numeros de KPIs muito grandes e boldos
8. **Dropdowns com fundo solido escuro** (no dark mode) e itens com destaque colorido
9. **Checkboxes e Switches com design arredondado e cores vivas**
10. **Graficos com bordas arredondadas** nas barras e estilo clean

## Plano de Implementacao Detalhado

### Fase 1 — CSS Variables e Foundation (index.css)

**Alteracoes nas CSS variables `:root`:**
- Aumentar `--radius` de `0.75rem` para `1rem` (16px) para cards mais arredondados
- Adicionar nova variavel `--radius-pill: 9999px` para botoes e badges pill
- Adicionar `--radius-input: 0.75rem` para inputs com bordas mais suaves
- Refinar `--shadow-elevation-1` com sombras mais difusas e suaves (estilo moderno)
- Adicionar `--shadow-card-hover` com elevacao mais dramatica para efeito de profundidade
- Alterar `--border` para um tom mais sutil (93% em vez de 90%) para bordas quase invisiveis
- Refinar tipografia global: ajustar `body` para `font-size: 14px` com `line-height: 1.6`

**Novas utility classes CSS:**
- `.glass-surface`: Background com `backdrop-filter: blur(12px)` e borda translucida
- `.gradient-subtle`: Gradiente sutil de fundo para cards de KPI
- `.text-gradient-primary`: Texto com gradiente vermelho para destaques
- `.animate-number-in`: Animacao de entrada para numeros de KPIs (contagem)

### Fase 2 — Componentes UI Base (shadcn)

**2.1 Button (`button.tsx`)**
- Variante `default`: border-radius `9999px` (pill), padding horizontal maior (`px-6`), peso de fonte `700`
- Variante `outline`: pill + borda mais fina (`1px`) + hover com background sutil
- Variante `ghost`: pill + transicao de fundo mais suave
- Nova variante `filled`: fundo cinza solido (como os botoes "Label" da imagem) com cor de destaque
- Aumentar altura padrao de `h-10` para `h-11` (44px)
- Adicionar transicao `transform` no hover com sutil `scale(1.02)`

**2.2 Input (`input.tsx`)**
- Trocar de `bg-background` + `border` para estilo "filled": `bg-muted` sem borda visivel
- Border-radius `12px` (rounded-xl)
- Altura `h-12` (48px) para maior presenca
- Placeholder com opacidade mais alta
- Focus: borda sutil primaria + sombra `ring` mais difusa
- Adicionar label flutuante via CSS (uppercase, 11px, tracking wide) — estilo "NAME*" da imagem

**2.3 Card (`card.tsx`)**
- Aumentar border-radius para `rounded-2xl` (16px)
- Remover borda visivel no light mode, usar apenas sombra como delimitador
- Sombra mais difusa e suave (`0 4px 24px -4px rgba(0,0,0,0.06)`)
- Hover com elevacao mais pronunciada e sutil `translateY(-2px)`
- Dark mode: fundo `hsl(216 5% 14%)` com borda `1px solid hsl(216 5% 20%)`

**2.4 Badge (`badge.tsx`)**
- Border-radius `9999px` (pill-shaped)
- Padding mais generoso `px-3 py-1`
- Font-size `11px` com `font-weight: 600`
- Novas variantes com cores de status: cada status com fundo translucido e texto colorido vibrante (como "Not Called" rosa, "Pending" amarelo, "Called" verde da imagem)

**2.5 Table (`table.tsx`)**
- Remover borda exterior do wrapper, usar apenas sombra
- `TableHead`: fundo `bg-muted/30` com texto uppercase `text-[11px]` e separador pontilhado entre colunas
- `TableRow`: altura maior `min-h-[64px]`, hover com `bg-accent/50` e transicao suave
- `TableCell`: padding `py-4 px-5` para mais respiro
- Adicionar borda arredondada no wrapper `rounded-2xl`

**2.6 Select/Dropdown (`select.tsx`)**
- Trigger com estilo filled (fundo solido) em vez de bordered
- Border-radius `12px`
- Content dropdown com `rounded-xl` e sombra elevation-3 mais pronunciada
- Items com `rounded-lg` e hover com fundo accent mais visivel
- Item selecionado com destaque colorido (fundo primario translucido)

**2.7 Tabs (`tabs.tsx`)**
- Remover borda inferior da lista
- `TabsTrigger` ativo: fundo solido `bg-primary text-white rounded-full` (pill) em vez de border-bottom
- Tabs inativos: `bg-transparent text-muted-foreground` com hover `bg-muted rounded-full`
- Espacamento entre tabs `gap-2`
- Transicao suave de fundo ao alternar

**2.8 Switch (`switch.tsx`)**
- Aumentar para `h-7 w-13` para maior presenca visual
- Thumb com `h-5.5 w-5.5`
- Checked state: cor primaria (#FF0000) com sombra glow sutil
- Unchecked: fundo mais escuro `bg-muted-foreground/20`

**2.9 Checkbox (`checkbox.tsx`)**
- Border-radius `6px` (mais arredondado)
- Tamanho `h-5 w-5` (maior)
- Checked: fundo primario com icone branco e sombra sutil
- Borda mais espessa `2px`

**2.10 Progress (`progress.tsx`)**
- Border-radius `9999px` (pill)
- Altura padrao `h-2.5` (mais fina e elegante)
- Indicador com gradiente sutil em vez de cor solida
- Fundo da track mais sutil `bg-muted/50`

**2.11 Dialog/Sheet (`dialog.tsx`, `sheet.tsx`)**
- Border-radius `24px` (ultra-arredondado)
- Sombra mais dramatica com camadas multiplas
- Overlay com blur mais forte `backdrop-blur-sm`

**2.12 Tooltip (`tooltip.tsx`)**
- Border-radius `12px`
- Fundo dark solido com sombra elevation-3
- Padding mais generoso

### Fase 3 — Componentes de Pagina

**3.1 Topbar (`AppTopbar.tsx`)**
- Remover borda inferior, usar apenas sombra ultra-sutil como separador
- Background com `backdrop-filter: blur(12px)` para efeito glass
- Altura aumentada para `h-[72px]` para mais respiro
- Botoes da topbar com estilo pill

**3.2 KPI Cards (Dashboard, ServiceDashboard, etc.)**
- Layout de KPI card com icone colorido em circulo a esquerda (fundo translucido do modulo)
- Numero principal com `text-3xl font-extrabold tracking-tight`
- Indicador de variacao com seta e cor (verde positivo, vermelho negativo) — estilo "+12.5%" da imagem
- Subtitulo em `text-xs text-muted-foreground uppercase tracking-wider`
- Animacao de entrada com `transform: translateY(8px)` e fade
- Adicionar borda esquerda colorida de 3px como accent visual

**3.3 Hero Banners (`ModuleHeroBanner.tsx`)**
- Border-radius `20px` (mais arredondado)
- Gradiente overlay mais sofisticado com camadas multiplas
- Tipografia do titulo com `text-4xl` e peso `800`
- Adicionar efeito de parallax sutil no hover

**3.4 Tabelas de Listagem (Leads, Contacts, etc.)**
- Integrar avatares circulares nas linhas (como na imagem "Smart Orders")
- Status badges com formato pill e cores vibrantes
- Adicionar coluna de selecao com checkbox estilizado
- Hover de linha com elevacao sutil e borda esquerda colorida

### Fase 4 — Estilos Globais Adicionais (index.css)

**4.1 Scrollbar redesign:**
- Thumb com `border-radius: 9999px` e `width: 5px`
- Cor mais sutil e aparecimento gradual no hover

**4.2 Selection highlight:**
- `::selection { background: hsl(0 100% 50% / 0.12); }`

**4.3 Focus rings:**
- Trocar ring padrao de `ring-2 ring-ring` para `ring-2 ring-primary/20` mais sutil

**4.4 Transicoes globais:**
- Adicionar `transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)` como padrao em elementos interativos

**4.5 Dark mode refinements:**
- Cards com borda `1px solid hsl(216 5% 20%)` mais visivel
- Inputs com fundo `hsl(216 5% 17%)` (mais claro que o card)
- Sombras com maior opacidade para profundidade

### Fase 5 — Animacoes e Micro-interacoes

- Cards: `hover:translateY(-2px)` com transicao `300ms ease`
- Botoes: `active:scale(0.97)` para feedback tatil
- Badges: `hover:shadow-sm` para leve elevacao
- KPI numbers: animacao de contagem usando CSS `@keyframes countUp`
- Page entrance: stagger animation nos cards de KPI (delay progressivo)

## Resumo dos Arquivos a Editar

| Arquivo | Tipo de Alteracao |
|---|---|
| `src/index.css` | CSS variables, utilities, scrollbar, selection, animacoes globais |
| `tailwind.config.ts` | Novos tokens de border-radius, sombras, keyframes |
| `src/components/ui/button.tsx` | Pill shape, tamanhos, variantes |
| `src/components/ui/input.tsx` | Filled style, tamanho maior |
| `src/components/ui/card.tsx` | Radius maior, sombra difusa, sem borda |
| `src/components/ui/badge.tsx` | Pill shape, novas variantes de cor |
| `src/components/ui/table.tsx` | Wrapper sem borda, spacing maior, rows mais altas |
| `src/components/ui/select.tsx` | Filled trigger, dropdown arredondado |
| `src/components/ui/tabs.tsx` | Pill tabs com fundo solido no ativo |
| `src/components/ui/switch.tsx` | Maior, glow no checked |
| `src/components/ui/checkbox.tsx` | Maior, mais arredondado |
| `src/components/ui/progress.tsx` | Pill, mais fina, gradiente |
| `src/components/ui/dialog.tsx` | Radius ultra-arredondado |
| `src/components/ui/sheet.tsx` | Radius ultra-arredondado |
| `src/components/ui/tooltip.tsx` | Radius maior, estilo dark |
| `src/components/ui/dropdown-menu.tsx` | Items arredondados, hover mais visivel |
| `src/components/layout/AppTopbar.tsx` | Glass effect, sem borda, pill buttons |
| `src/components/ModuleHeroBanner.tsx` | Radius maior, tipografia bolder |
| `src/pages/Dashboard.tsx` | KPI cards redesenhados com icones coloridos e variacao |
| `src/pages/Leads.tsx` | Tabela com avatares, badges pill |

## Observacoes

- O sidebar dual-panel (Rail 72px + Content Panel 240px) **nao sera alterado** em nenhum aspecto
- A paleta de cores (#FF0000, #212427, #F5F5F5, cores semanticas) **sera preservada integralmente**
- Todas as alteracoes sao puramente visuais/cosmeticas, sem mudanca de logica ou funcionalidade
- A abordagem prioriza a modificacao dos componentes base (shadcn) para que as mudancas se propaguem automaticamente para todas as paginas do sistema
