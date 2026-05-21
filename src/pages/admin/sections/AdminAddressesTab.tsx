// Auto-extracted from AdminDashboardReal.tsx
// AdminAddressesTab
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
export function AdminAddressesTab(props: AdminTabProps) {
  const { users, addresses, payments, inboxMessages, stats, onRefresh, ...rest } = props;
  const { toast } = useToast();
  return (
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
  );
}
