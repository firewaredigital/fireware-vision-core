

# Compactacao Global do Inbox Omnichannel — Reducao Drastica de Todos os Elementos

## Diagnostico
Analisando a imagem e o codigo atual, os elementos continuam excessivamente grandes em todos os paineis do Inbox. O problema nao esta apenas na lista de conversas, mas em **todos os componentes**: header da conversa, painel de contexto, thread de mensagens, reply box e o container principal. Os avatares, paddings, fontes e espacamentos estao todos acima do ideal para uma interface de atendimento de alta densidade.

## Alteracoes por Arquivo

### 1. `src/pages/OmnichannelInbox.tsx`
- Reduzir margem do container de `m-3` para `m-2` para ganhar espaco
- Empty state: reduzir icone central de `h-20 w-20` para `h-14 w-14`, icone interno de `h-10 w-10` para `h-6 w-6`
- Titulo de `text-lg` para `text-sm`, kbds de `px-2.5 py-1 text-[11px]` para `px-2 py-0.5 text-[10px]`

### 2. `src/components/inbox/InboxConversationList.tsx`
- Container: reduzir largura de `w-[340px]` para `w-[300px]`
- Header: reduzir padding de `p-3 space-y-2` para `p-2.5 space-y-1.5`
- Icone Inbox: de `p-1 rounded-lg` para `p-0.5 rounded-md`, icone de `h-3.5 w-3.5` para `h-3 w-3`
- Titulo: de `text-sm` para `text-xs`
- Status select: de `h-8 text-xs px-3` para `h-6 text-[10px] px-2`, dot de `h-2 w-2` para `h-1.5 w-1.5`
- Refresh button: de `h-8 w-8` para `h-6 w-6`, icone de `h-3.5 w-3.5` para `h-3 w-3`
- Busca: de `h-8 pl-9 text-xs` para `h-7 pl-8 text-[11px]`, icone de `h-3.5 w-3.5 left-3` para `h-3 w-3 left-2.5`
- Tabs de status: de `py-1 text-[11px]` para `py-0.5 text-[10px]`, badges de `h-3.5` para `h-3`
- Filtros: de `h-7 text-[11px]` para `h-6 text-[10px]`, gap de `gap-2` para `gap-1.5`
- Items de conversa: padding de `px-2.5 py-2` para `px-2 py-1.5`, gap de `gap-2` para `gap-1.5`
- Avatar: de `h-8 w-8` para `h-7 w-7`, ring de `ring-[1.5px]` para `ring-1`
- AvatarFallback: de `text-xs` para `text-[10px]`
- Channel overlay: de `p-[2px]` para `p-[1px]`, icones de `h-2.5 w-2.5` para `h-2 w-2`
- Nome contato: de `text-sm` para `text-xs`
- Timestamp: de `text-[10px]` para `text-[9px]`
- Preview mensagem: de `text-xs mt-0.5` para `text-[11px] mt-0`
- Status bar: de `mt-1 gap-1.5` para `mt-0.5 gap-1`, badges de `h-3.5 text-[8px]` para `h-3 text-[7px]`
- Footer: de `px-4 py-2` para `px-3 py-1.5`, texto de `text-[10px]` para `text-[9px]`
- Loading skeletons: de `h-8 w-8` para `h-7 w-7`, padding ajustado
- Empty state: icone de `h-10 w-10` para `h-8 w-8`, icone interno de `h-5 w-5` para `h-4 w-4`

### 3. `src/components/inbox/InboxConversationHeader.tsx`
- Padding: de `px-5 py-3.5` para `px-4 py-2`
- Avatar: de `h-10 w-10 ring-2` para `h-8 w-8 ring-[1.5px]`
- AvatarFallback: de `text-xs` para `text-[10px]`
- Gap entre avatar e info: de `gap-3.5` para `gap-2.5`
- Nome contato: de `text-base font-bold` para `text-sm font-semibold`
- Channel badge: de `px-2 py-0.5 text-[10px]` para `px-1.5 py-0 text-[9px]`, icone de `h-3 w-3` para `h-2.5 w-2.5`
- Priority badge: de `text-[10px] px-2` para `text-[9px] px-1.5`
- Metadados: de `text-xs mt-0.5` para `text-[10px] mt-0`
- Botoes Assumir/Resolver: de `h-8 text-xs px-4` para `h-7 text-[11px] px-3`, icones de `h-3.5 w-3.5` para `h-3 w-3`
- Botao menu: de `h-8 w-8` para `h-7 w-7`
- Channel icons no map: de `h-3 w-3` para `h-2.5 w-2.5`

