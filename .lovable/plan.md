

# Otimizacao da Densidade Visual da Lista de Conversas — Inbox Omnichannel

## Problema Identificado
A barra de conversas (`InboxConversationList`) ocupa `340px` de largura e possui elementos com tamanhos excessivos que reduzem a quantidade de conversas visiveis simultaneamente. O header com busca, tabs e filtros consome muito espaco vertical, e cada item de conversa tem padding e avatares grandes demais, resultando em baixa densidade informacional.

## Alteracoes Detalhadas

### Arquivo: `src/components/inbox/InboxConversationList.tsx`

**1. Header — Compactacao vertical**
- Reduzir padding do container header de `p-4 space-y-3` para `p-3 space-y-2`
- Titulo "Inbox": reduzir de `text-lg` para `text-sm`, icone de `h-4.5 w-4.5` para `h-3.5 w-3.5`, container do icone de `p-1.5 rounded-xl` para `p-1 rounded-lg`
- Select de status do agente: manter `h-8` (ja compacto)
- Botao refresh: manter `h-8 w-8`

**2. Campo de Busca — Altura reduzida**
- Input de busca: reduzir `h-10` para `h-8`, font de `text-sm` para `text-xs`
- Icone de busca: reduzir de `h-4 w-4` para `h-3.5 w-3.5`

**3. Tabs de Status — Mais compactas**
- Reduzir `py-1.5` para `py-1` nos botoes de tab
- Manter `text-[11px]` (ja pequeno)
- Reduzir badge de contagem de `h-4 min-w-[16px]` para `h-3.5 min-w-[14px]` com `text-[8px]`

**4. Filtros de Canal/Atribuicao — Mais finos**
- Reduzir `h-8` para `h-7` nos selects de filtro
- Manter `text-[11px]`

**5. Itens de Conversa — Compactacao significativa (maior impacto)**
- Padding de cada item: reduzir de `p-3` para `px-2.5 py-2`
- Avatar: reduzir de `h-10 w-10` para `h-8 w-8`
- `ring-2` do avatar para `ring-[1.5px]`
- Icone de canal overlay: reduzir `h-3 w-3` para `h-2.5 w-2.5` nos icones do mapa `channelIcons`, e o container overlay de `p-[3px]` para `p-[2px]`
- Nome do contato: manter `text-sm` mas reduzir gap entre avatar e conteudo de `gap-2.5` para `gap-2`
- Preview da mensagem: manter `text-xs`
- Barra de status/badges: reduzir `mt-1.5` para `mt-1`, dot de status de `h-1.5 w-1.5` para `h-1 w-1`
- Badge de unread: reduzir de `h-4 min-w-[16px] px-1 text-[9px]` para `h-3.5 min-w-[14px] px-0.5 text-[8px]`
- Badges de prioridade: reduzir `h-4 px-1.5 text-[9px]` para `h-3.5 px-1 text-[8px]`
- Icone SLA breached: reduzir `h-3 w-3` para `h-2.5 w-2.5`
- Espacamento entre items: reduzir `space-y-1` para `space-y-0.5`

**6. Skeletons de loading — Alinhamento**
- Reduzir skeleton de avatar de `h-10 w-10` para `h-8 w-8`
- Reduzir padding de `p-3` para `px-2.5 py-2`

**7. Empty state — Compactacao**
- Reduzir icone de empty state de `h-14 w-14` para `h-10 w-10` e icone interno de `h-7 w-7` para `h-5 w-5`
- Padding de `p-8` para `p-6`

**8. Footer — Manter compacto**
- Reduzir `py-2.5` para `py-2`

### Arquivo: `src/pages/OmnichannelInbox.tsx`
- Nenhuma alteracao necessaria (o layout principal ja esta correto)

## Impacto Estimado
- Cada item de conversa passara de ~72px de altura para ~56px, permitindo visualizar aproximadamente 25-30% mais conversas simultaneamente
- O header compactado libera ~20px adicionais de espaco vertical para a lista
- A experiencia visual permanece moderna e legivel, apenas mais densa

## Observacoes
- Nenhuma logica sera alterada, apenas classes CSS/Tailwind
- A paleta de cores e o design system permanecem intactos
- Apenas 1 arquivo sera editado: `src/components/inbox/InboxConversationList.tsx`

