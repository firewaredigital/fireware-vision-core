import type { ModuleKey } from '@/hooks/useModuleAccess';
import type { AppSlug } from '@/config/apps';
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

// ─── Types ─────────────────────────────────────────────────────────

export interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

export interface ContentSection {
  key: string;
  label: string;
  moduleKey?: ModuleKey;
  items: NavItem[];
}

export interface RailModule {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  directUrl?: string;
  sections: ContentSection[];
}

// ─── Shared/Transversal modules ────────────────────────────────────

function getSharedModules(prefix: string): RailModule[] {
  return [
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
            { title: 'Agentes', url: `${prefix}/ai/agents`, icon: Bot },
            { title: 'Ferramentas', url: `${prefix}/ai/tools`, icon: Wrench },
            { title: 'Políticas', url: `${prefix}/ai/policies`, icon: Shield },
            { title: 'Avaliações', url: `${prefix}/ai/evals`, icon: ClipboardList },
            { title: 'Execuções', url: `${prefix}/ai/runs`, icon: Activity },
            { title: 'Analytics', url: `${prefix}/ai/analytics`, icon: FileBarChart },
          ],
        },
      ],
    },
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
            { title: 'Governança', url: `${prefix}/governance`, icon: Shield },
          ],
        },
        {
          key: 'dados_hub',
          label: 'Data Hub',
          moduleKey: 'data_hub',
          items: [
            { title: 'Duplicatas', url: `${prefix}/duplicates`, icon: Copy },
            { title: 'Merge Wizard', url: `${prefix}/merge-wizard`, icon: Merge },
            { title: 'Funil Completo', url: `${prefix}/full-funnel`, icon: Layers },
            { title: 'Atribuição', url: `${prefix}/attribution`, icon: Activity },
            { title: 'Customer 360', url: `${prefix}/customer-360`, icon: UserCircle },
            { title: 'Golden Records', url: `${prefix}/data-hub/golden-records`, icon: Fingerprint },
            { title: 'Fontes de Dados', url: `${prefix}/data-hub/sources`, icon: Database },
            { title: 'Event Schemas', url: `${prefix}/data-hub/schemas`, icon: LayoutList },
            { title: 'Activation', url: `${prefix}/data-hub/activation`, icon: Zap },
          ],
        },
        {
          key: 'dados_integrations',
          label: 'Integrações',
          moduleKey: 'integrations',
          items: [
            { title: 'Catálogo', url: `${prefix}/integrations/catalog`, icon: Link },
            { title: 'Instâncias', url: `${prefix}/integrations/instances`, icon: Cpu },
            { title: 'Monitoramento', url: `${prefix}/integrations/monitoring`, icon: Activity },
            { title: 'Dead Letter Queue', url: `${prefix}/integrations/dlq`, icon: AlertTriangle },
            { title: 'Webhooks', url: `${prefix}/integrations/webhooks`, icon: Globe },
          ],
        },
      ],
    },
    {
      key: 'gestao',
      label: 'Gestão',
      shortLabel: 'Gestão',
      icon: BarChart3,
      sections: [
        {
          key: 'gestao_automations',
          label: 'Automações',
          moduleKey: 'automations',
          items: [
            { title: 'Workflows', url: `${prefix}/automations`, icon: Workflow },
          ],
        },
        {
          key: 'gestao_reports',
          label: 'Relatórios',
          items: [
            { title: 'Dashboards', url: `${prefix}/dashboards`, icon: LayoutDashboard },
            { title: 'Relatórios', url: `${prefix}/reports`, icon: PieChart },
            { title: 'Auditoria', url: `${prefix}/audit-logs`, icon: ClipboardList },
          ],
        },
      ],
    },
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
            { title: 'Módulos', url: `${prefix}/admin/platform/modules`, icon: Package },
            { title: 'Permissões', url: `${prefix}/admin/platform/permissions`, icon: Shield },
            { title: 'Segurança', url: `${prefix}/admin/platform/security`, icon: Lock },
            { title: 'Campos Custom', url: `${prefix}/admin/platform/custom-fields`, icon: SlidersHorizontal },
            { title: 'Integrações', url: `${prefix}/admin/platform/integrations`, icon: Link },
            { title: 'IA', url: `${prefix}/admin/platform/ai`, icon: Bot },
            { title: 'Observabilidade', url: `${prefix}/admin/platform/observability`, icon: Eye },
          ],
        },
        {
          key: 'admin_settings',
          label: 'Preferências',
          items: [
            { title: 'Configurações', url: `${prefix}/settings`, icon: Settings },
            { title: 'Respostas Rápidas', url: `${prefix}/settings/canned-responses`, icon: MessageSquare },
            { title: 'Documentação', url: `${prefix}/docs`, icon: BookOpen },
          ],
        },
      ],
    },
  ];
}

