import { ReactNode } from 'react';

// Module hero images
import heroSales from '@/assets/modules/hero-sales.png';
import heroService from '@/assets/modules/hero-service.png';
import heroMarketing from '@/assets/modules/hero-marketing.png';
import heroCommerce from '@/assets/modules/hero-commerce.png';
import heroAI from '@/assets/modules/hero-ai.png';
import heroITSM from '@/assets/modules/hero-itsm.png';
import heroData from '@/assets/modules/hero-data.png';
import heroGovernance from '@/assets/modules/hero-governance.png';
import heroIntegrations from '@/assets/modules/hero-integrations.png';
import heroAdmin from '@/assets/modules/hero-admin.png';

export type ModuleTheme =
  | 'sales'
  | 'service'
  | 'marketing'
  | 'commerce'
  | 'ai'
  | 'itsm'
  | 'data'
  | 'governance'
  | 'integrations'
  | 'admin';

const MODULE_IMAGES: Record<ModuleTheme, string> = {
  sales: heroSales,
  service: heroService,
  marketing: heroMarketing,
  commerce: heroCommerce,
  ai: heroAI,
  itsm: heroITSM,
  data: heroData,
  governance: heroGovernance,
  integrations: heroIntegrations,
  admin: heroAdmin,
};

const MODULE_GRADIENTS: Record<ModuleTheme, string> = {
  sales: 'from-blue-950/90 via-blue-900/70 to-blue-800/50',
  service: 'from-teal-950/90 via-teal-900/70 to-teal-800/50',
  marketing: 'from-purple-950/90 via-purple-900/70 to-fuchsia-800/50',
  commerce: 'from-orange-950/90 via-orange-900/70 to-amber-800/50',
  ai: 'from-indigo-950/90 via-blue-900/70 to-blue-800/50',
  itsm: 'from-slate-950/90 via-slate-900/70 to-slate-800/50',
  data: 'from-blue-950/90 via-indigo-900/70 to-violet-800/50',
  governance: 'from-red-950/90 via-red-900/70 to-rose-800/50',
  integrations: 'from-emerald-950/90 via-teal-900/70 to-cyan-800/50',
  admin: 'from-gray-950/90 via-gray-900/70 to-slate-800/50',
};

interface ModuleHeroBannerProps {
  module: ModuleTheme;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  compact?: boolean;
}

export function ModuleHeroBanner({
  module,
  title,
  subtitle,
  actions,
  compact = false,
}: ModuleHeroBannerProps) {
  const image = MODULE_IMAGES[module];
  const gradient = MODULE_GRADIENTS[module];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[20px] shadow-elevation-2 ${
        compact ? 'h-[120px]' : 'h-[180px]'
      }`}
    >
      {/* Background Image */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />

      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradient}`}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-between px-6 md:px-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl drop-shadow-md">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-white/80 md:text-base drop-shadow-sm max-w-xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="hidden md:flex items-center gap-2">{actions}</div>
        )}
      </div>

      {/* Bottom fade for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-background/20 to-transparent" />
    </div>
  );
}
