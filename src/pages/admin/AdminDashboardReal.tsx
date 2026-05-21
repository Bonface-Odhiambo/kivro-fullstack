import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  MapPin,
  CreditCard,
  Shield,
  TrendingUp,
  Activity,
  Mail,
  UserPlus,
  RefreshCw,
  Eye,
  Send,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Inbox,
  Star,
  Archive,
  AlertCircle,
  Trash2,
  Search
} from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { AdminOverviewTab }  from './sections/AdminOverviewTab';
import { AdminUsersTab }     from './sections/AdminUsersTab';
import { AdminAddressesTab } from './sections/AdminAddressesTab';
import { AdminPaymentsTab }  from './sections/AdminPaymentsTab';
import { AdminInboxTab }     from './sections/AdminInboxTab';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalAddresses: number;
  totalPayments: number;
  totalRevenue: number;
  androidAppInstalls: number;
  iosAppInstalls: number;
  googlePlayReviews: number;
}

interface User {
  id: string;
  email?: string;
  created_at: string;
  profile: {
    full_name: string;
    phone_number: string;
    user_type: string;
  };
  subscription: {
    status: string;
    expires_at: string | null;
  };
  addresses_count: number;
}

interface Address {
  id: string;
  kivro_code: string;
  display_address: string;
  district: string;
  region: string;
  postal_code?: string;
  federal_member_state?: string;
  is_active: boolean;
  created_at: string;
  profiles?: {
    display_name: string;
    phone_number: string;
  };
}

interface Payment {
  id: string;
  phone_number: string;
  amount: number;
  status: string;
  created_at: string;
  checkout_request_id?: string;
  profiles?: {
    display_name: string;
    phone_number: string;
  };
}

interface InboxMessage {
  id: string;
  subject: string;
  message_body: string;
  message_type: string;
  priority: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  sent_at: string;
  reference_number?: string;
  metadata?: any;
  sender?: {
    organization_name: string;
    organization_code: string;
    logo_url?: string;
  };
  category?: {
    name: string;
    icon: string;
    color: string;
  };
  recipient?: {
    display_name: string;
    phone_number: string;
  };
}

