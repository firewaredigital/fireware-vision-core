
# Redesign Completo do Inbox Omnichannel — Estetica de App de Atendimento Moderno

## Objetivo
Transformar o Inbox Omnichannel em uma interface de nivel profissional inspirada em ferramentas como Intercom, Zendesk e Front, com estetica moderna, micro-interacoes sofisticadas e experiencia de uso fluida.

## Componentes a Redesenhar

### 1. OmnichannelInbox.tsx — Layout Principal
**Alteracoes:**
- Substituir `h-[calc(100vh-4rem)]` por `h-[calc(100vh-72px)]` para alinhar com a nova topbar
- Adicionar `rounded-2xl overflow-hidden shadow-elevation-2 m-3` no container principal para criar um "app-within-app" com bordas arredondadas e margem
- O empty state central (quando nenhuma conversa esta selecionada) recebera uma ilustracao mais rica: icone maior com gradiente, atalhos de teclado estilizados com `kbd` tags em formato pill, e animacao de entrada fade-in
- Remover bordas duras entre paineis, usar sombras sutis e `bg-background` vs `bg-card` para diferenciar zonas

### 2. InboxConversationList.tsx — Painel Esquerdo (Lista de Conversas)
**Alteracoes no Header:**
- Largura aumentada de `w-80` para `w-[340px]` para mais respiro
- Remover `border-r`, usar sombra lateral `shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)]`
- Header com fundo `bg-card` e padding `p-4` mais generoso
- Titulo "Inbox" com `text-lg font-bold` e icone com fundo circular primario translucido (`bg-primary/10 p-1.5 rounded-xl`)
- Status do agente: indicador de status com animacao `pulse` no dot verde, select com bordas pill e fundo muted

**Alteracoes na Busca:**
- Input de busca com estilo glass: `bg-muted/50 backdrop-blur-sm border-0 rounded-xl h-10`
- Icone de busca com cor mais forte
- Placeholder com texto mais descritivo

**Alteracoes nas Tabs de Status:**
- Tabs pill-shaped com contadores coloridos
- Tab ativa com fundo `bg-primary text-white` pill
- Badge de contagem com formato circular e animacao de pulse quando > 0

**Alteracoes nos Filtros:**
- Selects de canal e atribuicao com formato pill menor (`h-8 rounded-full`)
- Fundo `bg-muted/50` e borda transparente
- Layout em flex com gap maior

**Alteracoes nos Itens de Conversa:**
- Cada item com `rounded-xl mx-2 my-1` em vez de `divide-y` (cards separados ao inves de lista dividida)
- Item selecionado: `bg-primary/8 border-l-3 border-l-primary shadow-sm` com transicao suave
- Item com mensagens nao lidas: dot de notificacao animado com `animate-pulse` e fundo `bg-primary/5`
- Avatar com borda colorida por canal (verde para WhatsApp, azul para email, etc.)
- Overlay de icone de canal no avatar com fundo branco e sombra micro
- Nome do contato com `text-sm font-semibold` para nao lidos, `font-medium` para lidos
- Preview da mensagem com `line-clamp-1` e tipografia `text-xs text-muted-foreground`
- Timestamp com formato relativo mais curto
- Status dot com cores vibrantes e label em texto ao lado
- Badge de prioridade critica com animacao `animate-pulse` e fundo vermelho translucido
- Hover com `bg-accent/30` e sutil `translateX(2px)` para feedback direcional
- Transicao `transition-all duration-200` em todos os estados

**Alteracoes no Footer:**
- Fundo `bg-muted/30` com bordas arredondadas superiores
- Contador de SLA violado com cor vermelha e icone de alerta

### 3. InboxConversationHeader.tsx — Header da Conversa
**Alteracoes:**
- Background com `bg-card/80 backdrop-blur-xl` (efeito glass)
- Remover `border-b`, usar `shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)]`
- Altura aumentada para `py-3.5 px-5` para mais respiro
- Avatar aumentado para `h-10 w-10` com ring colorido por prioridade (vermelho para critica, laranja para alta)
- Nome do contato com `text-base font-bold`
- Badges de canal e prioridade com formato pill, icones dentro, e cores vibrantes com fundo translucido
- Badge de canal com cor especifica: WhatsApp (`bg-green-100 text-green-700`), Email (`bg-blue-100 text-blue-700`), Chat (`bg-purple-100 text-purple-700`)
- Metadados (numero, email, conta) com separadores estilizados (dot com cor muted)
- SLA Countdown com destaque visual maior: se < 30min, fundo pulsante vermelho/laranja
- Botoes de acao "Assumir" e "Resolver" com formato pill e sombras
- Botao "Assumir" com gradiente primario e icone animado
- Botao "Resolver" com borda verde e hover preenchido
- Botao de menu (...) com `rounded-full bg-muted/50 hover:bg-muted`

### 4. InboxMessageThread.tsx — Thread de Mensagens
**Alteracoes no Layout:**
- Fundo com gradiente sutil: `bg-gradient-to-b from-muted/20 to-background` para profundidade
- Padding lateral `px-6` para mais respiro
- Scrollbar estilizada ultra-fina (3px) com cor sutil

**Alteracoes no Separador de Data:**
- Formato pill: `bg-muted/80 rounded-full px-4 py-1.5 shadow-sm`
- Tipografia `text-[11px] font-semibold tracking-wide uppercase` com cor `text-muted-foreground/80`

