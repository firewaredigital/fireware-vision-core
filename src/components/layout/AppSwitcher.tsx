import { useEffect, useState } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Headphones,
  Megaphone,
  ShoppingCart,
  Server,
  LayoutGrid,
} from '@/components/icons';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp,
  Headphones,
  Megaphone,
  ShoppingCart,
  Server,
};

export function AppSwitcher() {
  const { currentApp, availableApps, switchApp } = useAppContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Keyboard shortcut Ctrl+Shift+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Alternar App (Ctrl+Shift+A)"
          className="relative"
        >
          <LayoutGrid className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1.5 mb-1">
          Aplicativos
        </div>
        {availableApps.map((app) => {
          const Icon = ICON_MAP[app.iconName] || TrendingUp;
          const isActive = currentApp?.slug === app.slug;
          return (
            <button
              key={app.slug}
              onClick={() => {
                switchApp(app.slug);
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 w-full px-2 py-2.5 rounded-lg text-left transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted/60'
              )}
            >
              <div
                className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
                style={{
                  background: `hsl(${app.accentColor} / 0.12)`,
                  color: `hsl(${app.accentColor})`,
                }}
              >
                <Icon className="h-4 w-4" weight="duotone" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{app.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{app.description}</p>
              </div>
            </button>
          );
        })}
        <div className="border-t mt-1 pt-1">
          <button
            onClick={() => {
              navigate('/apps');
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <LayoutGrid className="h-4 w-4" />
            Ver todos os apps
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
