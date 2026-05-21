import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MapPin,
  Search,
  Filter,
  Copy,
  Eye,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function AddressManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('user_id', session.user.id)
      .single();

    if (profile?.user_type !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }

    fetchAddresses();
  };

  const fetchAddresses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN.ADDRESSES, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load addresses",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load addresses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = (address: any) => {
    const formattedAddress = `🏠 KIVRO Address\n\n${address.display_address}\n${address.kivro_code}\n\nOwner: ${address.profiles?.display_name || 'N/A'}\nPhone: ${address.profiles?.phone_number || 'N/A'}\nCity: ${address.district}\n${address.postal_code ? `Postal Code: ${address.postal_code}` : ''}\n\nStatus: ${address.is_active ? 'Active ✅' : 'Inactive'}`;
    
    navigator.clipboard.writeText(formattedAddress);
    toast({
      title: "Address Copied!",
      description: "Address details copied to clipboard",
    });
  };

  const filteredAddresses = addresses.filter(addr => {
    const matchesSearch = 
      addr.kivro_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addr.display_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addr.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      addr.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && addr.is_active) ||
      (statusFilter === 'inactive' && !addr.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const addressStats = [
    { 
      label: 'Total Addresses', 
      value: addresses.length, 
      color: 'text-primary',
      icon: MapPin
    },
    { 
      label: 'Active', 
      value: addresses.filter(a => a.is_active).length, 
      color: 'text-green-600',
      icon: CheckCircle
    },
    { 
      label: 'Inactive', 
      value: addresses.filter(a => !a.is_active).length, 
      color: 'text-red-600',
      icon: XCircle
    },
    { 
      label: 'This Month', 
      value: addresses.filter(a => {
        const created = new Date(a.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length, 
      color: 'text-blue-600',
      icon: MapPin
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Address Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all KIVRO addresses created by users
          </p>
        </div>
        <Button 
          onClick={fetchAddresses}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Address Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {addressStats.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Address Directory
          </CardTitle>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search addresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KIVRO Code</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Postal Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="animate-spin h-6 w-6 mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredAddresses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No addresses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAddresses.map((address) => (
                    <TableRow key={address.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-mono text-sm font-medium">{address.kivro_code}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm">{address.display_address}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{address.profiles?.display_name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{address.profiles?.phone_number || 'N/A'}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{address.district}</p>
                          <p className="text-xs text-muted-foreground">{address.federal_member_state || address.region}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-mono text-sm">{address.postal_code || 'N/A'}</span>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={address.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {address.is_active ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                          )}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm">{new Date(address.created_at).toLocaleDateString()}</span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyAddress(address)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
