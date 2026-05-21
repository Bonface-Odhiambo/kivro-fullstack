import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ScanKivroModal from '@/components/courier/ScanKivroModal';
import DeliveryMapModal from '@/components/courier/DeliveryMapModal';
import DeliveryHistoryModal from '@/components/courier/DeliveryHistoryModal';
import CourierSettingsModal from '@/components/courier/CourierSettingsModal';
import { 
  Loader2, 
  MapPin,
  Package,
  Truck,
  TrendingUp,
  Clock,
  CheckCircle,
  Navigation,
  Star,
  DollarSign,
  AlertCircle,
  LogOut,
  Settings,
  UserIcon,
  Menu,
  X as CloseIcon
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface CourierProfile {
  full_name: string;
  phone_number: string;
  user_type: string;
}

interface DeliveryStats {
  total_deliveries: number;
  completed_deliveries: number;
  pending_deliveries: number;
  success_rate: number;
  average_rating: number;
  total_earnings: number;
}

const CourierDashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<CourierProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DeliveryStats>({
    total_deliveries: 0,
    completed_deliveries: 0,
    pending_deliveries: 0,
    success_rate: 0,
    average_rating: 0,
    total_earnings: 0
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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
      await fetchCourierData(session.user.id);
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

  // Broadcast courier location every 30 seconds when active
  useEffect(() => {
    let watchId: number | null = null;
    let broadcastInterval: ReturnType<typeof setInterval> | null = null;
    let lastPos: { lat: number; lng: number } | null = null;

    const startLocationBroadcast = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (!navigator.geolocation) return;

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          lastPos = { lat: position.coords.latitude, lng: position.coords.longitude };
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );

      // Write to Supabase every 30 s if position has changed
      broadcastInterval = setInterval(async () => {
        if (!lastPos || !session) return;
        await (supabase
          .from('courier_locations') as any)
          .upsert({
            courier_user_id: session.user.id,
            latitude: lastPos.lat,
            longitude: lastPos.lng,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'courier_user_id' });
      }, 30000);
    };

    startLocationBroadcast();

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (broadcastInterval) clearInterval(broadcastInterval);
    };
  }, []);

  const fetchCourierData = async (userId: string) => {
    try {
      // Fetch courier profile
      const { data: profileData, error: profileError } = await (supabase
        .from('profiles')
        .select('display_name, phone_number, user_type')
        .eq('user_id', userId)
        .single() as unknown as Promise<{ data: { display_name: string; phone_number: string; user_type: string } | null; error: any }>);

      if (profileError) {
      } else if (profileData) {
        setProfile({
          full_name: profileData.display_name || '',
          phone_number: profileData.phone_number || '',
          user_type: profileData.user_type || 'courier'
        });

        // Check if user is actually a courier
        if (profileData.user_type !== 'courier') {
          toast({
            title: "Access Denied",
            description: "This dashboard is only for couriers. Redirecting...",
            variant: "destructive",
          });
          setTimeout(() => navigate('/dashboard'), 2000);
          return;
        }
      }

      // Fetch real delivery stats from packages table
      const { data: packages } = await (supabase
        .from('packages')
        .select('status, courier_id')
        .eq('courier_id', userId) as unknown as Promise<{ data: { status: string; courier_id: string }[] | null; error: any }>);

      if (packages) {
        const total = packages.length;
        const completed = packages.filter(p => p.status === 'delivered').length;
        const pending = packages.filter(p =>
          ['pending', 'processing', 'in_transit', 'out_for_delivery'].includes(p.status)
        ).length;
        setStats({
          total_deliveries: total,
          completed_deliveries: completed,
          pending_deliveries: pending,
          success_rate: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
          average_rating: 0,
          total_earnings: 0
        });
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load courier data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-green-600">KIVRO Courier</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Delivery Dashboard</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <MapPin className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">User Dashboard</span>
              </Button>
              <Button variant="ghost" size="sm">
                <UserIcon className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">{profile?.full_name || 'Profile'}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Sign Out</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <CloseIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 pb-4">
              <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/dashboard')}>
                <MapPin className="h-4 w-4 mr-2" />
                User Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <UserIcon className="h-4 w-4 mr-2" />
                {profile?.full_name || 'Profile'}
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 sm:p-6 mb-4 sm:mb-8 text-white">
          <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">Welcome back, {profile?.full_name}! 🚚</h2>
          <p className="text-sm sm:text-base text-green-100">Ready to make some deliveries today?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.total_deliveries}</div>
              <p className="text-xs text-muted-foreground">All time deliveries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.success_rate}%</div>
              <p className="text-xs text-muted-foreground">{stats.completed_deliveries} completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.average_rating} ⭐</div>
              <p className="text-xs text-muted-foreground">Based on customer reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">${stats.total_earnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Pending Deliveries */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Pending Deliveries ({stats.pending_deliveries})
              </CardTitle>
              <CardDescription>Deliveries waiting to be completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.pending_deliveries > 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">You have {stats.pending_deliveries} pending deliveries</p>
                    <Button 
                      className="mt-4 bg-green-600 hover:bg-green-700" 
                      onClick={() => setShowMapModal(true)}
                    >
                      View All Deliveries
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <p className="text-muted-foreground">No pending deliveries</p>
                    <p className="text-sm text-muted-foreground mt-2">Great job! All caught up.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common courier tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white" 
                onClick={() => setShowScanModal(true)}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Scan KIVRO Address
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setShowMapModal(true)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                View Delivery Map
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setShowHistoryModal(true)}
              >
                <Package className="h-4 w-4 mr-2" />
                Delivery History
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Courier Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* How to Use KIVRO Guide */}
        <Card className="mt-4 sm:mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              How to Use KIVRO for Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Get KIVRO Address</h3>
                <p className="text-sm text-muted-foreground">
                  Customer provides their KIVRO code (e.g., KV-ABC123) or you scan their QR code
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">Navigate with GPS</h3>
                <p className="text-sm text-muted-foreground">
                  KIVRO converts the code to exact GPS coordinates and guides you directly
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">Complete Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Arrive at the exact location, complete delivery, and get customer confirmation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <Card className="mt-4 sm:mt-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Why Couriers Love KIVRO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">No More Wrong Addresses</h4>
                  <p className="text-sm text-muted-foreground">
                    Every KIVRO address is verified and leads to the exact location
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Faster Deliveries</h4>
                  <p className="text-sm text-muted-foreground">
                    Save time with direct GPS navigation to customer locations
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Higher Success Rate</h4>
                  <p className="text-sm text-muted-foreground">
                    Reduce failed deliveries and increase your completion rate
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Earn More</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete more deliveries per day with efficient routing
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      <ScanKivroModal 
        open={showScanModal} 
        onClose={() => setShowScanModal(false)} 
      />
      
      <DeliveryMapModal 
        open={showMapModal} 
        onClose={() => setShowMapModal(false)} 
      />
      
      <DeliveryHistoryModal 
        open={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
      />
      
      <CourierSettingsModal 
        open={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
    </div>
  );
};

export default CourierDashboard;
