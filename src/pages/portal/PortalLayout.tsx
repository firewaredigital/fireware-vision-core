import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Flame,
  Ticket,
  BookOpen,
  User,
  LogOut,
  Settings,
  Bell,
  HelpCircle,
  Home,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface PortalLayoutProps {
  children: ReactNode;
}

const navItems = [
  { title: 'Início', url: '/portal', icon: Home },
  { title: 'Meus Tickets', url: '/portal/tickets', icon: Ticket },
  { title: 'Base de Conhecimento', url: '/portal/knowledge', icon: BookOpen },
  { title: 'Central de Ajuda', url: '/portal/help', icon: HelpCircle },
];

export function PortalLayout({ children }: PortalLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/portal') {
      return location.pathname === '/portal';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('portal_session');
    navigate('/portal/login');
  };

  // Mock user data
  const user = {
    name: 'João Silva',
    email: 'joao@empresa.com',
    company: 'Empresa ABC',
    avatar: '',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/portal" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-bold">Portal do Cliente</span>
              <span className="text-xs text-muted-foreground">Fireware CRM</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.url} to={item.url}>
                <Button
                  variant={isActive(item.url) ? 'secondary' : 'ghost'}
                  className={cn(
                    'gap-2',
                    isActive(item.url) && 'bg-secondary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                2
              </span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.company}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/portal/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/portal/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Preferências
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.company}</p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.url}
                        to={item.url}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant={isActive(item.url) ? 'secondary' : 'ghost'}
                          className="w-full justify-start gap-2"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Button>
                      </Link>
                    ))}
                  </nav>
                  <div className="p-4 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            <span>© 2025 Fireware CRM. Todos os direitos reservados.</span>
          </div>
          <div className="flex gap-4">
            <Link to="/portal/terms" className="hover:text-foreground hover:underline">
              Termos de Uso
            </Link>
            <Link to="/portal/privacy" className="hover:text-foreground hover:underline">
              Política de Privacidade
            </Link>
            <Link to="/portal/contact" className="hover:text-foreground hover:underline">
              Fale Conosco
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}