import { Plus, Moon, Sun, Monitor, Menu } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotificationCenter } from '@/components/NotificationCenter';
import { AppSwitcher } from '@/components/layout/AppSwitcher';
import { useAppContext } from '@/hooks/useAppContext';
import { useTheme } from 'next-themes';

interface AppTopbarProps {
  showHamburger?: boolean;
  onHamburgerClick?: () => void;
}

export function AppTopbar({ showHamburger, onHamburgerClick }: AppTopbarProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { prefix, currentApp } = useAppContext();

  const themeIcon = theme === 'dark' 
    ? <Sun className="h-4 w-4" /> 
    : theme === 'light' 
      ? <Moon className="h-4 w-4" /> 
      : <Monitor className="h-4 w-4" />;

  const themeLabel = theme === 'dark'
    ? 'Escuro'
    : theme === 'light'
      ? 'Claro'
      : 'Sistema';

  return (
    <header className="sticky top-0 z-40 flex h-[72px] items-center gap-4 bg-card/80 backdrop-blur-xl px-6 shadow-[0_1px_0_hsl(var(--border))]">
      {/* Mobile Hamburger */}
      {showHamburger && (
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2"
          onClick={onHamburgerClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* App name badge */}
      {currentApp && (
        <div className="hidden md:flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: `hsl(${currentApp.accentColor})` }}
          />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {currentApp.name.replace('CR Platform ', '')}
          </span>
        </div>
      )}

      {/* Global Search — centered & prominent */}
      <div className="flex-1 flex justify-center">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Create */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Criar</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Criar Rápido</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`${prefix}/leads/new`)}>
              Novo Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`${prefix}/accounts/new`)}>
              Nova Conta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`${prefix}/contacts/new`)}>
              Novo Contato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`${prefix}/opportunities/new`)}>
              Nova Oportunidade
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`${prefix}/quotes/new`)}>
              Nova Proposta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* App Switcher (waffle) */}
        <AppSwitcher />

        {/* Notifications */}
        <NotificationCenter />

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title={`Tema: ${themeLabel}`}>
              {themeIcon}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuLabel>Tema</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTheme('light')}
              className={theme === 'light' ? 'bg-accent' : ''}
            >
              <Sun className="h-4 w-4 mr-2" />
              Claro
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('dark')}
              className={theme === 'dark' ? 'bg-accent' : ''}
            >
              <Moon className="h-4 w-4 mr-2" />
              Escuro
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('system')}
              className={theme === 'system' ? 'bg-accent' : ''}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
