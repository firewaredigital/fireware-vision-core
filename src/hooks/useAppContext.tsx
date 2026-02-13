import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { APP_DEFINITIONS, getAppBySlug, LAST_APP_KEY, RECENT_APPS_KEY, type AppSlug, type AppDefinition } from '@/config/apps';
import { useModuleAccess } from '@/hooks/useModuleAccess';

interface AppContextValue {
  /** Currently active app derived from URL, or null if on /apps or non-app route */
  currentApp: AppDefinition | null;
  /** All apps the user's org has access to */
  availableApps: AppDefinition[];
  /** Loading state of module access */
  isLoading: boolean;
  /** Navigate to a specific app */
  switchApp: (slug: AppSlug) => void;
  /** Check if an app is enabled */
  isAppEnabled: (slug: AppSlug) => boolean;
  /** Get the route prefix for the current app */
  prefix: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isModuleEnabled, isLoading } = useModuleAccess();

  // Derive current app from URL: /app/{slug}/...
  const currentApp = useMemo(() => {
    const match = location.pathname.match(/^\/app\/([^/]+)/);
    if (!match) return null;
    return getAppBySlug(match[1]) || null;
  }, [location.pathname]);

  const prefix = currentApp ? `/app/${currentApp.slug}` : '';

  const availableApps = useMemo(() => {
    if (isLoading) return APP_DEFINITIONS; // Show all while loading
    return APP_DEFINITIONS.filter((app) => isModuleEnabled(app.moduleKey));
  }, [isModuleEnabled, isLoading]);

  const isAppEnabled = useCallback(
    (slug: AppSlug) => {
      const app = getAppBySlug(slug);
      if (!app) return false;
      if (isLoading) return true;
      return isModuleEnabled(app.moduleKey);
    },
    [isModuleEnabled, isLoading]
  );

  const switchApp = useCallback(
    (slug: AppSlug) => {
      const app = getAppBySlug(slug);
      if (!app) return;
      // Save to localStorage
      localStorage.setItem(LAST_APP_KEY, slug);
      // Update recent apps
      try {
        const recent: string[] = JSON.parse(localStorage.getItem(RECENT_APPS_KEY) || '[]');
        const updated = [slug, ...recent.filter((s) => s !== slug)].slice(0, 5);
        localStorage.setItem(RECENT_APPS_KEY, JSON.stringify(updated));
      } catch {}
      navigate(app.defaultRoute);
    },
    [navigate]
  );

  const value = useMemo<AppContextValue>(
    () => ({ currentApp, availableApps, isLoading, switchApp, isAppEnabled, prefix }),
    [currentApp, availableApps, isLoading, switchApp, isAppEnabled, prefix]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return ctx;
}
