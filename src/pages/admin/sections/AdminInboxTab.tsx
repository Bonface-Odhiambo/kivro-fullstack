// Auto-extracted from AdminDashboardReal.tsx
// AdminInboxTab
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
export function AdminInboxTab(props: AdminTabProps) {
  const { users, addresses, payments, inboxMessages, stats, onRefresh, ...rest } = props;
  const { toast } = useToast();
  return (
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
  );
}
