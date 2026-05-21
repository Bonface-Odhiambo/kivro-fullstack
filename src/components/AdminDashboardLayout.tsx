import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  MapPin,
  Package,
  Users,
  BarChart3,
  Building2,
  Bell,
  LogOut,
  Shield,
  Settings,
  CreditCard,
  Lock,
  Menu,
  X as CloseIcon
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/addresses', icon: MapPin, label: 'Addresses' },
  { to: '/admin/packages', icon: Package, label: 'Packages' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/services', icon: Building2, label: 'Services' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/security', icon: Lock, label: 'Security' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const SidebarNav = ({ items, className, onItemClick }: { items: typeof navItems, className?: string, onItemClick?: () => void }) => (
  <nav className={`flex flex-col gap-1 ${className}`}>
    {items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/admin/dashboard'}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-4 py-3 text-gray-900 text-[15px] font-normal transition-all hover:bg-gray-50 ${isActive ? 'bg-green-50 text-green-600' : ''}`
        }
        onClick={onItemClick}
      >
        <item.icon className="h-5 w-5 stroke-[2]" />
        <span className="flex-1">{item.label}</span>
      </NavLink>
    ))}
  </nav>
);

const AdminDashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication and admin status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/admin/auth', { replace: true });
          return;
        }

        setIsAuthenticated(true);

        // Check if user is admin
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .single();

        if (error || !profile || profile.user_type !== 'admin') {
          toast({
            title: "Access Denied",
            description: "Administrator privileges required.",
            variant: "destructive"
          });
          navigate('/dashboard', { replace: true });
          return;
        }

        setIsAdmin(true);
        setChecking(false);
      } catch (error) {
        navigate('/admin/auth', { replace: true });
      }
    };

    checkAuth();
  }, [navigate, toast]);

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
        title: "✅ Logged Out",
        description: "Admin session ended successfully.",
      });

      navigate('/admin/auth', { replace: true });
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "An unexpected error occurred during logout.",
        variant: "destructive"
      });
    }
  };


  // Show loading while checking authentication
  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Don't render admin panel if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[256px_1fr] bg-gray-50">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:static lg:block lg:translate-x-0 shadow-xl lg:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full max-h-screen flex-col">
          <div className="relative flex h-24 items-center justify-center px-6 border-b border-gray-200 bg-gradient-to-br from-green-50 via-white to-green-50/50">
            <NavLink to="/admin/dashboard" className="flex items-center justify-center group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <img 
                  src="/kivro-logo.jpg" 
                  alt="KIVRO Admin" 
                  className="relative h-14 w-auto object-contain rounded-xl shadow-lg ring-2 ring-white/50 group-hover:ring-green-500/50 transition-all duration-300 group-hover:scale-105"
                />
              </div>
            </NavLink>
            <Button variant="ghost" size="icon" className="absolute right-4 h-8 w-8 lg:hidden hover:bg-green-100 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              <CloseIcon className="h-4 w-4" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <div className="flex-1 py-6 px-4 overflow-y-auto">
            <SidebarNav items={navItems} onItemClick={() => setIsMobileMenuOpen(false)} />
          </div>
          <div className="mt-auto p-4 border-t border-gray-200">
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-600 text-[15px] font-normal transition-all hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 stroke-[2]" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 sticky top-0 z-10 shadow-sm">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
          
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-gray-700 font-medium">Admin Panel</span>
          </div>

          <div className="flex-1" />
          
          <div className="flex items-center gap-3">
            <Badge className="bg-green-50 text-green-700 border-green-200 hidden sm:flex">
              <Shield className="h-3 w-3 mr-1.5" />
              Administrator
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-50">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="border-t bg-white px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-600">KIVRO</span>
              <span>Admin Panel</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">© 2025 All rights reserved</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://kivro.africa" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                Website
              </a>
              <span className="text-gray-300">|</span>
              <a href="https://kivro.africa/help" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                Help Center
              </a>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-500">v2.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