// ─── App-specific modules ──────────────────────────────────────────

function getCRMModules(prefix: string): RailModule[] {
  return [
    {
      key: 'home',
      label: 'Home',
      shortLabel: 'Home',
      icon: LayoutDashboard,
      directUrl: `${prefix}/dashboard`,
      sections: [{ key: 'home_nav', label: 'Navegação', items: [{ title: 'Dashboard', url: `${prefix}/dashboard`, icon: LayoutDashboard }] }],
    },
    {
      key: 'pipeline',
      label: 'Pipeline',
      shortLabel: 'Pipeline',
      icon: TrendingUp,
      sections: [
        {
          key: 'vendas_core',
          label: 'CRM',
          items: [
            { title: 'Leads', url: `${prefix}/leads`, icon: Target },
            { title: 'Contas', url: `${prefix}/accounts`, icon: Building2 },
            { title: 'Contatos', url: `${prefix}/contacts`, icon: Users },
            { title: 'Oportunidades', url: `${prefix}/opportunities`, icon: TrendingUp },
            { title: 'Propostas', url: `${prefix}/quotes`, icon: FileText },
            { title: 'Contratos', url: `${prefix}/contracts`, icon: FileSignature },
          ],
        },
        {
          key: 'vendas_advanced',
          label: 'Avançado',
          items: [
            { title: 'CPQ', url: `${prefix}/sales/cpq`, icon: Settings },
            { title: 'Assinaturas', url: `${prefix}/sales/subscriptions`, icon: RotateCcw },
            { title: 'Faturamento', url: `${prefix}/sales/billing`, icon: DollarSign },
            { title: 'Conv. Intelligence', url: `${prefix}/sales/conversation-intelligence`, icon: Radio },
            { title: 'Revenue Ops', url: `${prefix}/sales/revenue-ops`, icon: BarChart3 },
          ],
        },
      ],
    },
    {
      key: 'contas',
      label: 'Contas',
      shortLabel: 'Contas',
      icon: Building2,
      sections: [
        {
          key: 'contas_core',
          label: 'Gestão',
          items: [
            { title: 'Produtos', url: `${prefix}/products`, icon: Package },
            { title: 'Territórios', url: `${prefix}/territories`, icon: Map },
            { title: 'Cadências', url: `${prefix}/cadences`, icon: Zap },
            { title: 'Forecast', url: `${prefix}/forecast`, icon: BarChart3 },
          ],
        },
      ],
    },
  ];
}

function getServiceModules(prefix: string): RailModule[] {
  return [
    {
      key: 'home',
      label: 'Home',
      shortLabel: 'Home',
      icon: LayoutDashboard,
      directUrl: `${prefix}/dashboard`,
      sections: [{ key: 'home_nav', label: 'Navegação', items: [{ title: 'Dashboard', url: `${prefix}/dashboard`, icon: LayoutDashboard }] }],
    },
    {
      key: 'inbox',
      label: 'Inbox',
      shortLabel: 'Inbox',
      icon: Inbox,
      sections: [
        {
          key: 'atendimento_core',
          label: 'Central',
          items: [
            { title: 'Inbox Omnichannel', url: `${prefix}/inbox`, icon: Inbox },
            { title: 'Tickets', url: `${prefix}/tickets`, icon: Ticket },
            { title: 'Filas', url: `${prefix}/queues`, icon: Layers },
            { title: 'Qualidade & NPS', url: `${prefix}/qa`, icon: ClipboardList },
          ],
        },
      ],
    },
    {
      key: 'canais',
      label: 'Canais',
      shortLabel: 'Canais',
      icon: Radio,
      sections: [
        {
          key: 'atendimento_channels',
          label: 'Canais',
          items: [
            { title: 'Social Inbox', url: `${prefix}/social`, icon: Globe },
            { title: 'WhatsApp', url: `${prefix}/whatsapp`, icon: MessageSquare },
            { title: 'Chat Widgets', url: `${prefix}/chat-widgets`, icon: Radio },
            { title: 'Telefonia', url: `${prefix}/voice`, icon: Headphones },
          ],
        },
      ],
    },
    {
      key: 'kb',
      label: 'Conhecimento',
      shortLabel: 'KB',
      icon: BookOpen,
      sections: [
        {
          key: 'atendimento_extra',
          label: 'Mais',
          items: [
            { title: 'Analytics', url: `${prefix}/analytics`, icon: FileBarChart },
            { title: 'Base de Conhecimento', url: `${prefix}/knowledge`, icon: BookOpen },
            { title: 'Customer Success', url: `${prefix}/customer-success`, icon: Heart },
          ],
        },
      ],
    },
  ];
}

