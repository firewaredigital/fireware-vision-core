import type { ModuleKey } from '@/hooks/useModuleAccess';

export type AppSlug = 'crm' | 'service' | 'marketing' | 'commerce' | 'itsm';

export interface AppDefinition {
  slug: AppSlug;
  name: string;
  description: string;
  moduleKey: ModuleKey;
  defaultRoute: string;
  /** HSL accent color for branding (without hsl() wrapper) */
  accentColor: string;
  /** Icon name from Phosphor */
  iconName: string;
}

export const APP_DEFINITIONS: AppDefinition[] = [
  {
    slug: 'crm',
    name: 'CR Platform CRM',
    description: 'Pipeline, Leads, Contas, Oportunidades, Propostas e Contratos',
    moduleKey: 'sales',
    defaultRoute: '/app/crm/dashboard',
    accentColor: '217 91% 60%',
    iconName: 'TrendingUp',
  },
  {
    slug: 'service',
    name: 'CR Platform Service',
    description: 'Tickets, Inbox Omnichannel, WhatsApp, Base de Conhecimento',
    moduleKey: 'service',
    defaultRoute: '/app/service/dashboard',
    accentColor: '173 80% 40%',
    iconName: 'Headphones',
  },
  {
    slug: 'marketing',
    name: 'CR Platform Marketing',
    description: 'Campanhas, Jornadas, Segmentação, Email Templates',
    moduleKey: 'marketing',
    defaultRoute: '/app/marketing/dashboard',
    accentColor: '280 67% 57%',
    iconName: 'Megaphone',
  },
  {
    slug: 'commerce',
    name: 'CR Platform Commerce',
    description: 'Pedidos, Devoluções, Promoções e Catálogo',
    moduleKey: 'commerce',
    defaultRoute: '/app/commerce/dashboard',
    accentColor: '25 95% 53%',
    iconName: 'ShoppingCart',
  },
  {
    slug: 'itsm',
    name: 'CR Platform ITSM',
    description: 'Incidentes, Mudanças, CMDB e Gestão de Ativos',
    moduleKey: 'itsm',
    defaultRoute: '/app/itsm/dashboard',
    accentColor: '215 14% 50%',
    iconName: 'Server',
  },
];

export function getAppBySlug(slug: string): AppDefinition | undefined {
  return APP_DEFINITIONS.find((a) => a.slug === slug);
}

export const LAST_APP_KEY = 'fireware-last-app';
export const RECENT_APPS_KEY = 'fireware-recent-apps';
