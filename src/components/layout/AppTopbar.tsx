import { useState } from 'react';
import { Plus, Moon, Sun } from 'lucide-react';
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

export function AppTopbar() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />

      {/* Global Search */}
      <GlobalSearch />

      <div className="flex items-center gap-2 ml-auto">
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

        {/* Notifications - Real-time NotificationCenter */}
        <NotificationCenter />

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
