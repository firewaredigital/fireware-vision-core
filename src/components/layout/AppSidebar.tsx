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
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
];

const salesNavItems = [
  { title: 'Leads', url: '/leads', icon: Target },
  { title: 'Contas', url: '/accounts', icon: Building2 },
  { title: 'Contatos', url: '/contacts', icon: Users },
  { title: 'Oportunidades', url: '/opportunities', icon: TrendingUp },
  { title: 'Propostas', url: '/quotes', icon: FileText },
  { title: 'Contratos', url: '/contracts', icon: FileSignature },
];

const serviceNavItems = [
  { title: 'Dashboard de Service', url: '/service', icon: Headphones },
  { title: 'Inbox Omnichannel', url: '/service/inbox', icon: MessageSquare },
  { title: 'WhatsApp', url: '/service/whatsapp', icon: MessageSquare },
  { title: 'Chat Widgets', url: '/service/chat-widgets', icon: MessageSquare },
  { title: 'Telefonia', url: '/service/voice', icon: Headphones },
  { title: 'Tickets', url: '/tickets', icon: Ticket },
  { title: 'Base de Conhecimento', url: '/knowledge', icon: BookOpen },
  { title: 'Customer Success', url: '/customer-success', icon: Heart },
];

const marketingNavItems = [
  { title: 'Dashboard Marketing', url: '/marketing', icon: Megaphone },
  { title: 'Campanhas', url: '/marketing/campaigns', icon: Mail },
  { title: 'Segmentos', url: '/marketing/segments', icon: Filter },
  { title: 'Jornadas', url: '/marketing/journeys', icon: Route },
];

const commerceNavItems = [
  { title: 'Pedidos', url: '/orders', icon: ShoppingCart },
  { title: 'Devoluções', url: '/returns', icon: RotateCcw },
  { title: 'Promoções', url: '/promotions', icon: Tag },
];

const automationsNavItems = [
  { title: 'Workflows', url: '/automations', icon: Workflow },
];

const governanceNavItems = [
  { title: 'Governança', url: '/governance', icon: Shield },
];

const itNavItems = [
  { title: 'Dashboard IT', url: '/it', icon: Server },
  { title: 'Incidentes', url: '/it/incidents', icon: AlertTriangle },
  { title: 'Mudanças', url: '/it/changes', icon: GitBranch },
  { title: 'CMDB', url: '/it/cmdb', icon: Database },
  { title: 'Ativos', url: '/it/assets', icon: Package },
];

const dataNavItems = [
  { title: 'Duplicatas', url: '/duplicates', icon: Copy },
  { title: 'Merge Wizard', url: '/merge-wizard', icon: Merge },
  { title: 'Funil Completo', url: '/full-funnel', icon: Layers },
  { title: 'Atribuição', url: '/attribution', icon: Activity },
  { title: 'Customer 360', url: '/customer-360', icon: UserCircle },
];

const portalNavItems = [
  { title: 'Portal do Cliente', url: '/portal', icon: Globe },
];

const managementNavItems = [
  { title: 'Produtos', url: '/products', icon: Package },
  { title: 'Territórios', url: '/territories', icon: Map },
  { title: 'Cadências', url: '/cadences', icon: Zap },
  { title: 'Forecast', url: '/forecast', icon: BarChart3 },
  { title: 'Relatórios', url: '/reports', icon: PieChart },
  { title: 'Auditoria', url: '/audit-logs', icon: ClipboardList },
];

const settingsNavItems = [
  { title: 'Configurações', url: '/settings', icon: Settings },
  { title: 'Respostas Rápidas', url: '/settings/canned-responses', icon: MessageSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const collapsed = state === 'collapsed';

  const [salesOpen, setSalesOpen] = useState(true);
  const [serviceOpen, setServiceOpen] = useState(true);
  const [marketingOpen, setMarketingOpen] = useState(true);
  const [commerceOpen, setCommerceOpen] = useState(true);
  const [automationsOpen, setAutomationsOpen] = useState(true);
  const [governanceOpen, setGovernanceOpen] = useState(true);
  const [managementOpen, setManagementOpen] = useState(true);
  const [itOpen, setItOpen] = useState(true);
  const [dataOpen, setDataOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  const renderNavItem = (item: { title: string; url: string; icon: any }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isActive(item.url) && 'bg-sidebar-accent text-sidebar-primary'
          )}
          activeClassName="bg-sidebar-accent text-sidebar-primary"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">Fireware</span>
              <span className="text-xs text-sidebar-foreground/60">CRM Enterprise</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sales */}
        <SidebarGroup>
          <Collapsible open={salesOpen} onOpenChange={setSalesOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                <span className={cn(!collapsed && 'flex-1')}>
                  {!collapsed && 'Vendas'}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      salesOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {salesNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Service */}
        <SidebarGroup>
          <Collapsible open={serviceOpen} onOpenChange={setServiceOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                <span className={cn(!collapsed && 'flex-1')}>
                  {!collapsed && 'Atendimento'}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      serviceOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {serviceNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Commerce */}
        <SidebarGroup>
          <Collapsible open={commerceOpen} onOpenChange={setCommerceOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                <span className={cn(!collapsed && 'flex-1')}>
                  {!collapsed && 'Commerce'}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      commerceOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {commerceNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Automations */}
        <SidebarGroup>
          <Collapsible open={automationsOpen} onOpenChange={setAutomationsOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                <span className={cn(!collapsed && 'flex-1')}>
                  {!collapsed && 'Automações'}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      automationsOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {automationsNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Governance */}
        <SidebarGroup>
          <Collapsible open={governanceOpen} onOpenChange={setGovernanceOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                <span className={cn(!collapsed && 'flex-1')}>
                  {!collapsed && 'Governança'}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      governanceOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {governanceNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* IT/ITSM */}
        <SidebarGroup>
          <Collapsible open={itOpen} onOpenChange={setItOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                <span className={cn(!collapsed && 'flex-1')}>
                  {!collapsed && 'TI / ITSM'}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      itOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {itNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Data/Analytics */}
        <SidebarGroup>
          <Collapsible open={dataOpen} onOpenChange={setDataOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                <span className={cn(!collapsed && 'flex-1')}>
                  {!collapsed && 'Dados & Analytics'}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      dataOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {dataNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup>
          <Collapsible open={managementOpen} onOpenChange={setManagementOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                <span className={cn(!collapsed && 'flex-1')}>
                  {!collapsed && 'Gestão'}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      managementOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
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
              <span className="truncate text-xs capitalize text-sidebar-foreground/60">
                {profile?.role || 'Usuário'}
              </span>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
