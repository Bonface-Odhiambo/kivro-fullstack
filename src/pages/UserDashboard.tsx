import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Mail, CreditCard, TrendingUp, Package, ArrowRight, Plus } from 'lucide-react';
import { DashboardSkeleton } from '@/components/PageSkeleton';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfile {
  full_name: string;
  phone_number: string;
  user_type?: string;
}

interface UserSubscription {
  status: string;
  expires_at: string | null;
}

const UserDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [addressCount, setAddressCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      await fetchUserData(session.user.id);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/auth');
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, phone_number, user_type')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        const data = profileData as any;
        setProfile({
          full_name: data.display_name || '',
          phone_number: data.phone_number || '',
          user_type: data.user_type || 'user'
        });
      }

      // Fetch subscription (with error handling)
      const { data: subscriptionData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('status, expires_at')
        .eq('user_id', userId)
        .single();

      if (subscriptionData && !subError) {
        setSubscription(subscriptionData);
      } else if (subError) {
        // Set default free subscription
        setSubscription(null);
      }

      // Fetch address count
      const { count } = await supabase
        .from('kivro_addresses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setAddressCount(count || 0);

      // Fetch unread count
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        try {
          const response = await fetch(`${apiUrl}/api/inbox/unread-count`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          const data = await response.json();
          if (data.success) {
            setUnreadCount(data.data.unread_count || 0);
          }
        } catch (error) {
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardSkeleton />
    );
  }

  const isSubscriptionActive = subscription?.status === 'active';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          Welcome Back, {profile?.full_name || user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Here is an overview of your KIVRO account
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2">Virtual Addresses</p>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{addressCount}</div>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2">Subscription</p>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {isSubscriptionActive ? 'Active' : 'Inactive'}
              </div>
              <p className="text-xs text-gray-500">
                {isSubscriptionActive ? 'Active subscription' : 'No active subscription'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2">Account Type</p>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 capitalize">
                {profile?.user_type || 'User'}
              </div>
              <p className="text-xs text-gray-500">
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card 
            className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => navigate('/dashboard/addresses')}
          >
            <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6">
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-600 flex items-center justify-center group-hover:bg-green-700 transition-colors">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">Manage Address</p>
                  <p className="text-xs text-gray-500 mt-1">View and create address</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => navigate('/dashboard/inbox')}
          >
            <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6">
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-600 flex items-center justify-center group-hover:bg-green-700 transition-colors relative">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">Check Inbox</p>
                  <p className="text-xs text-gray-500 mt-1">{unreadCount} Unread message</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-all relative">
            <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6">
              {/* Pay Now button at top right */}
              <button className="absolute top-3 right-3 sm:top-4 sm:right-4 text-xs text-green-600 font-medium hover:underline flex items-center gap-1">
                Pay Now <ArrowRight className="h-3 w-3" />
              </button>
              
              <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-600 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">Payment Request</p>
                  <p className="text-xs text-gray-500 mt-1">0 Payments Due</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Senders Section */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Senders</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* KRA - Shield with K */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <path d="M32 2 L8 14 L8 28 C8 44 18 58 32 62 C46 58 56 44 56 28 L56 14 Z" fill="#006838"/>
                    <text x="32" y="38" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">K</text>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">KRA</p>
              </div>
            </CardContent>
          </Card>

          {/* NTSA - Circle with road */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <circle cx="32" cy="32" r="28" fill="#0066B3"/>
                    <rect x="20" y="28" width="24" height="8" fill="white" rx="2"/>
                    <line x1="22" y1="32" x2="42" y2="32" stroke="#0066B3" strokeWidth="1" strokeDasharray="3,2"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">NTSA</p>
              </div>
            </CardContent>
          </Card>

          {/* Courts - Gavel */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <rect x="8" y="8" width="48" height="48" fill="#8B0000" rx="4"/>
                    <rect x="28" y="20" width="8" height="16" fill="white" rx="2"/>
                    <circle cx="32" cy="20" r="4" fill="white"/>
                    <rect x="20" y="40" width="24" height="4" fill="white" rx="1"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">Courts</p>
              </div>
            </CardContent>
          </Card>

          {/* NHIF - Medical cross */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <circle cx="32" cy="32" r="28" fill="#00A651"/>
                    <rect x="28" y="16" width="8" height="32" fill="white" rx="2"/>
                    <rect x="16" y="28" width="32" height="8" fill="white" rx="2"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">NHIF</p>
              </div>
            </CardContent>
          </Card>

          {/* NSSF - Hexagon */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <polygon points="32,4 52,16 52,40 32,52 12,40 12,16" fill="#1E3A8A"/>
                    <text x="32" y="38" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle">N</text>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">NSSF</p>
              </div>
            </CardContent>
          </Card>

          {/* County Govt - Building */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <rect x="12" y="16" width="40" height="40" fill="#DC2626" rx="2"/>
                    <rect x="20" y="24" width="8" height="8" fill="white"/>
                    <rect x="36" y="24" width="8" height="8" fill="white"/>
                    <rect x="20" y="40" width="8" height="8" fill="white"/>
                    <rect x="36" y="40" width="8" height="8" fill="white"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">County Govt</p>
              </div>
            </CardContent>
          </Card>

          {/* Banks - Dollar sign */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <rect x="8" y="8" width="48" height="48" fill="#7C3AED" rx="8"/>
                    <text x="32" y="44" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle">$</text>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">Banks</p>
              </div>
            </CardContent>
          </Card>

          {/* Insurance - Umbrella */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <circle cx="32" cy="32" r="28" fill="#EA580C"/>
                    <path d="M32 16 C20 16 12 24 12 32 L20 32 C20 28 24 24 32 24 C40 24 44 28 44 32 L52 32 C52 24 44 16 32 16 Z" fill="white"/>
                    <rect x="30" y="32" width="4" height="16" fill="white" rx="1"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">Insurance</p>
              </div>
            </CardContent>
          </Card>

          {/* Utilities - Lightning bolt */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <rect x="8" y="8" width="48" height="48" fill="#0891B2" rx="4"/>
                    <path d="M36 12 L24 32 L32 32 L28 52 L44 28 L36 28 Z" fill="white"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">Utilities</p>
              </div>
            </CardContent>
          </Card>

          {/* Schools - Book */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <rect x="16" y="12" width="32" height="40" fill="#059669" rx="2"/>
                    <rect x="20" y="16" width="24" height="4" fill="white" rx="1"/>
                    <rect x="20" y="24" width="24" height="2" fill="white" rx="1"/>
                    <rect x="20" y="30" width="24" height="2" fill="white" rx="1"/>
                    <rect x="20" y="36" width="16" height="2" fill="white" rx="1"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">Schools</p>
              </div>
            </CardContent>
          </Card>

          {/* Hospitals - H symbol */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <rect x="8" y="8" width="48" height="48" fill="#DC2626" rx="8"/>
                    <text x="32" y="44" fontSize="32" fontWeight="bold" fill="white" textAnchor="middle">H</text>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">Hospitals</p>
              </div>
            </CardContent>
          </Card>

          {/* Police - Badge */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <path d="M32 8 L40 16 L50 16 L50 26 L58 34 L50 42 L50 52 L40 52 L32 60 L24 52 L14 52 L14 42 L6 34 L14 26 L14 16 L24 16 Z" fill="#1E40AF"/>
                    <circle cx="32" cy="32" r="12" fill="white"/>
                    <text x="32" y="38" fontSize="16" fontWeight="bold" fill="#1E40AF" textAnchor="middle">P</text>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">Police</p>
              </div>
            </CardContent>
          </Card>

          {/* Immigration - Passport */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <rect x="16" y="8" width="32" height="48" fill="#16A34A" rx="2"/>
                    <circle cx="32" cy="24" r="6" fill="white"/>
                    <rect x="22" y="34" width="20" height="2" fill="white" rx="1"/>
                    <rect x="22" y="40" width="20" height="2" fill="white" rx="1"/>
                    <rect x="22" y="46" width="12" height="2" fill="white" rx="1"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">Immigration</p>
              </div>
            </CardContent>
          </Card>

          {/* Land Registry - Document */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <rect x="16" y="8" width="32" height="48" fill="#CA8A04" rx="2"/>
                    <rect x="20" y="16" width="24" height="3" fill="white" rx="1"/>
                    <rect x="20" y="24" width="24" height="3" fill="white" rx="1"/>
                    <rect x="20" y="32" width="16" height="3" fill="white" rx="1"/>
                    <path d="M24 42 L28 46 L36 38" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">Land Registry</p>
              </div>
            </CardContent>
          </Card>

          {/* eCitizen - Digital icon */}
          <Card className="bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-16 h-16">
                    <rect x="12" y="16" width="40" height="32" fill="#0066B3" rx="2"/>
                    <rect x="16" y="20" width="32" height="20" fill="white" rx="1"/>
                    <circle cx="32" cy="52" r="2" fill="#0066B3"/>
                    <text x="32" y="34" fontSize="14" fontWeight="bold" fill="#0066B3" textAnchor="middle">e</text>
                  </svg>
                </div>
                <p className="text-xs text-gray-700 font-medium text-center">eCitizen</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
