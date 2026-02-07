import { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Search,
} from '@/components/icons';
import { NavLink } from '@/components/NavLink';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useModuleAccess, type ModuleKey } from '@/hooks/useModuleAccess';
import { cn } from '@/lib/utils';
import firewareLogo from '@/assets/fireware-logo.png';

// ─── Types ─────────────────────────────────────────────────────────

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  moduleKey?: ModuleKey;
  items: NavItem[];
}

interface RailModule {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  groups: NavGroup[];
}

// ─── Rail Module Definitions ───────────────────────────────────────

const RAIL_MODULES: RailModule[] = [
  {
    key: 'principal',
    label: 'Principal',
    shortLabel: 'Princ.',
    icon: LayoutDashboard,
    groups: [
      {
        label: 'Navegação',
        items: [
          { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
          { title: 'Leads', url: '/leads', icon: Target },
          { title: 'Contas', url: '/accounts', icon: Building2 },
          { title: 'Contatos', url: '/contacts', icon: Users },
          { title: 'Oportunidades', url: '/opportunities', icon: TrendingUp },
        ],
      },
    ],
  },
  {
    key: 'intelli',
    label: 'Inteligência',
    shortLabel: 'Intelli',
    icon: Brain,
    groups: [
      {
        label: 'IA & Agentes',
        moduleKey: 'ai_agents',
        items: [
          { title: 'Agentes', url: '/ai/agents', icon: Bot },
          { title: 'Ferramentas', url: '/ai/tools', icon: Wrench },
          { title: 'Políticas', url: '/ai/policies', icon: Shield },
          { title: 'Avaliações', url: '/ai/evals', icon: ClipboardList },
          { title: 'Execuções', url: '/ai/runs', icon: Activity },
          { title: 'Analytics IA', url: '/ai/analytics', icon: FileBarChart },
        ],
      },
    ],
  },
  {
    key: 'operac',
    label: 'Operações',
    shortLabel: 'Operac.',
    icon: Workflow,
    groups: [
      {
        label: 'Vendas Avançado',
        moduleKey: 'sales',
        items: [
          { title: 'Propostas', url: '/quotes', icon: FileText },
          { title: 'Contratos', url: '/contracts', icon: FileSignature },
          { title: 'CPQ', url: '/sales/cpq', icon: Settings },
          { title: 'Assinaturas', url: '/sales/subscriptions', icon: RotateCcw },
          { title: 'Faturamento', url: '/sales/billing', icon: DollarSign },
          { title: 'Conv. Intelligence', url: '/sales/conversation-intelligence', icon: Radio },
          { title: 'Revenue Ops', url: '/sales/revenue-ops', icon: BarChart3 },
        ],
      },
      {
        label: 'Atendimento',
        moduleKey: 'service',
        items: [
          { title: 'Dashboard Service', url: '/service', icon: Headphones },
          { title: 'Inbox Omnichannel', url: '/service/inbox', icon: Inbox },
          { title: 'Filas', url: '/service/queues', icon: Layers },
          { title: 'Qualidade & NPS', url: '/service/qa', icon: ClipboardList },
          { title: 'Social Inbox', url: '/service/social', icon: Globe },
          { title: 'Analytics Service', url: '/service/analytics', icon: FileBarChart },
          { title: 'WhatsApp', url: '/service/whatsapp', icon: MessageSquare },
          { title: 'Chat Widgets', url: '/service/chat-widgets', icon: Radio },
          { title: 'Telefonia', url: '/service/voice', icon: Headphones },
          { title: 'Tickets', url: '/tickets', icon: Ticket },
          { title: 'Base de Conhecimento', url: '/knowledge', icon: BookOpen },
          { title: 'Customer Success', url: '/customer-success', icon: Heart },
        ],
      },
      {
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
      },
      {
        label: 'Commerce',
        moduleKey: 'commerce',
        items: [
          { title: 'Pedidos', url: '/orders', icon: ShoppingCart },
          { title: 'Devoluções', url: '/returns', icon: RotateCcw },
          { title: 'Promoções', url: '/promotions', icon: Tag },
        ],
      },
      {
        label: 'Automações',
        moduleKey: 'automations',
        items: [
          { title: 'Workflows', url: '/automations', icon: Workflow },
        ],
      },
    ],
  },
  {
    key: 'dados',
    label: 'Dados',
    shortLabel: 'Dados',
    icon: Database,
    groups: [
      {
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
      },
      {
        label: 'Governança',
        moduleKey: 'governance',
        items: [
          { title: 'Governança', url: '/governance', icon: Shield },
        ],
      },
      {
        label: 'TI / ITSM',
        moduleKey: 'itsm',
        items: [
          { title: 'Dashboard IT', url: '/it', icon: Server },
          { title: 'Incidentes', url: '/it/incidents', icon: AlertTriangle },
          { title: 'Mudanças', url: '/it/changes', icon: GitBranch },
          { title: 'CMDB', url: '/it/cmdb', icon: Database },
          { title: 'Ativos', url: '/it/assets', icon: Package },
        ],
      },
      {
        label: 'Integrações',
        moduleKey: 'integrations',
        items: [
          { title: 'Catálogo', url: '/integrations/catalog', icon: Link },
          { title: 'Instâncias', url: '/integrations/instances', icon: Cpu },
          { title: 'Monitoramento', url: '/integrations/monitoring', icon: Activity },
          { title: 'Dead Letter Queue', url: '/integrations/dlq', icon: AlertTriangle },
          { title: 'Webhooks', url: '/integrations/webhooks', icon: Globe },
        ],
      },
    ],
  },
  {
    key: 'analyt',
    label: 'Analytics',
    shortLabel: 'Analyt.',
    icon: BarChart3,
    groups: [
      {
        label: 'Gestão',
        items: [
          { title: 'Produtos', url: '/products', icon: Package },
          { title: 'Territórios', url: '/territories', icon: Map },
          { title: 'Cadências', url: '/cadences', icon: Zap },
          { title: 'Forecast', url: '/forecast', icon: BarChart3 },
        ],
      },
      {
        label: 'Relatórios',
        items: [
          { title: 'Dashboards', url: '/dashboards', icon: LayoutDashboard },
          { title: 'Relatórios', url: '/reports', icon: PieChart },
          { title: 'Auditoria', url: '/audit-logs', icon: ClipboardList },
        ],
      },
    ],
  },
  {
    key: 'config',
    label: 'Configurações',
    shortLabel: 'Config.',
    icon: Settings,
    groups: [
      {
        label: 'Administração',
        items: [
          { title: 'Módulos', url: '/admin/platform/modules', icon: Package },
          { title: 'Permissões', url: '/admin/platform/permissions', icon: Shield },
          { title: 'Segurança', url: '/admin/platform/security', icon: Lock },
          { title: 'Campos Custom', url: '/admin/platform/custom-fields', icon: SlidersHorizontal },
          { title: 'Integrações Admin', url: '/admin/platform/integrations', icon: Link },
          { title: 'IA Admin', url: '/admin/platform/ai', icon: Bot },
          { title: 'Observabilidade', url: '/admin/platform/observability', icon: Eye },
        ],
      },
      {
        label: 'Preferências',
        items: [
          { title: 'Configurações', url: '/settings', icon: Settings },
          { title: 'Respostas Rápidas', url: '/settings/canned-responses', icon: MessageSquare },
        ],
      },
      {
        label: 'Portais',
        moduleKey: 'portals',
        items: [
          { title: 'Portal do Cliente', url: '/portal', icon: Globe },
          { title: 'Portal de Parceiros', url: '/partner', icon: Handshake },
        ],
      },
    ],
  },
];

// ─── Route-to-Rail Mapping ─────────────────────────────────────────

const ROUTE_RAIL_MAP: { pattern: RegExp; railKey: string }[] = [
  { pattern: /^\/(dashboard|leads|accounts|contacts|opportunities)(\/|$)/, railKey: 'principal' },
  { pattern: /^\/ai(\/|$)/, railKey: 'intelli' },
  { pattern: /^\/(quotes|contracts|sales)(\/|$)/, railKey: 'operac' },
  { pattern: /^\/(tickets|service|knowledge|customer-success)(\/|$)/, railKey: 'operac' },
  { pattern: /^\/(marketing)(\/|$)/, railKey: 'operac' },
  { pattern: /^\/(orders|returns|promotions)(\/|$)/, railKey: 'operac' },
  { pattern: /^\/(automations)(\/|$)/, railKey: 'operac' },
  { pattern: /^\/(duplicates|merge-wizard|full-funnel|attribution|customer-360|data-hub)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(governance)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(it)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(integrations)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(products|territories|cadences|forecast|dashboards|reports|audit-logs)(\/|$)/, railKey: 'analyt' },
  { pattern: /^\/(admin|settings|portal|partner)(\/|$)/, railKey: 'config' },
];

function getRailKeyFromPath(pathname: string): string {
  for (const { pattern, railKey } of ROUTE_RAIL_MAP) {
    if (pattern.test(pathname)) return railKey;
  }
  return 'principal';
}

// ─── Component ─────────────────────────────────────────────────────

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { isModuleEnabled, isLoading: modulesLoading } = useModuleAccess();

  // Derive active rail from route
  const activeRailFromRoute = useMemo(
    () => getRailKeyFromPath(location.pathname),
    [location.pathname]
  );

  const [selectedRail, setSelectedRail] = useState(activeRailFromRoute);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync rail selection when route changes
  const currentRail = activeRailFromRoute !== selectedRail ? activeRailFromRoute : selectedRail;

  // Update selectedRail when route changes
  useMemo(() => {
    setSelectedRail(activeRailFromRoute);
  }, [activeRailFromRoute]);

  const handleRailClick = useCallback((key: string) => {
    setSelectedRail(key);
    setSearchQuery('');
  }, []);

  const isActive = useCallback(
    (path: string) =>
      location.pathname === path || location.pathname.startsWith(path + '/'),
    [location.pathname]
  );

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  // Get current module data
  const activeModule = useMemo(
    () => RAIL_MODULES.find((m) => m.key === currentRail),
    [currentRail]
  );

  // Filter groups by module access
  const visibleGroups = useMemo(() => {
    if (!activeModule) return [];
    return activeModule.groups.filter((group) => {
      if (!group.moduleKey) return true;
      if (modulesLoading) return true;
      return isModuleEnabled(group.moduleKey);
    });
  }, [activeModule, isModuleEnabled, modulesLoading]);

  // Filter items by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return visibleGroups;
    const q = searchQuery.toLowerCase();
    return visibleGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.title.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [visibleGroups, searchQuery]);

  return (
    <aside className="sidebar-dual-panel">
      {/* ═══ RAIL (Left) ═══ */}
      <div className="sidebar-rail">
        {/* Logo */}
        <div className="sidebar-rail-logo">
          <img
            src={firewareLogo}
            alt="Fireware CRM"
            className="h-8 w-8 object-contain"
          />
        </div>

        {/* Rail Items */}
        <nav className="sidebar-rail-nav">
          {RAIL_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isRailActive = currentRail === mod.key;
            return (
              <button
                key={mod.key}
                onClick={() => handleRailClick(mod.key)}
                className={cn(
                  'sidebar-rail-item',
                  isRailActive && 'sidebar-rail-item-active'
                )}
                title={mod.label}
              >
                <Icon
                  className="sidebar-rail-icon"
                  weight={isRailActive ? 'bold' : 'regular'}
                />
                <span className="sidebar-rail-label">{mod.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Rail Footer — User Avatar + Logout */}
        <div className="sidebar-rail-footer">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={signOut}
            className="sidebar-rail-item mt-1"
            title="Sair"
          >
            <LogOut className="sidebar-rail-icon" />
          </button>
        </div>
      </div>

      {/* ═══ CONTENT PANEL (Right) ═══ */}
      <div className="sidebar-content-panel">
        {/* Panel Header */}
        <div className="sidebar-content-header">
          <h2 className="sidebar-content-title">
            {activeModule?.label || 'Principal'}
          </h2>
          <div className="sidebar-content-search">
            <Search className="sidebar-search-icon" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input"
            />
          </div>
        </div>

        {/* Panel Content */}
        <ScrollArea className="flex-1">
          <nav className="sidebar-content-nav">
            {filteredGroups.map((group, groupIdx) => (
              <div key={group.label + groupIdx} className="sidebar-content-group">
                {/* Group Label — only show if multiple groups */}
                {visibleGroups.length > 1 && (
                  <span className="sidebar-group-label">{group.label}</span>
                )}

                {/* Nav Items */}
                <ul className="sidebar-content-items">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.url);
                    return (
                      <li key={item.url}>
                        <NavLink
                          to={item.url}
                          className={cn(
                            'sidebar-content-item',
                            active && 'sidebar-content-item-active'
                          )}
                          activeClassName="sidebar-content-item-active"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {filteredGroups.length === 0 && searchQuery && (
              <div className="px-4 py-8 text-center text-xs text-sidebar-foreground/40">
                Nenhum item encontrado.
              </div>
            )}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}

// ─── Mobile Sidebar (Drawer) ───────────────────────────────────────

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 animate-in slide-in-from-left duration-300">
        <AppSidebar />
      </div>
    </>
  );
}
