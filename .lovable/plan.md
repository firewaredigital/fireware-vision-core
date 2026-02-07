

# Redesign Radical v3: Icones, Fontes e Identidade Visual Futurista

## Escopo da Mudanca

O sistema Fireware CRM utiliza **lucide-react** em **165 arquivos** (74 com imports diretos + 91 com uso indireto via componentes). A migracaoo sera completa: remover lucide-react por inteiro e substituir por **Phosphor Icons** (`@phosphor-icons/react`), uma biblioteca moderna com 9.072 icones em 6 pesos visuais (thin, light, regular, bold, fill, duotone).

Alem disso, a tipografia sera atualizada de fonte padrao do sistema para **Inter** (corpo) + **Plus Jakarta Sans** (headings/branding), ambas fontes modernas de alto padrao usadas por SaaS enterprise de referencia.

---

## Estrategia de Migracao de Icones

### Abordagem: Arquivo Centralizado de Mapeamento

Em vez de editar 165 arquivos manualmente trocando cada nome de icone, sera criado um **arquivo de mapeamento centralizado** que re-exporta icones Phosphor usando os mesmos nomes que o lucide-react usava. Assim, basta mudar o caminho do import em cada arquivo.

```text
ANTES (em cada arquivo):
  import { Plus, Search, Filter } from 'lucide-react';

DEPOIS (em cada arquivo):
  import { Plus, Search, Filter } from '@/components/icons';
```

O arquivo `src/components/icons.ts` contera o mapeamento completo de ~120 icones unicos, exportando componentes Phosphor com os nomes lucide.

### Peso Visual dos Icones

Todos os icones usarao o peso **"regular"** por padrao (equivalente ao stroke weight do lucide), com opcao de usar **"duotone"** para icones de destaque em KPI cards e dashboards, e **"bold"** para icones em estados ativos na sidebar.

---

## Etapas de Implementacao

### Etapa 1: Instalar Dependencias

Novas dependencias:
- `@phosphor-icons/react` (biblioteca de icones)
- `@fontsource/inter` (fonte principal do corpo)
- `@fontsource-variable/plus-jakarta-sans` (fonte display para headings)

### Etapa 2: Criar Arquivo de Mapeamento de Icones

Arquivo: `src/components/icons.ts`

Contera ~120 exports mapeando nomes lucide para equivalentes Phosphor:

