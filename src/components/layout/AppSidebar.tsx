import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  FileText,
  Package,
  Map,
  Zap,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Flame,
  PieChart,
  ClipboardList,
  Headphones,
  Ticket,
  BookOpen,
  FileSignature,
  Megaphone,
  Mail,
  Filter,
  Route,
  Workflow,
  Shield,
  Heart,
  ShoppingCart,
  RotateCcw,
  Tag,
  Server,
  AlertTriangle,
  GitBranch,
  Database,
  Copy,
  Merge,
  Layers,
  Activity,
  UserCircle,
  MessageSquare,
  Globe,
  Bot,
  Wrench,
  Link,
  Eye,
  Lock,
  Cpu,
  Inbox,
  Radio,
  Sparkles,
  FileBarChart,
  Send,
  SlidersHorizontal,
  Brain,
  Handshake,
  DollarSign,
  FolderOpen,
  Fingerprint,
  LayoutList,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useModuleAccess, type ModuleKey } from '@/hooks/useModuleAccess';
import { cn } from '@/lib/utils';

// --- Navigation item definitions ---

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface NavSection {
  key: string;
  label: string;
  moduleKey?: ModuleKey;
  items: NavItem[];
  defaultOpen?: boolean;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
];

const NAV_SECTIONS: NavSection[] = [
  {
    key: 'sales',
    label: 'Vendas',
    moduleKey: 'sales',
    items: [
      { title: 'Leads', url: '/leads', icon: Target },
      { title: 'Contas', url: '/accounts', icon: Building2 },
      { title: 'Contatos', url: '/contacts', icon: Users },
      { title: 'Oportunidades', url: '/opportunities', icon: TrendingUp },
      { title: 'Propostas', url: '/quotes', icon: FileText },
      { title: 'Contratos', url: '/contracts', icon: FileSignature },
      { title: 'CPQ', url: '/sales/cpq', icon: Settings },
      { title: 'Assinaturas', url: '/sales/subscriptions', icon: RotateCcw },
      { title: 'Faturamento', url: '/sales/billing', icon: DollarSign },
      { title: 'Conv. Intelligence', url: '/sales/conversation-intelligence', icon: Radio },
      { title: 'Revenue Ops', url: '/sales/revenue-ops', icon: BarChart3 },
    ],
    defaultOpen: true,
  },
  {
    key: 'service',
    label: 'Atendimento',
    moduleKey: 'service',
    items: [
      { title: 'Dashboard de Service', url: '/service', icon: Headphones },
      { title: 'Inbox Omnichannel', url: '/service/inbox', icon: Inbox },
      { title: 'Filas', url: '/service/queues', icon: Layers },
      { title: 'Qualidade & NPS', url: '/service/qa', icon: ClipboardList },
      { title: 'Social Inbox', url: '/service/social', icon: Globe },
      { title: 'Analytics', url: '/service/analytics', icon: FileBarChart },
      { title: 'WhatsApp', url: '/service/whatsapp', icon: MessageSquare },
      { title: 'Chat Widgets', url: '/service/chat-widgets', icon: Radio },
      { title: 'Telefonia', url: '/service/voice', icon: Headphones },
      { title: 'Tickets', url: '/tickets', icon: Ticket },
      { title: 'Base de Conhecimento', url: '/knowledge', icon: BookOpen },
      { title: 'Customer Success', url: '/customer-success', icon: Heart },
    ],
    defaultOpen: true,
  },
  {
    key: 'marketing',
    label: 'Marketing',
    moduleKey: 'marketing',
    items: [
      { title: 'Dashboard Marketing', url: '/marketing', icon: Megaphone },
      { title: 'Campanhas', url: '/marketing/campaigns', icon: Mail },
      { title: 'Segmentos', url: '/marketing/segments', icon: Filter },
      { title: 'Jornadas', url: '/marketing/journeys', icon: Route },
      { title: 'Provedores', url: '/marketing/providers', icon: Send },
      { title: 'Preferências', url: '/marketing/preference-center', icon: SlidersHorizontal },
      { title: 'Personalização', url: '/marketing/personalization', icon: Sparkles },
      { title: 'Intelligence', url: '/marketing/intelligence', icon: Brain },
      { title: 'Templates de Email', url: '/marketing/email-templates', icon: Mail },
    ],
    defaultOpen: true,
  },
  {
    key: 'commerce',
    label: 'Commerce',
    moduleKey: 'commerce',
    items: [
      { title: 'Pedidos', url: '/orders', icon: ShoppingCart },
      { title: 'Devoluções', url: '/returns', icon: RotateCcw },
      { title: 'Promoções', url: '/promotions', icon: Tag },
    ],
    defaultOpen: true,
  },
  {
    key: 'automations',
    label: 'Automações',
    moduleKey: 'automations',
    items: [
      { title: 'Workflows', url: '/automations', icon: Workflow },
    ],
    defaultOpen: true,
  },
  {
    key: 'governance',
    label: 'Governança',
    moduleKey: 'governance',
    items: [
      { title: 'Governança', url: '/governance', icon: Shield },
    ],
    defaultOpen: true,
  },
  {
    key: 'itsm',
    label: 'TI / ITSM',
    moduleKey: 'itsm',
    items: [
      { title: 'Dashboard IT', url: '/it', icon: Server },
      { title: 'Incidentes', url: '/it/incidents', icon: AlertTriangle },
      { title: 'Mudanças', url: '/it/changes', icon: GitBranch },
      { title: 'CMDB', url: '/it/cmdb', icon: Database },
      { title: 'Ativos', url: '/it/assets', icon: Package },
    ],
    defaultOpen: true,
  },
  {
    key: 'data_hub',
    label: 'Dados & Analytics',
    moduleKey: 'data_hub',
    items: [
      { title: 'Duplicatas', url: '/duplicates', icon: Copy },
      { title: 'Merge Wizard', url: '/merge-wizard', icon: Merge },
      { title: 'Funil Completo', url: '/full-funnel', icon: Layers },
      { title: 'Atribuição', url: '/attribution', icon: Activity },
      { title: 'Customer 360', url: '/customer-360', icon: UserCircle },
      { title: 'Golden Records', url: '/data-hub/golden-records', icon: Fingerprint },
      { title: 'Fontes de Dados', url: '/data-hub/sources', icon: Database },
      { title: 'Event Schemas', url: '/data-hub/schemas', icon: LayoutList },
      { title: 'Activation', url: '/data-hub/activation', icon: Zap },
    ],
    defaultOpen: false,
  },
  {
    key: 'ai_agents',
    label: 'Inteligência / IA',
    moduleKey: 'ai_agents',
    items: [
      { title: 'Agentes', url: '/ai/agents', icon: Bot },
      { title: 'Ferramentas', url: '/ai/tools', icon: Wrench },
      { title: 'Políticas', url: '/ai/policies', icon: Shield },
      { title: 'Avaliações', url: '/ai/evals', icon: ClipboardList },
      { title: 'Execuções', url: '/ai/runs', icon: Activity },
      { title: 'Analytics', url: '/ai/analytics', icon: FileBarChart },
    ],
    defaultOpen: false,
  },
  {
    key: 'integrations',
    label: 'Integrações',
    moduleKey: 'integrations',
    items: [
      { title: 'Catálogo', url: '/integrations/catalog', icon: Link },
      { title: 'Instâncias', url: '/integrations/instances', icon: Cpu },
      { title: 'Monitoramento', url: '/integrations/monitoring', icon: Activity },
      { title: 'Dead Letter Queue', url: '/integrations/dlq', icon: AlertTriangle },
      { title: 'Webhooks', url: '/integrations/webhooks', icon: Globe },
    ],
    defaultOpen: false,
  },
  {
    key: 'portals',
    label: 'Portais',
    moduleKey: 'portals',
    items: [
      { title: 'Portal do Cliente', url: '/portal', icon: Globe },
      { title: 'Portal de Parceiros', url: '/partner', icon: Handshake },
    ],
    defaultOpen: false,
  },
];

