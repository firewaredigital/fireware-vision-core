import { useEffect, useMemo, useState } from 'react';
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
  ArrowRight,
  Clock,
  Search,
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
  const [search, setSearch] = useState('');
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

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

  const filteredApps = useMemo(() => {
    if (!search.trim()) return availableApps;
    const q = search.toLowerCase();
    return availableApps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q)
    );
  }, [availableApps, search]);

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (authLoading || isLoading) {
    return (
      <div className="app-launcher-wrapper">
        <div className="flex flex-col items-center gap-5">
          <div className="app-launcher-loading-ring">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse tracking-wide">
            Carregando plataforma...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-launcher-wrapper">
      {/* Subtle grid pattern background */}
      <div className="app-launcher-bg-pattern" />

      {/* Header */}
      <header className="app-launcher-header">
        <div className="app-launcher-header-inner">
          <img
            src={crPlatformLogo}
            alt="CR Platform"
            className="h-7 object-contain"
          />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[13px] font-medium text-foreground leading-tight">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-[11px] text-muted-foreground">{profile?.email}</p>
            </div>
            <Avatar className="h-9 w-9 ring-2 ring-border">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Sair"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-launcher-main">
        {/* Hero section */}
        <div className="app-launcher-hero">
          <div className="app-launcher-hero-greeting">
            <h1 className="app-launcher-hero-title">
              {getGreeting()},{' '}
              <span className="text-primary">{profile?.first_name || 'Usuário'}</span>
            </h1>
            <p className="app-launcher-hero-subtitle">
              Selecione um aplicativo para começar
            </p>
          </div>

          {/* Search */}
          {availableApps.length > 3 && (
            <div className="app-launcher-search">
              <Search className="app-launcher-search-icon" />
              <input
                type="text"
                placeholder="Buscar aplicativos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="app-launcher-search-input"
              />
            </div>
          )}
        </div>

        {/* Recent apps badge */}
        {recentSlugs.length > 0 && !search && (
          <div className="app-launcher-recent-label">
            <Clock className="h-3.5 w-3.5" />
            <span>Acessado recentemente</span>
          </div>
        )}

        {/* App Grid */}
        <div className="app-launcher-grid">
          {filteredApps.map((app, idx) => {
            const Icon = ICON_MAP[app.iconName] || TrendingUp;
            const isRecent = recentSlugs[0] === app.slug;
            const isHovered = hoveredApp === app.slug;

            return (
              <button
                key={app.slug}
                onClick={() => switchApp(app.slug)}
                onMouseEnter={() => setHoveredApp(app.slug)}
                onMouseLeave={() => setHoveredApp(null)}
                className="app-launcher-card-v2"
                style={{
                  animationDelay: `${idx * 60}ms`,
                  '--app-accent': `hsl(${app.accentColor})`,
                  '--app-accent-alpha': `hsl(${app.accentColor} / 0.1)`,
                  '--app-accent-alpha-2': `hsl(${app.accentColor} / 0.06)`,
                } as React.CSSProperties}
              >
                {/* Accent top bar */}
                <div className="app-launcher-card-accent-bar" />

                {/* Card content */}
                <div className="app-launcher-card-body">
                  <div className="app-launcher-card-icon-wrapper">
                    <Icon className="h-6 w-6" weight="duotone" />
                  </div>

                  <div className="app-launcher-card-info">
                    <div className="flex items-center gap-2">
                      <h3 className="app-launcher-card-title">{app.name}</h3>
                      {isRecent && (
                        <span className="app-launcher-card-badge">Recente</span>
                      )}
                    </div>
                    <p className="app-launcher-card-desc">{app.description}</p>
                  </div>

                  <div className="app-launcher-card-arrow">
                    <ArrowRight
                      className="h-4 w-4"
                      weight={isHovered ? 'bold' : 'regular'}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredApps.length === 0 && search && (
          <div className="app-launcher-empty">
            <Search className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mt-3">
              Nenhum app encontrado para "{search}"
            </p>
          </div>
        )}

        {/* Powered by */}
        <footer className="app-launcher-footer">
          <img
            src={poweredByFireware}
            alt="Powered by Fireware"
            className="h-6 object-contain opacity-30 hover:opacity-50 transition-opacity"
          />
        </footer>
      </main>
    </div>
  );
}