| Lucide (atual) | Phosphor (novo) |
|---|---|
| LayoutDashboard | SquaresFour |
| Users | UsersThree |
| Building2 | Buildings |
| Target | Crosshair |
| FileText | FileText |
| Package | Package |
| Map | MapTrifold |
| Zap | Lightning |
| TrendingUp | TrendUp |
| BarChart3 | ChartBar |
| Settings | GearSix |
| LogOut | SignOut |
| ChevronDown | CaretDown |
| Flame | Fire |
| PieChart | ChartPie |
| ClipboardList | ClipboardText |
| Headphones | Headset |
| Ticket | Ticket |
| BookOpen | BookOpenText |
| FileSignature | FileDoc (ou PenNib) |
| Megaphone | Megaphone |
| Mail | Envelope |
| Filter | Funnel |
| Route | Path |
| Workflow | FlowArrow |
| Shield | ShieldCheck |
| Heart | Heart |
| ShoppingCart | ShoppingCart |
| RotateCcw | ArrowCounterClockwise |
| Tag | Tag |
| Server | HardDrives |
| AlertTriangle | Warning |
| GitBranch | GitBranch |
| Database | Database |
| Copy | CopySimple |
| Merge | GitMerge |
| Layers | Stack |
| Activity | Pulse |
| UserCircle | UserCircle |
| MessageSquare | ChatDots |
| Globe | GlobeSimple |
| Bot | Robot |
| Wrench | Wrench |
| Link | LinkSimple |
| Eye | Eye |
| Lock | Lock |
| Cpu | Cpu |
| Inbox | Tray |
| Radio | Broadcast |
| Sparkles | Sparkle |
| FileBarChart | ChartLine |
| Send | PaperPlaneTilt |
| SlidersHorizontal | SlidersHorizontal |
| Brain | Brain |
| Handshake | Handshake |
| DollarSign | CurrencyDollar |
| FolderOpen | FolderOpen |
| Fingerprint | Fingerprint |
| LayoutList | ListDashes |
| Plus | Plus |
| Moon | Moon |
| Sun | Sun |
| Monitor | Monitor |
| Search | MagnifyingGlass |
| User | User |
| X | X |
| Loader2 | SpinnerGap (com animacao CSS) |
| ArrowLeft | ArrowLeft |
| Save | FloppyDisk |
| Check | Check |
| CheckCheck | Checks |
| Archive | ArchiveBox |
| ExternalLink | ArrowSquareOut |
| Info | Info |
| CheckCircle | CheckCircle |
| XCircle | XCircle |
| MoreHorizontal | DotsThree |
| Calendar | CalendarBlank |
| ArrowUpDown | ArrowsDownUp |
| Download | DownloadSimple |
| Upload | UploadSimple |
| Edit | PencilSimple |
| Trash2 | Trash |
| ArrowRight | ArrowRight |
| RefreshCcw | ArrowsClockwise |
| AlertCircle | WarningCircle |
| Phone | Phone |
| Play | Play |
| Pause | Pause |
| ChevronUp | CaretUp |
| GripVertical | DotsSixVertical |
| List | List |
| LayoutGrid | SquaresFour |
| Building | Building |
| ArrowUpRight | ArrowUpRight |
| ArrowDownRight | ArrowDownRight |
| MessageCircle | ChatCircle |
| RefreshCw | ArrowClockwise |
| Smartphone | DeviceMobile |
| Ban | Prohibit |
| ShieldX | ShieldSlash |
| History | ClockCounterClockwise |
| FileCheck | FileCheck (ou FileDashed) |
| Code | Code |
| Gauge | Gauge |
| ThumbsUp | ThumbsUp |
| ThumbsDown | ThumbsDown |
| Timer | Timer |
| Clock | Clock |
| Home | House |
| Menu | ListBold |
| Bug | Bug |
| Linkedin | LinkedinLogo |
| CheckSquare | CheckSquare |
| EyeOff | EyeSlash |
| Award | Trophy |
| UserPlus | UserPlus |

Cada export sera feito como:
```typescript
export { Fire as Flame } from '@phosphor-icons/react';
export { Plus } from '@phosphor-icons/react';
export { MagnifyingGlass as Search } from '@phosphor-icons/react';
```

### Etapa 3: Migrar Todos os 74 Arquivos com Imports Diretos

Trocar o import path em cada arquivo:

**Arquivos da Sidebar e Layout (4 arquivos):**
- `src/components/layout/AppSidebar.tsx`
- `src/components/layout/AppTopbar.tsx`
- `src/pages/portal/PortalLayout.tsx`
- `src/pages/partner/PartnerLayout.tsx`

**Paginas de Vendas (12 arquivos):**
- `src/pages/Leads.tsx`, `src/pages/LeadForm.tsx`, `src/pages/LeadDetail.tsx`
- `src/pages/Accounts.tsx`, `src/pages/AccountForm.tsx`, `src/pages/AccountDetail.tsx`
- `src/pages/Contacts.tsx`, `src/pages/ContactForm.tsx`, `src/pages/ContactDetail.tsx`
- `src/pages/Opportunities.tsx`, `src/pages/OpportunityForm.tsx`, `src/pages/OpportunityDetail.tsx`

**Paginas de Propostas, Contratos e Commerce (12 arquivos):**
- `src/pages/Quotes.tsx`, `src/pages/QuoteForm.tsx`, `src/pages/QuoteDetail.tsx`
- `src/pages/Contracts.tsx`, `src/pages/ContractForm.tsx`, `src/pages/ContractDetail.tsx`
- `src/pages/Orders.tsx`, `src/pages/OrderForm.tsx`, `src/pages/OrderDetail.tsx`
- `src/pages/Returns.tsx`, `src/pages/Promotions.tsx`, `src/pages/PromotionForm.tsx`

