import { Plus, Moon, Sun, Monitor } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
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
import { useTheme } from 'next-themes';

export function AppTopbar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-6">
      <SidebarTrigger className="-ml-2" />

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
            <DropdownMenuItem onClick={() => navigate('/leads/new')}>
              Novo Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/accounts/new')}>
              Nova Conta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/contacts/new')}>
              Novo Contato
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/opportunities/new')}>
              Nova Oportunidade
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/quotes/new')}>
              Nova Proposta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
