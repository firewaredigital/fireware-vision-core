import { useState, useMemo, useCallback, useEffect } from 'react';
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
  Fingerprint,
  LayoutList,
  Search,
} from '@/components/icons';
import { NavLink } from '@/components/NavLink';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useModuleAccess, type ModuleKey } from '@/hooks/useModuleAccess';
import { cn } from '@/lib/utils';
import crPlatformLogo from '@/assets/cr-platform-logo.png';

// ─── Types ─────────────────────────────────────────────────────────

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface ContentSection {
  key: string;
  label: string;
  moduleKey?: ModuleKey;
  items: NavItem[];
}

interface RailModule {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  /** If true, clicking the rail item navigates directly to this URL */
  directUrl?: string;
  sections: ContentSection[];
}

// ─── Rail Modules ──────────────────────────────────────────────────
// Each rail item maps to an ACTUAL system category (Vendas, Atendimento, etc.)
// The content panel shows the sub-items for the selected category.

const RAIL_MODULES: RailModule[] = [
  // ── Home / Dashboard ──
  {
    key: 'home',
    label: 'Home',
    shortLabel: 'Home',
    icon: LayoutDashboard,
    directUrl: '/dashboard',
    sections: [
      {
        key: 'home_nav',
        label: 'Navegação',
        items: [
          { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        ],
      },
    ],
  },

  // ── Vendas ──
  {
    key: 'vendas',
    label: 'Vendas',
    shortLabel: 'Vendas',
    icon: TrendingUp,
    sections: [
      {
        key: 'vendas_core',
        label: 'CRM',
        moduleKey: 'sales',
        items: [
          { title: 'Leads', url: '/leads', icon: Target },
          { title: 'Contas', url: '/accounts', icon: Building2 },
          { title: 'Contatos', url: '/contacts', icon: Users },
          { title: 'Oportunidades', url: '/opportunities', icon: TrendingUp },
          { title: 'Propostas', url: '/quotes', icon: FileText },
          { title: 'Contratos', url: '/contracts', icon: FileSignature },
        ],
      },
      {
        key: 'vendas_advanced',
        label: 'Avançado',
        moduleKey: 'sales',
        items: [
          { title: 'CPQ', url: '/sales/cpq', icon: Settings },
          { title: 'Assinaturas', url: '/sales/subscriptions', icon: RotateCcw },
          { title: 'Faturamento', url: '/sales/billing', icon: DollarSign },
          { title: 'Conv. Intelligence', url: '/sales/conversation-intelligence', icon: Radio },
          { title: 'Revenue Ops', url: '/sales/revenue-ops', icon: BarChart3 },
        ],
      },
    ],
  },

  // ── Atendimento ──
  {
    key: 'atendimento',
    label: 'Atendimento',
    shortLabel: 'Atendim.',
    icon: Headphones,
    sections: [
      {
        key: 'atendimento_core',
        label: 'Central',
        moduleKey: 'service',
        items: [
          { title: 'Dashboard', url: '/service', icon: Headphones },
          { title: 'Inbox Omnichannel', url: '/service/inbox', icon: Inbox },
          { title: 'Tickets', url: '/tickets', icon: Ticket },
          { title: 'Filas', url: '/service/queues', icon: Layers },
          { title: 'Qualidade & NPS', url: '/service/qa', icon: ClipboardList },
        ],
      },
      {
        key: 'atendimento_channels',
        label: 'Canais',
        moduleKey: 'service',
        items: [
          { title: 'Social Inbox', url: '/service/social', icon: Globe },
          { title: 'WhatsApp', url: '/service/whatsapp', icon: MessageSquare },
          { title: 'Chat Widgets', url: '/service/chat-widgets', icon: Radio },
          { title: 'Telefonia', url: '/service/voice', icon: Headphones },
        ],
      },
      {
        key: 'atendimento_extra',
        label: 'Mais',
        moduleKey: 'service',
        items: [
          { title: 'Analytics', url: '/service/analytics', icon: FileBarChart },
          { title: 'Base de Conhecimento', url: '/knowledge', icon: BookOpen },
          { title: 'Customer Success', url: '/customer-success', icon: Heart },
        ],
      },
    ],
  },

  // ── Marketing ──
  {
    key: 'marketing',
    label: 'Marketing',
    shortLabel: 'Market.',
    icon: Megaphone,
    sections: [
      {
        key: 'marketing_core',
        label: 'Campanhas',
        moduleKey: 'marketing',
        items: [
          { title: 'Dashboard', url: '/marketing', icon: Megaphone },
          { title: 'Campanhas', url: '/marketing/campaigns', icon: Mail },
          { title: 'Segmentos', url: '/marketing/segments', icon: Filter },
          { title: 'Jornadas', url: '/marketing/journeys', icon: Route },
        ],
      },
      {
        key: 'marketing_config',
        label: 'Configuração',
        moduleKey: 'marketing',
        items: [
          { title: 'Provedores', url: '/marketing/providers', icon: Send },
          { title: 'Preferências', url: '/marketing/preference-center', icon: SlidersHorizontal },
          { title: 'Personalização', url: '/marketing/personalization', icon: Sparkles },
          { title: 'Intelligence', url: '/marketing/intelligence', icon: Brain },
          { title: 'Templates de Email', url: '/marketing/email-templates', icon: Mail },
        ],
      },
    ],
  },

  // ── Commerce ──
  {
    key: 'commerce',
    label: 'Commerce',
    shortLabel: 'Comércio',
    icon: ShoppingCart,
    sections: [
      {
        key: 'commerce_core',
        label: 'Operações',
        moduleKey: 'commerce',
        items: [
          { title: 'Pedidos', url: '/orders', icon: ShoppingCart },
          { title: 'Devoluções', url: '/returns', icon: RotateCcw },
          { title: 'Promoções', url: '/promotions', icon: Tag },
        ],
      },
    ],
  },

  // ── Inteligência / IA ──
  {
    key: 'ia',
    label: 'Inteligência',
    shortLabel: 'IA',
    icon: Brain,
    sections: [
      {
        key: 'ia_core',
        label: 'Agentes & Ferramentas',
        moduleKey: 'ai_agents',
        items: [
          { title: 'Agentes', url: '/ai/agents', icon: Bot },
          { title: 'Ferramentas', url: '/ai/tools', icon: Wrench },
          { title: 'Políticas', url: '/ai/policies', icon: Shield },
          { title: 'Avaliações', url: '/ai/evals', icon: ClipboardList },
          { title: 'Execuções', url: '/ai/runs', icon: Activity },
          { title: 'Analytics', url: '/ai/analytics', icon: FileBarChart },
        ],
      },
    ],
  },

  // ── TI / ITSM ──
  {
    key: 'ti',
    label: 'TI / ITSM',
    shortLabel: 'TI',
    icon: Server,
    sections: [
      {
        key: 'ti_core',
        label: 'Gestão de TI',
        moduleKey: 'itsm',
        items: [
          { title: 'Dashboard IT', url: '/it', icon: Server },
          { title: 'Incidentes', url: '/it/incidents', icon: AlertTriangle },
          { title: 'Mudanças', url: '/it/changes', icon: GitBranch },
          { title: 'CMDB', url: '/it/cmdb', icon: Database },
          { title: 'Ativos', url: '/it/assets', icon: Package },
        ],
      },
    ],
  },

  // ── Dados ──
  // Agrupa: Governança, Data Hub, Integrações
  {
    key: 'dados',
    label: 'Dados',
    shortLabel: 'Dados',
    icon: Database,
    sections: [
      {
        key: 'dados_governance',
        label: 'Governança',
        moduleKey: 'governance',
        items: [
          { title: 'Governança', url: '/governance', icon: Shield },
        ],
      },
      {
        key: 'dados_hub',
        label: 'Data Hub',
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
        key: 'dados_integrations',
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

  // ── Gestão & Analytics ──
  // Agrupa: Gestão, Automações, Relatórios
  {
    key: 'gestao',
    label: 'Gestão',
    shortLabel: 'Gestão',
    icon: BarChart3,
    sections: [
      {
        key: 'gestao_core',
        label: 'Gestão',
        items: [
          { title: 'Produtos', url: '/products', icon: Package },
          { title: 'Territórios', url: '/territories', icon: Map },
          { title: 'Cadências', url: '/cadences', icon: Zap },
          { title: 'Forecast', url: '/forecast', icon: BarChart3 },
        ],
      },
      {
        key: 'gestao_automations',
        label: 'Automações',
        moduleKey: 'automations',
        items: [
          { title: 'Workflows', url: '/automations', icon: Workflow },
        ],
      },
      {
        key: 'gestao_reports',
        label: 'Relatórios',
        items: [
          { title: 'Dashboards', url: '/dashboards', icon: LayoutDashboard },
          { title: 'Relatórios', url: '/reports', icon: PieChart },
          { title: 'Auditoria', url: '/audit-logs', icon: ClipboardList },
        ],
      },
    ],
  },

  // ── Administração ──
  // Agrupa: Admin Platform, Configurações, Portais
  {
    key: 'admin',
    label: 'Administração',
    shortLabel: 'Admin',
    icon: Settings,
    sections: [
      {
        key: 'admin_platform',
        label: 'Plataforma',
        items: [
          { title: 'Módulos', url: '/admin/platform/modules', icon: Package },
          { title: 'Permissões', url: '/admin/platform/permissions', icon: Shield },
          { title: 'Segurança', url: '/admin/platform/security', icon: Lock },
          { title: 'Campos Custom', url: '/admin/platform/custom-fields', icon: SlidersHorizontal },
          { title: 'Integrações', url: '/admin/platform/integrations', icon: Link },
          { title: 'IA', url: '/admin/platform/ai', icon: Bot },
          { title: 'Observabilidade', url: '/admin/platform/observability', icon: Eye },
        ],
      },
      {
        key: 'admin_settings',
        label: 'Preferências',
        items: [
          { title: 'Configurações', url: '/settings', icon: Settings },
          { title: 'Respostas Rápidas', url: '/settings/canned-responses', icon: MessageSquare },
        ],
      },
      {
        key: 'admin_portals',
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

// ─── Route → Rail Key Mapping ──────────────────────────────────────

const ROUTE_RAIL_MAP: { pattern: RegExp; railKey: string }[] = [
  // Home
  { pattern: /^\/(dashboard)(\/|$)/, railKey: 'home' },
  // Vendas
  { pattern: /^\/(leads)(\/|$)/, railKey: 'vendas' },
  { pattern: /^\/(accounts)(\/|$)/, railKey: 'vendas' },
  { pattern: /^\/(contacts)(\/|$)/, railKey: 'vendas' },
  { pattern: /^\/(opportunities)(\/|$)/, railKey: 'vendas' },
  { pattern: /^\/(quotes)(\/|$)/, railKey: 'vendas' },
  { pattern: /^\/(contracts)(\/|$)/, railKey: 'vendas' },
  { pattern: /^\/sales(\/|$)/, railKey: 'vendas' },
  // Atendimento
  { pattern: /^\/(service)(\/|$)/, railKey: 'atendimento' },
  { pattern: /^\/(tickets)(\/|$)/, railKey: 'atendimento' },
  { pattern: /^\/(knowledge)(\/|$)/, railKey: 'atendimento' },
  { pattern: /^\/(customer-success)(\/|$)/, railKey: 'atendimento' },
  // Marketing
  { pattern: /^\/(marketing)(\/|$)/, railKey: 'marketing' },
  // Commerce
  { pattern: /^\/(orders)(\/|$)/, railKey: 'commerce' },
  { pattern: /^\/(returns)(\/|$)/, railKey: 'commerce' },
  { pattern: /^\/(promotions)(\/|$)/, railKey: 'commerce' },
  // IA
  { pattern: /^\/ai(\/|$)/, railKey: 'ia' },
  // TI
  { pattern: /^\/(it)(\/|$)/, railKey: 'ti' },
  // Dados
  { pattern: /^\/(governance)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(duplicates)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(merge-wizard)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(full-funnel)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(attribution)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(customer-360)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(data-hub)(\/|$)/, railKey: 'dados' },
  { pattern: /^\/(integrations)(\/|$)/, railKey: 'dados' },
  // Gestão
  { pattern: /^\/(products)(\/|$)/, railKey: 'gestao' },
  { pattern: /^\/(territories)(\/|$)/, railKey: 'gestao' },
  { pattern: /^\/(cadences)(\/|$)/, railKey: 'gestao' },
  { pattern: /^\/(forecast)(\/|$)/, railKey: 'gestao' },
  { pattern: /^\/(automations)(\/|$)/, railKey: 'gestao' },
  { pattern: /^\/(dashboards)(\/|$)/, railKey: 'gestao' },
  { pattern: /^\/(reports)(\/|$)/, railKey: 'gestao' },
  { pattern: /^\/(audit-logs)(\/|$)/, railKey: 'gestao' },
  // Admin
  { pattern: /^\/(admin)(\/|$)/, railKey: 'admin' },
  { pattern: /^\/(settings)(\/|$)/, railKey: 'admin' },
  { pattern: /^\/(portal)(\/|$)/, railKey: 'admin' },
  { pattern: /^\/(partner)(\/|$)/, railKey: 'admin' },
];

function getRailKeyFromPath(pathname: string): string {
  for (const { pattern, railKey } of ROUTE_RAIL_MAP) {
    if (pattern.test(pathname)) return railKey;
  }
  return 'home';
}

// ─── Component ─────────────────────────────────────────────────────

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isModuleEnabled, isLoading: modulesLoading } = useModuleAccess();

  // Derive active rail from current route
  const activeRailFromRoute = useMemo(
    () => getRailKeyFromPath(location.pathname),
    [location.pathname]
  );

  const [selectedRail, setSelectedRail] = useState(activeRailFromRoute);
  const [searchQuery, setSearchQuery] = useState('');
  // Animation key — incremented on every rail switch to re-trigger CSS animation
  const [animKey, setAnimKey] = useState(0);

  // Sync rail selection when route changes
  useEffect(() => {
    setSelectedRail(activeRailFromRoute);
    setAnimKey((k) => k + 1);
  }, [activeRailFromRoute]);

  const handleRailClick = useCallback((key: string) => {
    setSelectedRail((prev) => {
      if (prev !== key) setAnimKey((k) => k + 1);
      return key;
    });
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
    () => RAIL_MODULES.find((m) => m.key === selectedRail),
    [selectedRail]
  );

  // Filter sections by module access
  const visibleSections = useMemo(() => {
    if (!activeModule) return [];
    return activeModule.sections.filter((section) => {
      if (!section.moduleKey) return true;
      if (modulesLoading) return true;
      return isModuleEnabled(section.moduleKey);
    });
  }, [activeModule, isModuleEnabled, modulesLoading]);

  // Filter items by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return visibleSections;
    const q = searchQuery.toLowerCase();
    return visibleSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.title.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [visibleSections, searchQuery]);

  return (
    <aside className="sidebar-dual-panel">
      {/* ═══ RAIL (Left — Dark) ═══ */}
      <div className="sidebar-rail">
        {/* Logo */}
        <div className="sidebar-rail-logo">
          <img
            src={crPlatformLogo}
            alt="CR Platform"
            className="h-8 w-8 object-contain"
          />
        </div>

        {/* Rail Navigation Items */}
        <nav className="sidebar-rail-nav">
          {RAIL_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isRailActive = selectedRail === mod.key;
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
            <span className="sidebar-rail-label">Sair</span>
          </button>
        </div>
      </div>

      {/* ═══ CONTENT PANEL (Right — Light/Grayish White) ═══ */}
      <div className="sidebar-content-panel">
        {/* Panel Header */}
        <div className="sidebar-content-header" key={`header-${animKey}`}>
          <h2 className="sidebar-content-title">
            {activeModule?.label || 'Home'}
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

        {/* Panel Content — Scrollable with transition animation */}
        <ScrollArea className="flex-1">
          <nav
            key={animKey}
            className="sidebar-content-nav sidebar-content-enter"
          >
            {filteredSections.map((section, sectionIdx) => (
              <div
                key={section.key}
                className="sidebar-content-group sidebar-group-enter"
                style={{ animationDelay: `${sectionIdx * 60}ms` }}
              >
                {/* Section label — show when multiple sections exist */}
                {visibleSections.length > 1 && (
                  <span className="sidebar-group-label">{section.label}</span>
                )}

                {/* Navigation Items */}
                <ul className="sidebar-content-items">
                  {section.items.map((item, itemIdx) => {
                    const Icon = item.icon;
                    const active = isActive(item.url);
                    return (
                      <li
                        key={item.url}
                        className="sidebar-item-enter"
                        style={{
                          animationDelay: `${sectionIdx * 60 + itemIdx * 30 + 40}ms`,
                        }}
                      >
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

            {filteredSections.length === 0 && searchQuery && (
              <div className="sidebar-content-empty">
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
