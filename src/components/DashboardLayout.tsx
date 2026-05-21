import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  MapPin,
  Package,
  Search,
  FileText,
  Settings,
  Users,
  BarChart3,
  Building2,
  Bell,
  LogOut,
  Shield
} from 'lucide-react';
import Logo from './Logo';
import { Button } from './ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationBell from './NotificationBell';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Kivro Addresses', url: '/dashboard/addresses', icon: MapPin },
  { title: 'Packages', url: '/dashboard/packages', icon: Package },
  { title: 'Track Package', url: '/dashboard/track', icon: Search },
  { title: 'Government Services', url: '/dashboard/services', icon: Building2 },
  { title: 'Reports', url: '/dashboard/reports', icon: BarChart3 },
  { title: 'Users', url: '/dashboard/users', icon: Users },
  { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
];

const adminMenuItems = [
  { title: 'Admin Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'User Management', url: '/admin/users', icon: Users },
  { title: 'Package Management', url: '/admin/packages', icon: Package },
  { title: 'Address Management', url: '/admin/addresses', icon: MapPin },
  { title: 'Government Services', url: '/admin/services', icon: Building2 },
  { title: 'System Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Security Center', url: '/admin/security', icon: Shield },
  { title: 'Notifications', url: '/admin/notifications', icon: Bell },
  { title: 'System Settings', url: '/admin/settings', icon: Settings },
];

function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  // Determine if we're in admin mode
  const isAdminMode = currentPath.startsWith('/admin');
  const currentMenuItems = isAdminMode ? adminMenuItems : menuItems;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Logout Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logged Out Successfully",
        description: "You have been logged out.",
      });

      navigate('/auth', { replace: true });
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar overflow-y-auto">
        <div className="p-4 border-b border-sidebar-border">
          <Logo size={collapsed ? 'sm' : 'md'} className="justify-center" />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 px-4 py-2">
            {isAdminMode ? 'Admin Panel' : 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {currentMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          {isAdminMode ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {!collapsed && 'Logout'}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              asChild
            >
              <NavLink to='/admin'>
                Admin Panel
              </NavLink>
            </Button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Logout Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Clear any additional stored data
      localStorage.clear();
      sessionStorage.clear();
      
      toast({
        title: "Logged Out Successfully",
        description: "You have been logged out of your account.",
      });

      // Navigate to auth page
      navigate('/auth', { replace: true });
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "An unexpected error occurred during logout.",
        variant: "destructive"
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-14 sm:h-16 border-b border-border bg-card flex items-center justify-between px-3 sm:px-4 md:px-6 flex-shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <SidebarTrigger />
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">
                {location.pathname.startsWith('/admin') ? 'Kivro Admin Panel' : 'Kivro Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <NotificationBell />
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-2 sm:p-4 md:p-6 bg-muted/30 overflow-auto">
            <div className="max-w-full min-h-0 w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}