**Paginas de Service (12 arquivos):**
- `src/pages/ServiceDashboard.tsx`, `src/pages/Tickets.tsx`, `src/pages/TicketForm.tsx`, `src/pages/TicketDetail.tsx`
- `src/pages/service/WhatsAppAdmin.tsx`, `src/pages/service/ChatWidgetsAdmin.tsx`
- `src/pages/service/QADashboard.tsx`, `src/pages/service/ServiceAnalytics.tsx`
- `src/pages/service/ServiceQueues.tsx`, `src/pages/service/SocialInbox.tsx`
- `src/pages/service/VoiceAdmin.tsx`, `src/pages/Knowledge.tsx`

**Paginas de Marketing (8 arquivos):**
- `src/pages/Marketing.tsx`, `src/pages/CampaignForm.tsx`
- `src/pages/marketing/EmailTemplateBuilder.tsx`, `src/pages/marketing/EmailTemplates.tsx`
- `src/pages/marketing/MarketingIntelligence.tsx`, `src/pages/marketing/MarketingPersonalization.tsx`
- `src/pages/marketing/MarketingPreferenceCenter.tsx`, `src/pages/marketing/MarketingProviders.tsx`

**Paginas de Admin, AI, Data, IT (20+ arquivos):**
- `src/pages/admin/PlatformModules.tsx`, `src/pages/admin/PlatformPermissions.tsx`
- `src/pages/admin/PlatformSecurity.tsx`, `src/pages/admin/PlatformIntegrations.tsx`
- `src/pages/admin/PlatformObservability.tsx`, `src/pages/admin/PlatformAI.tsx`
- `src/pages/admin/CustomFieldsAdmin.tsx`
- `src/pages/ai/AIAgents.tsx`, `src/pages/ai/AITools.tsx`, `src/pages/ai/AIPolicies.tsx`
- `src/pages/ai/AIEvals.tsx`, `src/pages/ai/AIRuns.tsx`, `src/pages/ai/AIAnalytics.tsx`
- `src/pages/ai/AIAgentDetail.tsx`, `src/pages/ai/AIAgentForm.tsx`, `src/pages/ai/AIAgentPlayground.tsx`
- `src/pages/datahub/DataSources.tsx`, `src/pages/datahub/GoldenRecords.tsx`
- `src/pages/datahub/EventSchemas.tsx`, `src/pages/datahub/ActivationJobs.tsx`
- `src/pages/datahub/GoldenRecordDetail.tsx`
- `src/pages/ITDashboard.tsx`, `src/pages/ITIncidents.tsx`, `src/pages/ITIncidentForm.tsx`
- `src/pages/ITIncidentDetail.tsx`, `src/pages/ITChanges.tsx`, `src/pages/ITChangeForm.tsx`
- `src/pages/CMDB.tsx`, `src/pages/ITAssets.tsx`
- `src/pages/integrations/*` (5 arquivos)

**Componentes compartilhados (15 arquivos):**
- `src/components/GlobalSearch.tsx`
- `src/components/NotificationCenter.tsx`
- `src/components/Timeline.tsx`
- `src/components/ActivitiesWidget.tsx`
- `src/components/AttachmentsWidget.tsx`
- `src/components/NotesWidget.tsx`
- `src/components/ChangeHistory.tsx`
- `src/components/StaleDealAlerts.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/components/CSVImportDialog.tsx`
- `src/components/LeadConversionWizard.tsx`
- `src/components/LeadRoutingRules.tsx`
- `src/components/ApprovalRequestDialog.tsx`
- `src/components/CustomFieldsRenderer.tsx`
- `src/components/guards/AuthGuard.tsx`, `src/components/guards/ModuleGuard.tsx`

