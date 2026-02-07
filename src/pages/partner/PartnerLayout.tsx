import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Flame, Handshake, LayoutDashboard, DollarSign, BookOpen, User, LogOut, Menu } from '@/components/icons';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface PartnerLayoutProps { children: ReactNode; }

const navItems = [
  { title: 'Dashboard', url: '/partner/dashboard', icon: LayoutDashboard },
  { title: 'Deals', url: '/partner/deals', icon: Handshake },
  { title: 'Comissões', url: '/partner/commissions', icon: DollarSign },
  { title: 'Recursos', url: '/partner/resources', icon: BookOpen },
];

export function PartnerLayout({ children }: PartnerLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isActive = (path: string) => path === '/partner/dashboard' ? location.pathname === path : location.pathname.startsWith(path);
  const handleLogout = () => { localStorage.removeItem('partner_session'); navigate('/partner/login'); };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/partner/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary"><Flame className="h-5 w-5 text-primary-foreground" /></div>
            <div className="hidden md:flex flex-col"><span className="font-bold text-foreground">Portal do Parceiro</span><span className="text-xs text-muted-foreground">Fireware CRM</span></div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.url} to={item.url}>
                <Button variant={isActive(item.url) ? 'secondary' : 'ghost'} className="gap-2"><item.icon className="h-4 w-4" />{item.title}</Button>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2"><Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">P</AvatarFallback></Avatar></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Parceiro</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/partner/profile')}><User className="mr-2 h-4 w-4" />Perfil</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger>
              <SheetContent side="right" className="w-[260px] p-0">
                <nav className="flex-1 p-4 space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.url} to={item.url} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant={isActive(item.url) ? 'secondary' : 'ghost'} className="w-full justify-start gap-2"><item.icon className="h-4 w-4" />{item.title}</Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
      <footer className="border-t py-6"><div className="container text-center text-sm text-muted-foreground">© 2025 Fireware CRM — Portal do Parceiro</div></footer>
    </div>
  );
}
