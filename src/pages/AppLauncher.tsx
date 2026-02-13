import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/hooks/useAppContext';
import { LAST_APP_KEY, RECENT_APPS_KEY, type AppSlug } from '@/config/apps';
import {
  TrendingUp,
  Headphones,
  Megaphone,
  ShoppingCart,
  Server,
  LogOut,
  Loader2,
} from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import crPlatformLogo from '@/assets/cr-platform-logo.png';
import poweredByFireware from '@/assets/powered-by-fireware.png';

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp,
  Headphones,
  Megaphone,
  ShoppingCart,
  Server,
};

export default function AppLauncher() {
  const navigate = useNavigate();
  const { profile, signOut, loading: authLoading } = useAuth();
  const { availableApps, isLoading, switchApp } = useAppContext();

  // Auto-redirect if only 1 app available
  useEffect(() => {
    if (!isLoading && availableApps.length === 1) {
      switchApp(availableApps[0].slug);
    }
  }, [isLoading, availableApps, switchApp]);

  const recentSlugs = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_APPS_KEY) || '[]') as string[];
    } catch {
      return [];
    }
  }, []);

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Carregando apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <img src={crPlatformLogo} alt="CR Platform" className="h-8 object-contain" />
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Escolha um aplicativo
          </h1>
          <p className="text-muted-foreground">
            Selecione o app que deseja acessar
          </p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl w-full">
          {availableApps.map((app, idx) => {
            const Icon = ICON_MAP[app.iconName] || TrendingUp;
            const isRecent = recentSlugs[0] === app.slug;
            return (
              <button
                key={app.slug}
                onClick={() => switchApp(app.slug)}
                className="app-launcher-card group"
                style={{
                  animationDelay: `${idx * 80}ms`,
                  '--app-accent': `hsl(${app.accentColor})`,
                } as React.CSSProperties}
              >
                <div
                  className="app-launcher-icon"
                  style={{ background: `hsl(${app.accentColor} / 0.12)`, color: `hsl(${app.accentColor})` }}
                >
                  <Icon className="h-7 w-7" weight="duotone" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-[var(--app-accent)] transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {app.description}
                  </p>
                </div>
                {isRecent && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full self-start">
                    Recente
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Powered by */}
        <div className="mt-16">
          <img src={poweredByFireware} alt="Powered by Fireware" className="h-8 object-contain opacity-40" />
        </div>
      </main>
    </div>
  );
}