**Paginas adicionais:**
- `src/pages/Dashboard.tsx`, `src/pages/Auth.tsx`, `src/pages/Settings.tsx`
- `src/pages/Products.tsx`, `src/pages/ProductDetail.tsx`, `src/pages/ProductForm.tsx`
- `src/pages/Forecast.tsx`, `src/pages/Territories.tsx`, `src/pages/Cadences.tsx`
- `src/pages/Duplicates.tsx`, `src/pages/MergeWizard.tsx`, `src/pages/FullFunnel.tsx`
- `src/pages/AttributionDashboard.tsx`, `src/pages/Customer360.tsx`
- `src/pages/CustomerSuccess.tsx`, `src/pages/Governance.tsx`
- `src/pages/Automations.tsx`, `src/pages/WorkflowBuilder.tsx`
- `src/pages/DashboardBuilder.tsx`, `src/pages/Dashboards.tsx`
- `src/pages/Reports.tsx`, `src/pages/AuditLogs.tsx`
- `src/pages/Notifications.tsx`, `src/pages/OmnichannelInbox.tsx`
- `src/pages/LGPDRequestForm.tsx`, `src/pages/ArticleDetail.tsx`, `src/pages/ArticleForm.tsx`
- `src/pages/SegmentForm.tsx`, `src/pages/JourneyBuilder.tsx`
- `src/pages/CannedResponses.tsx`, `src/pages/NotFound.tsx`
- `src/pages/sales/*` (5 arquivos)
- `src/pages/portal/*` (10 arquivos)
- `src/pages/partner/*` (6 arquivos)
- `src/pages/marketing/CampaignABTest.tsx`
- Componentes de service: `TicketStatusBadge.tsx`, `TicketPriorityBadge.tsx`, `TicketMessages.tsx`, etc.
- Componentes de customer360: 6 arquivos
- Componentes de inbox: 5 arquivos

### Etapa 4: Configurar Fontes

**index.html** - Adicionar preconnect para Google Fonts e links das fontes Inter e Plus Jakarta Sans.

**index.css** - Adicionar `font-family` com Inter como fonte principal e Plus Jakarta Sans para headings:
```css
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
h1, h2, h3, h4, h5, h6 {
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
}
```

### Etapa 5: Refinamentos Visuais de CSS

Ajustes adicionais no design system:

1. **Spacing e tipografia refinados** nos headings das paginas
2. **Icones com peso duotone** nos KPI cards do Dashboard para efeito visual diferenciado
3. **Animacao do Loader** - O Phosphor `SpinnerGap` precisa da classe `animate-spin` aplicada
4. **Transicoes mais suaves** nos hovers de icones (opacity transitions)

### Etapa 6: Remover lucide-react do package.json

Apos a migracao completa de todos os arquivos, remover `lucide-react` das dependencias do projeto, garantindo que nenhum arquivo importe da biblioteca antiga.

---

## Ordenacao de Execucao

Devido ao volume massivo de 74+ arquivos, a implementacao sera dividida em lotes:

**Lote 1 (Fundacao):**
1. Instalar dependencias (`@phosphor-icons/react`, fontes)
2. Criar `src/components/icons.ts` com mapeamento completo
3. Atualizar `index.html` com fontes
4. Atualizar `index.css` com tipografia

**Lote 2 (Layout e Core):**
5. Migrar `AppSidebar.tsx`, `AppTopbar.tsx`, `AppLayout.tsx`
6. Migrar `GlobalSearch.tsx`, `NotificationCenter.tsx`
7. Migrar `Auth.tsx`, `Dashboard.tsx`
8. Migrar guards (AuthGuard, ModuleGuard)

**Lote 3 (Paginas de Vendas):**
9. Migrar todas as paginas de Leads, Accounts, Contacts, Opportunities
10. Migrar Quotes, Contracts, Products

**Lote 4 (Service e Marketing):**
11. Migrar paginas de Service (WhatsApp, Tickets, etc.)
12. Migrar paginas de Marketing

**Lote 5 (Admin, AI, Data, IT):**
13. Migrar paginas Admin
14. Migrar paginas AI
15. Migrar paginas DataHub, IT, Integracoes

**Lote 6 (Componentes e Restantes):**
16. Migrar componentes compartilhados (Timeline, Notes, etc.)
17. Migrar paginas Portal e Partner
18. Migrar paginas restantes (Forecast, Settings, etc.)
19. Remover `lucide-react` do package.json

---

## Impacto Visual Esperado

- **Icones Phosphor** tem linhas mais finas e limpas que lucide, com geometria mais precisa
- **Peso duotone** nos dashboards cria um efeito visual bi-cromático moderno
- **Inter** como fonte principal entrega legibilidade excepcional em interfaces densas
- **Plus Jakarta Sans** nos headings adiciona personalidade com suas formas geometricas arredondadas
- O resultado visual sera significativamente mais moderno e futurista que o design atual

