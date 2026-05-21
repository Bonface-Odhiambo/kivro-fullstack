// Auto-extracted from AdminDashboardReal.tsx
// AdminPaymentsTab
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
export function AdminPaymentsTab(props: AdminTabProps) {
  const { users, addresses, payments, inboxMessages, stats, onRefresh, ...rest } = props;
  const { toast } = useToast();
  return (
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
  );
}