function getMarketingModules(prefix: string): RailModule[] {
  return [
    {
      key: 'home',
      label: 'Home',
      shortLabel: 'Home',
      icon: LayoutDashboard,
      directUrl: `${prefix}/dashboard`,
      sections: [{ key: 'home_nav', label: 'Navegação', items: [{ title: 'Dashboard', url: `${prefix}/dashboard`, icon: LayoutDashboard }] }],
    },
    {
      key: 'campanhas',
      label: 'Campanhas',
      shortLabel: 'Campanhas',
      icon: Megaphone,
      sections: [
        {
          key: 'mkt_core',
          label: 'Campanhas',
          items: [
            { title: 'Campanhas', url: `${prefix}/campaigns`, icon: Mail },
            { title: 'Segmentos', url: `${prefix}/segments`, icon: Filter },
            { title: 'Jornadas', url: `${prefix}/journeys`, icon: Route },
          ],
        },
      ],
    },
    {
      key: 'config',
      label: 'Configuração',
      shortLabel: 'Config',
      icon: Settings,
      sections: [
        {
          key: 'mkt_config',
          label: 'Configuração',
          items: [
            { title: 'Provedores', url: `${prefix}/providers`, icon: Send },
            { title: 'Preferências', url: `${prefix}/preference-center`, icon: SlidersHorizontal },
            { title: 'Personalização', url: `${prefix}/personalization`, icon: Sparkles },
            { title: 'Intelligence', url: `${prefix}/intelligence`, icon: Brain },
            { title: 'Templates de Email', url: `${prefix}/email-templates`, icon: Mail },
          ],
        },
      ],
    },
  ];
}

function getCommerceModules(prefix: string): RailModule[] {
  return [
    {
      key: 'home',
      label: 'Home',
      shortLabel: 'Home',
      icon: LayoutDashboard,
      directUrl: `${prefix}/dashboard`,
      sections: [{ key: 'home_nav', label: 'Navegação', items: [{ title: 'Dashboard', url: `${prefix}/dashboard`, icon: LayoutDashboard }] }],
    },
    {
      key: 'operacoes',
      label: 'Operações',
      shortLabel: 'Operações',
      icon: ShoppingCart,
      sections: [
        {
          key: 'commerce_core',
          label: 'Operações',
          items: [
            { title: 'Pedidos', url: `${prefix}/orders`, icon: ShoppingCart },
            { title: 'Devoluções', url: `${prefix}/returns`, icon: RotateCcw },
            { title: 'Promoções', url: `${prefix}/promotions`, icon: Tag },
          ],
        },
      ],
    },
  ];
}

function getITSMModules(prefix: string): RailModule[] {
  return [
    {
      key: 'home',
      label: 'Home',
      shortLabel: 'Home',
      icon: LayoutDashboard,
      directUrl: `${prefix}/dashboard`,
      sections: [{ key: 'home_nav', label: 'Navegação', items: [{ title: 'Dashboard', url: `${prefix}/dashboard`, icon: LayoutDashboard }] }],
    },
    {
      key: 'incidents',
      label: 'Gestão de TI',
      shortLabel: 'TI',
      icon: Server,
      sections: [
        {
          key: 'ti_core',
          label: 'Gestão de TI',
          items: [
            { title: 'Incidentes', url: `${prefix}/incidents`, icon: AlertTriangle },
            { title: 'Mudanças', url: `${prefix}/changes`, icon: GitBranch },
            { title: 'CMDB', url: `${prefix}/cmdb`, icon: Database },
            { title: 'Ativos', url: `${prefix}/assets`, icon: Package },
          ],
        },
      ],
    },
  ];
}

// ─── Main export ───────────────────────────────────────────────────

export function getAppSidebarModules(appSlug: AppSlug | null, prefix: string): RailModule[] {
  const shared = getSharedModules(prefix);

  switch (appSlug) {
    case 'crm':
      return [...getCRMModules(prefix), ...shared];
    case 'service':
      return [...getServiceModules(prefix), ...shared];
    case 'marketing':
      return [...getMarketingModules(prefix), ...shared];
    case 'commerce':
      return [...getCommerceModules(prefix), ...shared];
    case 'itsm':
      return [...getITSMModules(prefix), ...shared];
    default:
      return [...getCRMModules('/app/crm'), ...shared];
  }
}
