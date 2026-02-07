import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from '@/components/icons';

// Module hero images for empty state backgrounds
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

type ModuleTheme =
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

interface EmptyStateIllustrationProps {
  module: ModuleTheme;
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyStateIllustration({
  module,
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateIllustrationProps) {
  const image = MODULE_IMAGES[module];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col items-center text-center">
          {/* Mini hero image */}
          <div className="relative w-full h-[100px] overflow-hidden">
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40 dark:opacity-30"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card" />
          </div>

          {/* Content */}
          <div className="px-6 pb-8 -mt-6 relative z-10 space-y-3">
            {icon && (
              <div className="inline-flex items-center justify-center rounded-xl bg-muted/80 p-3 shadow-elevation-1 backdrop-blur-sm">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground max-w-md">{description}</p>
            )}
            {actionLabel && onAction && (
              <Button onClick={onAction} className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
