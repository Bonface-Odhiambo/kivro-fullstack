// Auto-extracted from AdminDashboardReal.tsx
// AdminUsersTab
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
export function AdminUsersTab(props: AdminTabProps) {
  const { users, addresses, payments, inboxMessages, stats, onRefresh, ...rest } = props;
  const { toast } = useToast();
  return (
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
  );
}
