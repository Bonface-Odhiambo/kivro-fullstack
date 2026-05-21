// Auto-extracted from AdminDashboardReal.tsx
// AdminOverviewTab
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


export type { AdminTabProps };

export interface AdminTabProps {
  users: any[];
  addresses: any[];
  payments: any[];
  inboxMessages: any[];
  stats: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  countryFilter: string;
  setCountryFilter: (c: string) => void;
  inboxFilter: string;
  setInboxFilter: (f: string) => void;
  onRefresh: () => void;
  [key: string]: any;
}

// Extracted tab content — render inside <TabsContent value="..."> in parent
export function AdminOverviewTab(props: AdminTabProps) {
  const { users, addresses, payments, inboxMessages, stats, onRefresh, ...rest } = props;
  const { toast } = useToast();
  return (
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
  );
}