**Alteracoes nas Bolhas de Mensagem:**
- Bolha do agente (usuario atual): `bg-primary text-white rounded-2xl rounded-br-md` com sombra `shadow-sm`
- Bolha do cliente: `bg-card border border-border/50 rounded-2xl rounded-bl-md shadow-sm`
- Bolha do bot: `bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 rounded-2xl rounded-bl-md`
- Nota interna: `bg-amber-50/80 border border-amber-200/50 rounded-2xl rounded-br-md` com icone de cadeado
- Mensagem de sistema: `bg-muted/50 rounded-full px-5 py-2 shadow-none` formato pill central
- Padding das bolhas `px-4 py-3` para mais conforto
- Maxima largura `max-w-[70%]` para manter proporcao elegante
- Animacao de entrada: `animate-fade-in` com sutil `translateY(4px)` nas novas mensagens

**Alteracoes nos Avatares:**
- Avatar `h-8 w-8` com ring de 2px colorido por tipo (primario para agente, muted para cliente, purple para bot)
- Fallback com gradiente de fundo em vez de cor solida

**Alteracoes no Footer da Mensagem:**
- Timestamp sempre visivel (sem `opacity-0 group-hover`) mas com opacidade `opacity-60` constante
- Icones de delivery status com cores mais vibrantes: read com `text-blue-500`, delivered com `text-green-500`
- Adicionar label textual micro ao lado do icone: "Lido", "Entregue", etc.

**Alteracoes nos Anexos:**
- Card de anexo com `rounded-xl bg-card/80 backdrop-blur-sm border shadow-sm px-3 py-2`
- Icone de arquivo com cor por tipo (PDF vermelho, imagem azul, etc.)
- Hover com `shadow-md` e escala sutil

### 5. InboxReplyBox.tsx — Caixa de Resposta
**Alteracoes:**
- Container com `rounded-t-2xl` (cantos superiores arredondados) e `shadow-[0_-2px_12px_-4px_rgba(0,0,0,0.08)]` (sombra para cima)
- Remover `border-t`, usar sombra como separador
- Padding `p-4` mais generoso
- Nota interna: fundo `bg-amber-50/30` com borda esquerda `border-l-3 border-l-amber-400` em vez de mudar todo o background
- Indicador de nota interna com banner animado `animate-fade-in` e icone de cadeado

**Alteracoes no Textarea:**
- Textarea com `min-h-[100px]` e `text-sm leading-relaxed`
- Placeholder com estilo mais suave
- Borda arredondada `rounded-xl` com fundo `bg-muted/30` sutil ao receber foco

**Alteracoes na Toolbar:**
- Botoes de formatacao com `rounded-lg` e agrupados visualmente com separador vertical mais sutil
- Botao de resposta rapida com icone `Zap` (raio) em vez de `MessageSquare` para diferenciar
- Botao de nota interna com toggle visual claro: quando ativo, fundo `bg-amber-100` pill com label "Interno"
- Botao de enviar: maior (`h-9 px-5`), pill-shaped, com icone animado de envio (sutil rotacao)
- Botao de envio nota interna: cor amber com icone de cadeado
- Shortcut indicator `Ctrl+Enter` com estilo kbd: `bg-muted rounded-md px-1.5 py-0.5 text-[10px] font-mono border`

### 6. InboxContextPanel.tsx — Painel Lateral de Contexto
**Alteracoes:**
- Largura aumentada de `w-72` para `w-[320px]`
- Remover `border-l`, usar sombra esquerda `shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.06)]`
- Header com titulo "Contexto 360" e icone com fundo primario translucido
- Tabs com estilo pill: tab ativa com `bg-primary text-white rounded-full`

**Alteracoes no Tab Contato:**
- Card de contato no topo com avatar grande (`h-12 w-12`), nome em `font-bold`, email/telefone com icones coloridos
- Botao "Ver Contato" com estilo outline pill
- Secao de detalhes com grid estilizado: labels em `text-[11px] uppercase tracking-wider text-muted-foreground`
- Valores com `font-semibold`
- Card de proprietario com avatar e info agrupados com fundo `bg-muted/50 rounded-xl p-3`
- Tags com formato pill e cores variadas (hash para cor baseada no texto)

**Alteracoes no Tab Historico:**
- Cards de tickets/conversas com `rounded-xl border-0 bg-muted/50 p-3` em vez de `border rounded`
- Status dot maior e com label visivel
- Hover com `bg-accent/50 shadow-sm` e sutil elevacao
- Separadores visuais com titulo de secao em `uppercase tracking-wider` com linha decorativa

**Alteracoes no Tab Negocios:**
- Cards de oportunidade com barra de progresso pill colorida
- Valor monetario com `font-bold text-base` para destaque
- Badge de estagio com cores por fase do pipeline

## Resumo dos Arquivos a Editar

| Arquivo | Alteracao |
|---|---|
| `src/pages/OmnichannelInbox.tsx` | Layout container, empty state, margens/sombras |
| `src/components/inbox/InboxConversationList.tsx` | Largura, header, busca, tabs, items, footer |
| `src/components/inbox/InboxConversationHeader.tsx` | Glass effect, badges coloridos, botoes pill |
| `src/components/inbox/InboxMessageThread.tsx` | Bolhas redesenhadas, separadores pill, animacoes |
| `src/components/inbox/InboxReplyBox.tsx` | Container arredondado, toolbar moderna, botao envio |
| `src/components/inbox/InboxContextPanel.tsx` | Largura, tabs pill, cards modernos, detalhes |

## Observacoes
- Nenhuma logica de negocio, hook ou funcionalidade sera alterada
- Todas as mudancas sao puramente visuais e de estilizacao CSS/Tailwind
- A paleta de cores existente sera mantida integralmente
- O sidebar dual-panel permanece inalterado
- As alteracoes utilizam os tokens de design system ja existentes (elevation, pill, radius)