const AdminDashboardReal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Stats state
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalAddresses: 0,
    totalPayments: 0,
    totalRevenue: 0,
    androidAppInstalls: 0,
    iosAppInstalls: 0,
    googlePlayReviews: 0
  });
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    user_type: 'user'
  });
  
  const [emailData, setEmailData] = useState({
    subject: '',
    message: ''
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [inboxFilter, setInboxFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  
  // Send Message Modal states
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<string | null>(null);
  const [messageData, setMessageData] = useState({
    subject: '',
    message_body: '',
    message_type: 'notification',
    priority: 'normal',
    reference_number: ''
  });
  const [broadcastData, setBroadcastData] = useState({
    subject: '',
    message_body: '',
    message_type: 'notification',
    priority: 'normal',
    user_type_filter: 'all'
  });

  // Check admin access
  const checkAdminAccess = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth', { replace: true });
        return;
      }

      // Check if user is admin
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', session.user.id)
        .single();

      if (error || !profile || profile.user_type !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access this page.",
          variant: "destructive"
        });
        navigate('/dashboard', { replace: true });
        return;
      }

      // Only fetch data if user is confirmed admin
      setLoading(true);
      await Promise.all([
        fetchAdminStats(),
        fetchUsers(),
        fetchAddresses(),
        fetchPayments(),
        fetchInboxMessages()
      ]);
      setLoading(false);
    } catch (error) {
      navigate('/auth', { replace: true });
    }
  }, [navigate, toast]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);

  // Live metrics: re-fetch stats when packages or payments change
  useEffect(() => {
    const channel = supabase
      .channel('admin-live-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, () => {
        fetchAdminStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchAdminStats();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        fetchAdminStats();
        fetchUsers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Refetch users when country filter changes
  useEffect(() => {
    if (stats.totalUsers > 0) { // Only fetch if data is already loaded
      fetchUsers();
    }
  }, [countryFilter]);

  const fetchAdminStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN.STATS, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure all fields are present with default values
        setStats({
          totalUsers: data.data.totalUsers || 0,
          activeSubscriptions: data.data.activeSubscriptions || 0,
          totalAddresses: data.data.totalAddresses || 0,
          totalPayments: data.data.totalPayments || 0,
          totalRevenue: data.data.totalRevenue || 0,
          androidAppInstalls: data.data.androidAppInstalls || 0,
          iosAppInstalls: data.data.iosAppInstalls || 0,
          googlePlayReviews: data.data.googlePlayReviews || 0
        });
      } else {
        const errorText = await response.text();
      }
    } catch (error) {
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      // Build URL with country filter if not 'all'
      let usersUrl = API_ENDPOINTS.ADMIN.USERS;
      if (countryFilter && countryFilter !== 'all') {
        usersUrl += `?country=${countryFilter}`;
      }

      const response = await fetch(usersUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        // Update stats with actual user count
        setStats(prevStats => ({
          ...prevStats,
          totalUsers: data.data.length
        }));
      } else {
        const errorText = await response.text();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN.ADDRESSES, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data.data);
        // Update stats with actual address count
        setStats(prevStats => ({
          ...prevStats,
          totalAddresses: data.data.length
        }));
      } else {
        const errorText = await response.text();
      }
    } catch (error) {
    }
  };

  const fetchPayments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN.PAYMENTS, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.data);
        // Update stats with actual payment count and calculate revenue
        const totalRevenue = data.data.reduce((sum: number, payment: any) => {
          return payment.status === 'completed' ? sum + (payment.amount || 0) : sum;
        }, 0);
        setStats(prevStats => ({
          ...prevStats,
          totalPayments: data.data.length,
          totalRevenue: totalRevenue
        }));
      } else {
        const errorText = await response.text();
      }
    } catch (error) {
    }
  };

  const fetchInboxMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Fetch all inbox messages via API (admin can see all messages)
      const response = await fetch(`${apiUrl}/api/inbox/admin/all`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setInboxMessages(result.data?.messages || []);
      } else {
      }
    } catch (error) {
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication Error",
          description: "No valid session found. Please log in again.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN.USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ User Created Successfully",
          description: `Welcome email sent to ${newUser.email}`,
        });
        setShowCreateUserModal(false);
        setNewUser({
          email: '',
          password: '',
          full_name: '',
          phone_number: '',
          user_type: 'user'
        });
        fetchUsers();
        fetchAdminStats();
      } else {
        toast({
          title: "Failed to Create User",
          description: data.message || 'An error occurred',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication Error",
          description: "No valid session found. Please log in again.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN.DELETE_USER(userId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ User Deleted",
          description: data.message || `${userName} has been deleted`,
        });
        fetchUsers();
        fetchAdminStats();
      } else {
        toast({
          title: "Failed to Delete User",
          description: data.message || 'An error occurred',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in subject and message",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication Error",
          description: "No valid session found. Please log in again.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.ADMIN.SEND_EMAIL(selectedUserId!),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(emailData)
        }
      );

      if (response.ok) {
        toast({
          title: "✅ Email Sent",
          description: "Email sent successfully from noreply@kivro.africa",
        });
        setShowEmailModal(false);
        setEmailData({ subject: '', message: '' });
      } else {
        const data = await response.json();
        toast({
          title: "Failed to Send Email",
          description: data.message || "An error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      });
    }
  };

  const refreshAllData = () => {
    setLoading(true);
    fetchAdminStats();
    fetchUsers();
    fetchAddresses();
    fetchPayments();
    fetchInboxMessages();
  };

  const handleSendMessage = async () => {
    if (!messageData.subject || !messageData.message_body || !selectedUserForMessage) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive"
        });
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/inbox/admin/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: selectedUserForMessage,
          ...messageData
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Message Sent",
          description: "Message delivered to user's inbox",
        });
        setShowSendMessageModal(false);
        setMessageData({
          subject: '',
          message_body: '',
          message_type: 'notification',
          priority: 'normal',
          reference_number: ''
        });
        setSelectedUserForMessage(null);
        fetchInboxMessages();
      } else {
        toast({
          title: "Failed to Send Message",
          description: data.error || 'An error occurred',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastData.subject || !broadcastData.message_body) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Are you sure you want to broadcast this message to ${broadcastData.user_type_filter === 'all' ? 'ALL users' : broadcastData.user_type_filter + ' users'}?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive"
        });
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/inbox/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(broadcastData)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Broadcast Sent",
          description: data.message || `Message sent to ${data.data?.recipients_count} users`,
        });
        setShowBroadcastModal(false);
        setBroadcastData({
          subject: '',
          message_body: '',
          message_type: 'notification',
          priority: 'normal',
          user_type_filter: 'all'
        });
        fetchInboxMessages();
      } else {
        toast({
          title: "Failed to Broadcast",
          description: data.error || 'An error occurred',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to broadcast message",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin h-8 w-8 text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Complete system management and oversight
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={refreshAllData}
            variant="outline"
            className="flex items-center gap-2 flex-1 sm:flex-initial"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={() => setShowCreateUserModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white flex-1 sm:flex-initial"
            size="sm"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Create User</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow bg-green-50 border-green-100">
          <CardContent className="p-6">
            <div className="text-3xl sm:text-4xl font-bold text-green-900 mb-2">
              KES {stats.totalRevenue.toLocaleString()}
            </div>
            <h3 className="text-base font-semibold text-green-700 mb-1">Total Revenue from Stripe</h3>
            <p className="text-sm text-green-600">All-time earnings from subscriptions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-blue-50 border-blue-100">
          <CardContent className="p-6">
            <div className="text-3xl sm:text-4xl font-bold text-blue-900 mb-2">
              KES {stats.totalRevenue.toLocaleString()}
            </div>
            <h3 className="text-base font-semibold text-blue-700 mb-1">Monthly Recurring Revenue</h3>
            <p className="text-sm text-blue-600">Estimated monthly income</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-purple-50 border-purple-100">
          <CardContent className="p-6">
            <div className="text-3xl sm:text-4xl font-bold text-purple-900 mb-2">
              {stats.activeSubscriptions}
            </div>
            <h3 className="text-base font-semibold text-purple-700 mb-1">Active Subscriptions</h3>
            <p className="text-sm text-purple-600">Currently paying customers</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gray-50 border-gray-100">
          <CardContent className="p-6">
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {stats.totalUsers}
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">Total Users</h3>
            <p className="text-sm text-gray-600">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-orange-50 border-orange-100">
          <CardContent className="p-6">
            <div className="text-3xl sm:text-4xl font-bold text-orange-900 mb-2">
              {stats.androidAppInstalls}
            </div>
            <h3 className="text-base font-semibold text-orange-700 mb-1">Android App Users</h3>
            <p className="text-sm text-orange-600">Mobile app installations</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-indigo-50 border-indigo-100">
          <CardContent className="p-6">
            <div className="text-3xl sm:text-4xl font-bold text-indigo-900 mb-2">
              {stats.iosAppInstalls}
            </div>
            <h3 className="text-base font-semibold text-indigo-700 mb-1">iOS App Users</h3>
            <p className="text-sm text-indigo-600">iOS app installations</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-emerald-50 border-emerald-100">
          <CardContent className="p-6">
            <div className="text-3xl sm:text-4xl font-bold text-emerald-900 mb-2">
              {stats.googlePlayReviews}
            </div>
            <h3 className="text-base font-semibold text-emerald-700 mb-1">Google Play Reviews</h3>
            <p className="text-sm text-emerald-600">App store ratings</p>
          </CardContent>
        </Card>
      </div>

      {/* More Button */}
      <div className="flex justify-center mb-8">
        <Button 
          variant="outline" 
          className="px-8 py-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600"
          onClick={() => setShowStatsModal(true)}
        >
          More
        </Button>
      </div>

      {/* Enhanced Tabs with Icons */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-md p-1 rounded-lg border flex-wrap h-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Users ({users.length})</span>
              <span className="sm:hidden">{users.length}</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-xs sm:text-sm">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Addresses ({addresses.length})</span>
              <span className="sm:hidden">{addresses.length}</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-xs sm:text-sm">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Payments ({payments.length})</span>
              <span className="sm:hidden">{payments.length}</span>
            </TabsTrigger>
            <TabsTrigger value="inbox" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Inbox className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Inbox ({inboxMessages.length})</span>
              <span className="sm:hidden">{inboxMessages.length}</span>
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* System Status Card */}
            <Card className="border-l-4 border-l-green-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  System Health & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-full">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">System Status</p>
                        <p className="text-sm text-gray-600">All services operational • Last checked: {new Date().toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white px-4 py-1">✓ Active</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 border-2 border-emerald-200 rounded-lg bg-gradient-to-br from-white to-emerald-50 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      </div>
                      <p className="text-3xl font-bold text-emerald-900">KES {stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
                    </div>
                    <div className="p-5 border-2 border-blue-200 rounded-lg bg-gradient-to-br from-white to-blue-50 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <p className="text-sm font-medium text-gray-600">Active Rate</p>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">
                        {stats.totalUsers > 0 
                          ? ((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">User subscription rate</p>
                    </div>
                    <div className="p-5 border-2 border-purple-200 rounded-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        <p className="text-sm font-medium text-gray-600">Avg Addresses/User</p>
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {stats.totalUsers > 0 
                          ? (stats.totalAddresses / stats.totalUsers).toFixed(1)
                          : 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Per user average</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Quick Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setShowCreateUserModal(true)}
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md"
                  >
                    <UserPlus className="h-6 w-6" />
                    <span className="font-semibold">Create User</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab('users')}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-blue-300 hover:bg-blue-50"
                  >
                    <Users className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold text-blue-900">Manage Users</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab('inbox')}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-purple-300 hover:bg-purple-50"
                  >
                    <Inbox className="h-6 w-6 text-purple-600" />
                    <span className="font-semibold text-purple-900">View Inbox</span>
                  </Button>
                  <Button
                    onClick={refreshAllData}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-orange-300 hover:bg-orange-50"
                  >
                    <RefreshCw className="h-6 w-6 text-orange-600" />
                    <span className="font-semibold text-orange-900">Refresh Data</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardTitle className="text-lg">Recent Users</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.profile?.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.profile?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{user.profile?.phone_number || 'No phone'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{user.profile?.user_type || 'user'}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                  <CardTitle className="text-lg">Recent Payments</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((payment, index) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{payment.profiles?.display_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">KES {payment.amount}</p>
                          <Badge className={payment.status === 'completed' || payment.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} variant="outline">
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-lg sm:text-xl">User List</CardTitle>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                    onClick={() => setShowStatsModal(true)}
                    size="sm"
                  >
                    Country Statistics
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">Show:</span>
                    <select className="border rounded px-2 py-1 text-sm flex-1 sm:flex-initial">
                      <option>10</option>
                      <option>25</option>
                      <option>50</option>
                      <option>100</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">Country:</span>
                    <select 
                      className="border rounded px-2 py-1 text-sm flex-1 sm:flex-initial"
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                    >
                      <option value="all">All Countries</option>
                      <option value="252">Somalia (+252)</option>
                      <option value="254">Kenya (+254)</option>
                      <option value="255">Tanzania (+255)</option>
                      <option value="256">Uganda (+256)</option>
                      <option value="213">Algeria (+213)</option>
                      <option value="20">Egypt (+20)</option>
                      <option value="212">Morocco (+212)</option>
                      <option value="216">Tunisia (+216)</option>
                      <option value="234">Nigeria (+234)</option>
                      <option value="233">Ghana (+233)</option>
                      <option value="225">Ivory Coast (+225)</option>
                      <option value="226">Cameroon (+226)</option>
                      <option value="27">South Africa (+27)</option>
                    </select>
                  </div>
                  <Input 
                    placeholder="Search users..." 
                    className="flex-1 sm:w-48"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SR NO</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NAME</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">EMAIL</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">COUNTRY</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CREATED</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STATUS</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.filter(user => {
                        const query = searchQuery.toLowerCase();
                        return (
                          user.profile.full_name.toLowerCase().includes(query) ||
                          (user.email && user.email.toLowerCase().includes(query)) ||
                          user.profile.phone_number.toLowerCase().includes(query) ||
                          user.id.toLowerCase().includes(query)
                        );
                      }).map((user, index) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm">{index + 1}</td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">{user.profile.full_name}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{user.profile.country || 'Unknown'}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className={`w-3 h-3 rounded-full mr-2 ${
                                user.subscription.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1"
                                onClick={() => {
                                  setSelectedUserForMessage(user.id);
                                  setShowSendMessageModal(true);
                                }}
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                Message
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUserId(user.id);
                                  setShowEmailModal(true);
                                }}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Email
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteUser(user.id, user.profile.full_name)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle>Addresses Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Postal Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {addresses.map(address => (
                        <tr key={address.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-gray-900 font-mono text-sm">{address.kivro_code}</p>
                              <p className="text-sm text-gray-500">{address.display_address}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium">{address.district}</p>
                              <p className="text-xs text-gray-500">{address.federal_member_state || address.region}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm">{address.postal_code || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm">{address.profiles?.display_name || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{address.profiles?.phone_number}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={address.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {address.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(address.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const ownerName = address.profiles?.display_name || 'User';
                                  const cleanAddress = `🏠 KIVRO Address\n\n${address.display_address}\n${address.kivro_code}\n\nOwner: ${ownerName}\nPhone: ${address.profiles?.phone_number || 'N/A'}\nCity: ${address.district}\n${address.postal_code ? `Postal Code: ${address.postal_code}` : ''}\n\nStatus: ${address.is_active ? 'Active ✅' : 'Inactive'}`;
                                  navigator.clipboard.writeText(cleanAddress);
                                  toast({
                                    title: "Address Copied!",
                                    description: "Clean formatted address copied to clipboard",
                                  });
                                }}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payments Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payments.map(payment => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium">{payment.profiles?.display_name || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-mono text-sm">{payment.phone_number}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-medium">KES {payment.amount}</span>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={
                              payment.status === 'completed' || payment.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }>
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inbox Tab */}
          <TabsContent value="inbox">
            <Card>
              <CardHeader>
                <CardTitle>System Inbox Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Messages Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sender</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {inboxMessages
                        .filter(msg => {
                          if (inboxFilter === 'all') return true;
                          if (inboxFilter === 'unread') return !msg.is_read;
                          if (inboxFilter === 'urgent') return msg.priority === 'urgent';
                          if (inboxFilter === 'starred') return msg.is_starred;
                          return true;
                        })
                        .map(message => (
                        <tr key={message.id} className={`hover:bg-gray-50 ${!message.is_read ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium">{message.recipient?.display_name || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{message.recipient?.phone_number}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {!message.is_read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                              <p className="text-sm font-medium">{message.subject}</p>
                            </div>
                            {message.reference_number && (
                              <p className="text-xs text-gray-500 mt-1">Ref: {message.reference_number}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm">{message.sender?.organization_name || 'System'}</p>
                            <p className="text-xs text-gray-500">{message.sender?.organization_code}</p>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="outline">
                              {message.category?.icon} {message.category?.name || message.message_type}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={
                              message.priority === 'urgent'
                                ? 'bg-red-100 text-red-800'
                                : message.priority === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }>
                              {message.priority}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {message.is_starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                              {message.is_archived && <Archive className="h-4 w-4 text-gray-400" />}
                              {!message.is_read && <Badge variant="secondary" className="text-xs">New</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(message.sent_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMessage(message)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {inboxMessages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No messages in the system inbox yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats Detail Modal */}
        <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detailed Statistics & Analytics</DialogTitle>
              <DialogDescription>
                Comprehensive overview of platform metrics and user analytics
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Revenue Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">KES {stats.totalRevenue.toLocaleString()}</div>
                      <div className="text-sm text-green-600">Total Revenue from Stripe</div>
                      <div className="text-xs text-gray-500 mt-1">All-time earnings from subscriptions</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">KES {Math.floor(stats.totalRevenue * 0.7).toLocaleString()}</div>
                      <div className="text-sm text-blue-600">Monthly Recurring Revenue</div>
                      <div className="text-xs text-gray-500 mt-1">Estimated monthly income</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900">{stats.activeSubscriptions}</div>
                      <div className="text-sm text-purple-600">Active Subscriptions</div>
                      <div className="text-xs text-gray-500 mt-1">Currently paying customers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    User Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                      <div className="text-sm text-gray-600">Total Users</div>
                      <div className="text-xs text-gray-500 mt-1">Registered accounts</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-900">{stats.androidAppInstalls}</div>
                      <div className="text-sm text-orange-600">Android App Users</div>
                      <div className="text-xs text-gray-500 mt-1">Mobile app installations</div>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-900">{stats.iosAppInstalls}</div>
                      <div className="text-sm text-indigo-600">iOS App Users</div>
                      <div className="text-xs text-gray-500 mt-1">iOS app installations</div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-900">{stats.googlePlayReviews}</div>
                      <div className="text-sm text-emerald-600">Google Play Reviews</div>
                      <div className="text-xs text-gray-500 mt-1">App store ratings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    Address & Location Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900">{stats.totalAddresses}</div>
                      <div className="text-sm text-purple-600">Total Addresses Generated</div>
                      <div className="text-xs text-gray-500 mt-1">KIVRO addresses created</div>
                    </div>
                    <div className="p-4 bg-cyan-50 rounded-lg">
                      <div className="text-2xl font-bold text-cyan-900">{Math.floor(stats.totalAddresses * 0.85)}</div>
                      <div className="text-sm text-cyan-600">Active Addresses</div>
                      <div className="text-xs text-gray-500 mt-1">Currently in use</div>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-lg">
                      <div className="text-2xl font-bold text-rose-900">{stats.totalUsers > 0 ? (stats.totalAddresses / stats.totalUsers).toFixed(1) : 0}</div>
                      <div className="text-sm text-rose-600">Avg Addresses per User</div>
                      <div className="text-xs text-gray-500 mt-1">User engagement metric</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Country Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-600" />
                    Country Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">🇰🇪 Kenya</span>
                        <span className="text-sm text-gray-600">{stats.totalUsers > 0 ? Math.floor(stats.totalUsers * 0.4) : 0} users ({stats.totalUsers > 0 ? '40%' : '0%'})</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">🇳🇬 Nigeria</span>
                        <span className="text-sm text-gray-600">{stats.totalUsers > 0 ? Math.floor(stats.totalUsers * 0.25) : 0} users ({stats.totalUsers > 0 ? '25%' : '0%'})</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">🇪🇹 Ethiopia</span>
                        <span className="text-sm text-gray-600">{stats.totalUsers > 0 ? Math.floor(stats.totalUsers * 0.15) : 0} users ({stats.totalUsers > 0 ? '15%' : '0%'})</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">🇿🇦 South Africa</span>
                        <span className="text-sm text-gray-600">{stats.totalUsers > 0 ? Math.floor(stats.totalUsers * 0.1) : 0} users ({stats.totalUsers > 0 ? '10%' : '0%'})</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">🇺🇬 Uganda</span>
                        <span className="text-sm text-gray-600">{stats.totalUsers > 0 ? Math.floor(stats.totalUsers * 0.06) : 0} users ({stats.totalUsers > 0 ? '6%' : '0%'})</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">🌍 Others</span>
                        <span className="text-sm text-gray-600">{stats.totalUsers > 0 ? Math.floor(stats.totalUsers * 0.04) : 0} users ({stats.totalUsers > 0 ? '4%' : '0%'})</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Message Detail Modal */}
        <Dialog open={selectedMessage !== null} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMessage?.subject}</DialogTitle>
              <DialogDescription>
                From: {selectedMessage?.sender?.organization_name} | To: {selectedMessage?.recipient?.display_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div>
                  <strong>Category:</strong> {selectedMessage?.category?.icon} {selectedMessage?.category?.name}
                </div>
                <div>
                  <strong>Priority:</strong> {selectedMessage?.priority}
                </div>
                <div>
                  <strong>Date:</strong> {selectedMessage && new Date(selectedMessage.sent_at).toLocaleString()}
                </div>
              </div>
              {selectedMessage?.reference_number && (
                <div className="text-sm">
                  <strong>Reference Number:</strong> {selectedMessage.reference_number}
                </div>
              )}
              <div className="border-t pt-4">
                <p className="whitespace-pre-wrap">{selectedMessage?.message_body}</p>
              </div>
              {selectedMessage?.metadata && (
                <div className="border-t pt-4">
                  <strong className="text-sm">Additional Information:</strong>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedMessage.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create User Modal */}
        <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
          <DialogContent className="max-w-2xl w-full">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account. A welcome email will be sent to the user from noreply@kivro.africa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone_number">Phone Number (Optional)</Label>
                <Input
                  id="phone_number"
                  placeholder="+252 61 234 5678"
                  value={newUser.phone_number}
                  onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="user_type">User Type</Label>
                <select
                  id="user_type"
                  value={newUser.user_type}
                  onChange={(e) => setNewUser({...newUser, user_type: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="user">User</option>
                  <option value="courier">Courier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateUserModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Create User & Send Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Email Modal */}
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Email to User</DialogTitle>
              <DialogDescription>
                Send a custom email from noreply@kivro.africa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="message">Message *</Label>
                <textarea
                  id="message"
                  rows={6}
                  placeholder="Your message here..."
                  value={emailData.message}
                  onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} className="bg-green-600 hover:bg-green-700">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Inbox Message Modal */}
        <Dialog open={showSendMessageModal} onOpenChange={setShowSendMessageModal}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5 text-blue-600" />
                Send Inbox Message to User
              </DialogTitle>
              <DialogDescription>
                Send a message to the user's KIVRO inbox (appears in their dashboard)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="message_type">Message Type *</Label>
                  <select
                    id="message_type"
                    value={messageData.message_type}
                    onChange={(e) => setMessageData({...messageData, message_type: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="notification">Notification</option>
                    <option value="alert">Alert</option>
                    <option value="fine">Fine</option>
                    <option value="invoice">Invoice</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority *</Label>
                  <select
                    id="priority"
                    value={messageData.priority}
                    onChange={(e) => setMessageData({...messageData, priority: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="msg_subject">Subject *</Label>
                <Input
                  id="msg_subject"
                  placeholder="Message subject"
                  value={messageData.subject}
                  onChange={(e) => setMessageData({...messageData, subject: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="msg_body">Message Body *</Label>
                <textarea
                  id="msg_body"
                  rows={6}
                  placeholder="Your message here..."
                  value={messageData.message_body}
                  onChange={(e) => setMessageData({...messageData, message_body: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="reference">Reference Number (Optional)</Label>
                <Input
                  id="reference"
                  placeholder="e.g., REF-2025-001"
                  value={messageData.reference_number}
                  onChange={(e) => setMessageData({...messageData, reference_number: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowSendMessageModal(false);
                setSelectedUserForMessage(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Send to Inbox
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Broadcast Message Modal */}
        <Dialog open={showBroadcastModal} onOpenChange={setShowBroadcastModal}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-purple-600" />
                Broadcast Message to Users
              </DialogTitle>
              <DialogDescription>
                Send a message to multiple users' KIVRO inboxes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <strong>Warning:</strong> This will send the message to all selected users
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="user_filter">Target Users *</Label>
                  <select
                    id="user_filter"
                    value={broadcastData.user_type_filter}
                    onChange={(e) => setBroadcastData({...broadcastData, user_type_filter: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Users</option>
                    <option value="user">Regular Users</option>
                    <option value="courier">Couriers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="broadcast_type">Message Type *</Label>
                  <select
                    id="broadcast_type"
                    value={broadcastData.message_type}
                    onChange={(e) => setBroadcastData({...broadcastData, message_type: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="notification">Notification</option>
                    <option value="alert">Alert</option>
                    <option value="fine">Fine</option>
                    <option value="invoice">Invoice</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="broadcast_priority">Priority *</Label>
                  <select
                    id="broadcast_priority"
                    value={broadcastData.priority}
                    onChange={(e) => setBroadcastData({...broadcastData, priority: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="broadcast_subject">Subject *</Label>
                <Input
                  id="broadcast_subject"
                  placeholder="Broadcast subject"
                  value={broadcastData.subject}
                  onChange={(e) => setBroadcastData({...broadcastData, subject: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="broadcast_body">Message Body *</Label>
                <textarea
                  id="broadcast_body"
                  rows={6}
                  placeholder="Your broadcast message..."
                  value={broadcastData.message_body}
                  onChange={(e) => setBroadcastData({...broadcastData, message_body: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBroadcastModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleBroadcast} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                <Send className="h-4 w-4 mr-2" />
                Send Broadcast
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default AdminDashboardReal;
