

# Otimizacao do Espaco e Distribuicao do Inbox Omnichannel

## Diagnostico

Analisando a imagem e o codigo, identifiquei os seguintes problemas:

1. O `AppLayout` aplica `p-6` (24px de padding em todos os lados) no `<main>`, que e somado ao `m-2` (8px) do container do Inbox, resultando em ~32px desperdicados em cada direcao
2. A altura `h-[calc(100vh-72px)]` nao contabiliza o padding do main, causando overflow ou espremimento
3. O header da lista de conversas empilha verticalmente: titulo + busca + tabs + filtros, consumindo ~140-150px antes de qualquer conversa aparecer
4. O header da conversa selecionada (InboxConversationHeader) ocupa espaco com padding excessivo
5. O painel de contexto tem espacamento interno demais

## Alteracoes Detalhadas

### 1. `src/pages/OmnichannelInbox.tsx` — Eliminar margens desperdicadas

- Remover `m-2` do container principal (o padding do main ja existe)
- Alterar altura de `h-[calc(100vh-72px)]` para `h-[calc(100vh-72px-48px)]` para contabilizar o padding do main (p-6 = 24px * 2 = 48px)
- **Alternativa melhor**: Aplicar margem negativa `-m-6` para que o Inbox ocupe toda a area do main, removendo o padding herdado, e usar `h-[calc(100vh-72px)]` sem margem extra
- Manter `rounded-2xl` mas com `m-0` e overflow hidden

### 2. `src/components/inbox/InboxConversationList.tsx` — Compactar header drasticamente

**Header — Combinar elementos em menos linhas:**
- Linha 1: Titulo "Inbox" + status do agente + refresh — tudo na mesma linha (ja esta)
- Linha 2: Campo de busca — manter mas reduzir para `h-6`
- Linha 3: Tabs de status — reduzir padding interno para `py-px`
- Linha 4: Filtros — combinar canal e atribuicao em uma unica linha mais compacta com `h-5`
- Reduzir `space-y-1.5` do header para `space-y-1`
- Reduzir padding do header de `p-2.5` para `p-2`

**Items de conversa — Mais compactos:**
- Reduzir padding de `px-2 py-1.5` para `px-2 py-1`
- Reduzir avatar de `h-7 w-7` para `h-6 w-6`
- AvatarFallback de `text-[10px]` para `text-[9px]`
- Gap entre avatar e conteudo de `gap-1.5` para `gap-1.5` (manter)
- Reducao do `space-y-px` para nenhum espacamento entre items (border visual via hover)
- Nome do contato de `text-xs` manter mas sem espacamento extra
- Preview de `text-[11px]` manter
- Status bar: remover `mt-0.5`, colocar inline com o preview

**Footer:**
- Reduzir `py-1.5` para `py-1`

### 3. `src/components/inbox/InboxConversationHeader.tsx` — Compactar

- Reduzir padding de `px-4 py-2` para `px-3 py-1.5`
- Avatar de `h-8 w-8` para `h-7 w-7`
- Gap de `gap-2.5` para `gap-2`
- Nome de `text-sm` manter
- Metadados (numero, email, conta) de `text-[10px]` manter
- Botoes Assumir/Resolver: manter `h-7` mas reduzir `px-3` para `px-2.5`

### 4. `src/components/inbox/InboxMessageThread.tsx` — Otimizar padding

- Padding de `px-4 py-3` para `px-5 py-2` (mais lateral, menos vertical)
- Date separator: `my-3` para `my-2`
- Consecutivos: `mt-3` para `mt-2` (entre grupos diferentes)

### 5. `src/components/inbox/InboxReplyBox.tsx` — Compactar

- Textarea `min-h-[72px]` para `min-h-[60px]`
- Padding do textarea container de `px-3 pt-2 pb-1` para `px-3 pt-1.5 pb-0.5`
- Toolbar de `px-3 pb-2` para `px-3 pb-1.5`

### 6. `src/components/inbox/InboxContextPanel.tsx` — Otimizar

- Header de `p-3` para `p-2.5`
- Tab content de `p-3 space-y-3` para `p-2.5 space-y-2.5`

## Impacto Estimado

- Ganho de ~48px verticais ao eliminar padding do main via margem negativa
- Ganho de ~20-30px no header da lista de conversas
- Ganho de ~5-8px por item de conversa (permitindo 1-2 conversas extras visiveis)
- Ganho de ~10px no header da conversa
- Ganho de ~15px na reply box
- No total, ~100-120px de espaco vertical recuperado

## Arquivos a Editar

| Arquivo | Alteracao Principal |
|---|---|
| `src/pages/OmnichannelInbox.tsx` | Margem negativa para ocupar area total do main |
| `src/components/inbox/InboxConversationList.tsx` | Header compactado, items menores |
| `src/components/inbox/InboxConversationHeader.tsx` | Padding reduzido |
| `src/components/inbox/InboxMessageThread.tsx` | Espacamento vertical otimizado |
| `src/components/inbox/InboxReplyBox.tsx` | Textarea e toolbar mais compactos |
| `src/components/inbox/InboxContextPanel.tsx` | Padding interno reduzido |

## Observacoes
- Nenhuma logica sera alterada
- A tecnica de margem negativa (`-m-6`) permite que o Inbox ocupe 100% do espaco disponivel sem alterar o AppLayout global
- Todos os demais modulos continuam com o padding normal do AppLayout

