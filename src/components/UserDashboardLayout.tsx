import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  MapPin,
  CreditCard,
  Settings,
  User as UserIcon,
  LogOut,
  Share2,
  Mail,
  Receipt,
  Menu,
  X as CloseIcon,
  Bell,
  LifeBuoy,
  Home,
  Users,
  Building2,
  ChevronDown
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfile {
  full_name: string;
  user_type?: string;
}

interface Sender {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  type: 'government' | 'company';
  message_count: number;
}

const UserDashboardLayout = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [senders, setSenders] = useState<Sender[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }
        setUser(session.user);
        await fetchProfile(session.user.id);
        await fetchUnreadCount(session.access_token);
      } catch (error) {
        setLoading(false);
        toast({
          title: "Session Error",
          description: "Unable to load your session. Please try logging in again.",
          variant: "destructive"
        });
        navigate('/auth');
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchUnreadCount(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, user_type')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // Create a default profile if it doesn't exist
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              display_name: 'New User',
              user_type: 'user'
            })
            .select()
            .single();
          
          if (createError) {
            setProfileError(true);
            // Use fallback profile
            setProfile({
              full_name: 'User',
              user_type: 'user'
            });
          } else {
            setProfile({
              full_name: newProfile.display_name || 'New User',
              user_type: newProfile.user_type || 'user'
            });
          }
        } else {
          setProfileError(true);
          // Use fallback profile to prevent infinite loading
          setProfile({
            full_name: 'User',
            user_type: 'user'
          });
        }
      } else if (data) {
        setProfile({
          full_name: (data as any).display_name || 'User',
          user_type: (data as any).user_type || 'user'
        });
        setProfileError(false);
      }
    } catch (err) {
      setProfileError(true);
      // Use fallback profile
      setProfile({
        full_name: 'User',
        user_type: 'user'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async (accessToken: string) => {
    try {
      // Fetch notification count from Supabase
      const { data, error } = await (supabase.rpc as any)('get_unread_notification_count');
      
      if (error) {
        return;
      }
      
      setUnreadCount(typeof data === 'number' ? data : 0);
    } catch (error) {
    }
  };

  const fetchSenders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/inbox/senders`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.status === 401) {
        // Don't redirect automatically - just log the warning
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setSenders(data.data.senders || []);
      }
    } catch (error) {
      // Silently fail - don't break the UI
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSenderDropdown(false);
      }
    };

    if (showSenderDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSenderDropdown]);

  // Fetch senders when component mounts
  useEffect(() => {
    if (user) {
      fetchSenders();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/dashboard/addresses', icon: MapPin, label: 'Virtual Address' },
    { to: '/dashboard/inbox', icon: Mail, label: 'Inbox', badge: unreadCount },
    { to: '/dashboard/subscription', icon: CreditCard, label: 'Subscription' },
    { to: '/dashboard/payments', icon: CreditCard, label: 'Payment Request' },
    { to: '/dashboard/receipts', icon: Receipt, label: 'Receipts' },
    { to: '/dashboard/shared', icon: Users, label: 'Shared' },
    { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  const SidebarNav = ({ items, className }: { items: typeof navItems, className?: string }) => (
    <nav className={`flex flex-col gap-1 ${className}`}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/dashboard'}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-4 py-3 text-gray-900 text-[15px] font-normal transition-all hover:bg-gray-50 ${isActive ? 'bg-green-50 text-green-600' : ''}`
          }
          onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
        >
          <item.icon className={`h-5 w-5 ${item.to === '/dashboard' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{item.badge}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  // Show dashboard even if profile has errors, using fallback data
  const displayName = profile?.full_name || 'User';

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[256px_1fr] bg-gray-50">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:static lg:block lg:translate-x-0 shadow-xl lg:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full max-h-screen flex-col">
          <div className="relative flex h-24 items-center justify-center px-6 border-b border-gray-200 bg-gradient-to-br from-green-50 via-white to-green-50/50">
            <NavLink to="/" className="flex items-center justify-center group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <img 
                  src="/kivro-logo.jpg" 
                  alt="KIVRO Logo" 
                  className="relative h-14 w-auto object-contain rounded-xl shadow-lg ring-2 ring-white/50 group-hover:ring-green-500/50 transition-all duration-300 group-hover:scale-105"
                />
              </div>
            </NavLink>
            <Button variant="ghost" size="icon" className="absolute right-4 h-8 w-8 lg:hidden hover:bg-green-100 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              <CloseIcon className="h-4 w-4" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <div className="flex-1 py-6 px-4">
            <SidebarNav items={navItems} />
          </div>
          <div className="mt-auto p-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/help')}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-900 text-[15px] font-normal transition-all hover:bg-gray-50"
            >
              <LifeBuoy className="h-5 w-5 stroke-[2]" />
              <span>Help Center</span>
            </button>
            <button
              onClick={() => {
                handleLogout();
                isMobileMenuOpen && setIsMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-600 text-[15px] font-normal transition-all hover:bg-red-50 mt-1"
            >
              <LogOut className="h-5 w-5 stroke-[2]" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 sticky top-0 z-10 shadow-sm">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
          
          {/* Breadcrumb/Page Title */}
          <div className="flex items-center gap-2 text-sm">
            <Home className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700 font-medium">Home</span>
          </div>

          <div className="flex-1" />
          
          {/* User Profile Dropdown */}
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowSenderDropdown(!showSenderDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-xs">
                {displayName.split(' ').map(n => n.charAt(0).toUpperCase()).join('').slice(0, 2)}
              </div>
              <span className="text-sm font-medium text-gray-900 hidden sm:block">{displayName}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showSenderDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Sender Dropdown */}
            {showSenderDropdown && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">My Senders</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Companies & agencies you've received messages from</p>
                </div>
                
                {senders.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No senders yet</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {senders.map((sender) => (
                      <button
                        key={sender.id}
                        onClick={() => {
                          navigate('/dashboard/inbox');
                          setShowSenderDropdown(false);
                          // You can add logic here to filter inbox by sender
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          {sender.logo_url ? (
                            <img 
                              src={sender.logo_url} 
                              alt={sender.name}
                              className="w-full h-full object-contain rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <Building2 
                            className="w-5 h-5 text-blue-600" 
                            style={{ display: sender.logo_url ? 'none' : 'block' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{sender.name}</p>
                          <p className="text-xs text-gray-500">
                            {sender.message_count} message{sender.message_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="border-t border-gray-100 mt-1">
                  <button
                    onClick={() => {
                      navigate('/dashboard/inbox');
                      setShowSenderDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors text-center font-medium"
                  >
                    View All in Inbox
                  </button>
                </div>
              </div>
            )}
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
              <span>Digital Address System</span>
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

export default UserDashboardLayout;
