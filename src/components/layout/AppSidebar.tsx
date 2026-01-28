import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  FileText,
  Package,
  Map,
  Zap,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Flame,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
];

const salesNavItems = [
  { title: 'Leads', url: '/leads', icon: Target },
  { title: 'Accounts', url: '/accounts', icon: Building2 },
  { title: 'Contacts', url: '/contacts', icon: Users },
  { title: 'Opportunities', url: '/opportunities', icon: TrendingUp },
  { title: 'Quotes', url: '/quotes', icon: FileText },
];

const managementNavItems = [
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Territories', url: '/territories', icon: Map },
  { title: 'Cadences', url: '/cadences', icon: Zap },
  { title: 'Forecast', url: '/forecast', icon: BarChart3 },
];

const settingsNavItems = [
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const collapsed = state === 'collapsed';

  const [salesOpen, setSalesOpen] = useState(true);
  const [managementOpen, setManagementOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  const renderNavItem = (item: { title: string; url: string; icon: any }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isActive(item.url) && 'bg-sidebar-accent text-sidebar-primary'
          )}
          activeClassName="bg-sidebar-accent text-sidebar-primary"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">Fireware</span>
              <span className="text-xs text-sidebar-foreground/60">CRM Sales</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sales */}
        <SidebarGroup>
          <Collapsible open={salesOpen} onOpenChange={setSalesOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                <span className={cn(!collapsed && 'flex-1')}>
                  {!collapsed && 'Sales'}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      salesOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {salesNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup>
          <Collapsible open={managementOpen} onOpenChange={setManagementOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:text-sidebar-foreground">
                <span className={cn(!collapsed && 'flex-1')}>
                  {!collapsed && 'Management'}
                </span>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      managementOpen && 'rotate-180'
                    )}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : profile?.email}
              </span>
              <span className="truncate text-xs capitalize text-sidebar-foreground/60">
                {profile?.role || 'User'}
              </span>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