### 4. `src/components/inbox/InboxMessageThread.tsx`
- Padding lateral: de `px-6 py-4` para `px-4 py-3`
- Date separator: de `my-5 px-4 py-1.5` para `my-3 px-3 py-1`, texto de `text-[11px]` para `text-[10px]`
- Avatar: de `h-8 w-8 ring-2` para `h-6 w-6 ring-[1.5px]`
- Spacer div: de `w-8` para `w-6`
- Max-width bolhas: de `max-w-[70%]` para `max-w-[75%]`
- Bolhas: de `px-4 py-3 text-sm` para `px-3 py-2 text-[13px]`
- Sender name: de `text-xs mb-1` para `text-[11px] mb-0.5`
- Badge agente/interno: de `text-[9px] h-3.5` para `text-[8px] h-3`
- Footer: de `mt-1` para `mt-0.5`
- Timestamp: de `text-[10px]` para `text-[9px]`
- Delivery label: de `text-[9px]` para `text-[8px]`
- Empty state: icone de `h-16 w-16` para `h-12 w-12`, icone interno de `h-8 w-8` para `h-5 w-5`
- Loading skeletons: de `h-8 w-8` para `h-6 w-6`, bolha de `h-16` para `h-12`
- Consecutivos: de `mt-4` para `mt-3`, de `mt-1` para `mt-0.5`
- Bot/system: icone de `h-3 w-3` para `h-2.5 w-2.5`
- AvatarFallback icones: de `h-3.5 w-3.5` para `h-3 w-3`

### 5. `src/components/inbox/InboxReplyBox.tsx`
- Textarea: de `min-h-[100px]` para `min-h-[72px]`
- Padding textarea container: de `px-4 pt-3 pb-1` para `px-3 pt-2 pb-1`
- Nota interna indicator: de `px-4 pt-3` para `px-3 pt-2`, icone de `h-3.5 w-3.5` para `h-3 w-3`
- Toolbar: de `px-4 pb-3` para `px-3 pb-2`
- Botoes toolbar: de `h-8 w-8` para `h-7 w-7`, icones de `h-4 w-4` e `h-3.5 w-3.5` para `h-3 w-3`
- Separator: de `h-5 mx-1.5` para `h-4 mx-1`
- Botao enviar: de `h-9 px-5` para `h-7 px-3 text-[11px]`, icone de `h-3.5 w-3.5` para `h-3 w-3`
- Kbd shortcut: de `px-1.5 py-0.5 text-[10px]` para `px-1 py-0 text-[9px]`
- Internal toggle com label: de `px-3` para `px-2`, texto de `text-xs` para `text-[10px]`

### 6. `src/components/inbox/InboxContextPanel.tsx`
- Largura: de `w-[320px]` para `w-[280px]`
- Header: de `p-4` para `p-3`, icone container de `p-1.5 rounded-xl` para `p-1 rounded-lg`, icone de `h-4 w-4` para `h-3.5 w-3.5`
- Titulo: de `text-sm` para `text-xs`
- TabsList: de `h-9` para `h-7`, tabs de `h-8 text-[10px]` para `h-6 text-[9px]`, icone de `h-3 w-3` para `h-2.5 w-2.5`
- Contact card: avatar de `h-12 w-12 text-sm` para `h-9 w-9 text-xs`
- Contact name: de `text-sm` para `text-xs`
- Email/phone icons: de `h-3 w-3` para `h-2.5 w-2.5`
- Button "Ver Contato": de `h-8 text-xs` para `h-7 text-[11px]`
- Account card: de `p-3` para `p-2`, icone de `h-3.5 w-3.5` para `h-3 w-3`, nome de `text-sm` para `text-xs`
- Button "Ver Conta": de `h-7 text-xs` para `h-6 text-[10px]`
- Details grid: de `text-xs` para `text-[11px]`, labels de `text-[11px]` para `text-[10px]`
- Section headings: manter `text-[11px]`
- Owner card: de `p-3` para `p-2`, avatar de `h-8 w-8 text-[10px]` para `h-6 w-6 text-[8px]`, name de `text-xs` para `text-[11px]`, email de `text-[10px]` para `text-[9px]`
- Tab content padding: de `p-4 space-y-4` para `p-3 space-y-3`
- History/deals items: de `p-3` para `p-2`, gaps e espacamentos reduzidos
- Opportunity amount: de `text-base` para `text-sm`
- Tags badges: de `text-[10px] px-2` para `text-[9px] px-1.5`

## Impacto Esperado
- Reducao estimada de ~30-40% no footprint vertical de cada item de conversa
- Ganho de ~60px laterais (20px lista + 40px contexto)
- Mais conversas visiveis simultaneamente
- Interface mais proxima de ferramentas profissionais de atendimento (Intercom, Zendesk)
- Todos os elementos proporcionalmente reduzidos mantendo legibilidade

## Arquivos a Editar
1. `src/pages/OmnichannelInbox.tsx`
2. `src/components/inbox/InboxConversationList.tsx`
3. `src/components/inbox/InboxConversationHeader.tsx`
4. `src/components/inbox/InboxMessageThread.tsx`
5. `src/components/inbox/InboxReplyBox.tsx`
6. `src/components/inbox/InboxContextPanel.tsx`

