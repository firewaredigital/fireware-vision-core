import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, Search } from '@/components/icons';
import { NavLink } from '@/components/NavLink';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { useAppContext } from '@/hooks/useAppContext';
import { cn } from '@/lib/utils';
import sidebarFirewareIcon from '@/assets/sidebar-fireware-icon.png';
import { getAppSidebarModules, type RailModule } from './AppSidebarConfig';

// ─── Route → Rail Key Mapping ──────────────────────────────────────

function getRailKeyFromPath(pathname: string, modules: RailModule[]): string {
  // Check each module's sections for a matching URL
  for (const mod of modules) {
    if (mod.directUrl && pathname.startsWith(mod.directUrl)) return mod.key;
    for (const section of mod.sections) {
      for (const item of section.items) {
        if (pathname === item.url || pathname.startsWith(item.url + '/')) {
          return mod.key;
        }
      }
    }
  }
  return modules[0]?.key || 'home';
}

// ─── Component ─────────────────────────────────────────────────────

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { isModuleEnabled, isLoading: modulesLoading } = useModuleAccess();
  const { currentApp, prefix } = useAppContext();

  // Get sidebar modules for current app
  const RAIL_MODULES = useMemo(
    () => getAppSidebarModules(currentApp?.slug || null, prefix || '/app/crm'),
    [currentApp?.slug, prefix]
  );

  // Derive active rail from current route
  const activeRailFromRoute = useMemo(
    () => getRailKeyFromPath(location.pathname, RAIL_MODULES),
    [location.pathname, RAIL_MODULES]
  );

  const [selectedRail, setSelectedRail] = useState(activeRailFromRoute);
  const [searchQuery, setSearchQuery] = useState('');
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

  const activeModule = useMemo(
    () => RAIL_MODULES.find((m) => m.key === selectedRail),
    [selectedRail, RAIL_MODULES]
  );

  const visibleSections = useMemo(() => {
    if (!activeModule) return [];
    return activeModule.sections.filter((section) => {
      if (!section.moduleKey) return true;
      if (modulesLoading) return true;
      return isModuleEnabled(section.moduleKey);
    });
  }, [activeModule, isModuleEnabled, modulesLoading]);

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
        <div className="sidebar-rail-logo">
          <img
            src={sidebarFirewareIcon}
            alt="Fireware"
            className="h-8 w-8 object-contain"
          />
        </div>

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

      {/* ═══ CONTENT PANEL (Right) ═══ */}
      <div className="sidebar-content-panel">
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
                {visibleSections.length > 1 && (
                  <span className="sidebar-group-label">{section.label}</span>
                )}

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
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 z-50 animate-in slide-in-from-left duration-300">
        <AppSidebar />
      </div>
    </>
  );
}