const managementNavItems: NavItem[] = [
  { title: 'Produtos', url: '/products', icon: Package },
  { title: 'Territórios', url: '/territories', icon: Map },
  { title: 'Cadências', url: '/cadences', icon: Zap },
  { title: 'Forecast', url: '/forecast', icon: BarChart3 },
  { title: 'Dashboards', url: '/dashboards', icon: LayoutDashboard },
  { title: 'Relatórios', url: '/reports', icon: PieChart },
  { title: 'Auditoria', url: '/audit-logs', icon: ClipboardList },
];

const adminNavItems: NavItem[] = [
  { title: 'Módulos', url: '/admin/platform/modules', icon: Package },
  { title: 'Permissões', url: '/admin/platform/permissions', icon: Shield },
  { title: 'Segurança', url: '/admin/platform/security', icon: Lock },
  { title: 'Campos Custom', url: '/admin/platform/custom-fields', icon: SlidersHorizontal },
  { title: 'Integrações', url: '/admin/platform/integrations', icon: Link },
  { title: 'IA', url: '/admin/platform/ai', icon: Bot },
  { title: 'Observabilidade', url: '/admin/platform/observability', icon: Eye },
];

const settingsNavItems: NavItem[] = [
  { title: 'Configurações', url: '/settings', icon: Settings },
  { title: 'Respostas Rápidas', url: '/settings/canned-responses', icon: MessageSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isModuleEnabled, isLoading: modulesLoading } = useModuleAccess();
  const collapsed = state === 'collapsed';

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    NAV_SECTIONS.forEach(s => {
      initial[s.key] = s.defaultOpen ?? true;
    });
    initial['management'] = true;
    initial['admin'] = false;
    return initial;
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
            'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            isActive(item.url) && 'sidebar-item-active text-sidebar-foreground'
          )}
          activeClassName="sidebar-item-active text-sidebar-foreground"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderCollapsibleSection = (
    sectionKey: string,
    label: string,
    items: NavItem[]
  ) => (
    <SidebarGroup key={sectionKey}>
      <Collapsible
        open={openSections[sectionKey] ?? true}
        onOpenChange={() => toggleSection(sectionKey)}
      >
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground/80 text-[10px] uppercase tracking-[0.08em] text-sidebar-foreground/40 font-semibold px-3 py-2">
            <span className={cn(!collapsed && 'flex-1')}>
              {!collapsed && label}
            </span>
            {!collapsed && (
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  openSections[sectionKey] && 'rotate-180'
                )}
              />
            )}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>{items.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );

  const shouldShowSection = (section: NavSection): boolean => {
    if (!section.moduleKey) return true;
    if (modulesLoading) return true;
    return isModuleEnabled(section.moduleKey);
  };

  const visibleSections = NAV_SECTIONS.filter(shouldShowSection);

  return (
    <Sidebar className="border-r border-sidebar-border">
      {/* Header with brand */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-sidebar-foreground">Fireware</span>
              <span className="text-[11px] text-sidebar-foreground/50">CRM Enterprise</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin px-2 py-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{mainNavItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Module-aware sections */}
        {visibleSections.map((section) =>
          renderCollapsibleSection(section.key, section.label, section.items)
        )}

        {/* Management */}
        {renderCollapsibleSection('management', 'Gestão', managementNavItems)}

        {/* Admin Platform */}
        {renderCollapsibleSection('admin', 'Administração', adminNavItems)}

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{settingsNavItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with user info */}
      <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.email}
              </span>
              <span className="truncate text-[11px] capitalize text-sidebar-foreground/50">
                {profile?.role || 'Usuário'}
              </span>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
