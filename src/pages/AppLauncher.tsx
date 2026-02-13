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
      <div className="al-wrapper al-wrapper--loading">
        <div className="al-loading">
          <Loader2 className="al-loading-icon" />
          <p className="al-loading-text">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="al-wrapper">
      {/* ── Topbar ── */}
      <header className="al-topbar">
        <img src={crPlatformLogo} alt="CR Platform" className="al-topbar-logo" />
        <div className="al-topbar-right">
          <div className="al-topbar-user">
            <span className="al-topbar-user-name">
              {profile?.first_name} {profile?.last_name}
            </span>
            <span className="al-topbar-user-email">{profile?.email}</span>
          </div>
          <Avatar className="al-topbar-avatar">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="al-topbar-avatar-fallback">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <button onClick={signOut} className="al-topbar-logout" title="Sair">
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="al-content">
        {/* Heading */}
        <section className="al-heading">
          <h1 className="al-heading-title">
            {getGreeting()}, <span className="al-heading-name">{profile?.first_name || 'Usuário'}</span>
          </h1>
          <p className="al-heading-sub">Selecione um aplicativo para continuar</p>
        </section>

        {/* Search */}
        {availableApps.length > 3 && (
          <div className="al-search-wrapper">
            <Search className="al-search-icon" />
            <input
              type="text"
              placeholder="Buscar aplicativos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="al-search-input"
            />
          </div>
        )}

        {/* Grid */}
        <div className="al-grid">
          {filteredApps.map((app, idx) => {
            const Icon = ICON_MAP[app.iconName] || TrendingUp;
            const isRecent = recentSlugs[0] === app.slug;

            return (
              <button
                key={app.slug}
                onClick={() => switchApp(app.slug)}
                className="al-card"
                style={{ animationDelay: `${idx * 60}ms` } as React.CSSProperties}
              >
                <div className="al-card-icon-wrap">
                  <Icon className="al-card-icon-svg" weight="fill" />
                </div>
                <span className="al-card-name">
                  {app.name.replace('CR Platform ', '')}
                </span>
                {isRecent && <span className="al-card-tag">Recente</span>}
              </button>
            );
          })}
        </div>

        {filteredApps.length === 0 && search && (
          <div className="al-empty">
            <p>Nenhum aplicativo encontrado para "<strong>{search}</strong>"</p>
          </div>
        )}

        {/* Footer */}
        <footer className="al-footer">
          <img
            src={poweredByFireware}
            alt="Powered by Fireware"
            className="al-footer-logo"
          />
        </footer>
      </main>
    </div>
  );
}
