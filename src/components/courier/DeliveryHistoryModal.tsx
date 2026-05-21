import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Search, 
  Calendar,
  MapPin,
  User,
  Phone,
  Star,
  CheckCircle,
  Clock,
  Loader2,
  Filter,
  Download,
  Eye
} from 'lucide-react';

interface DeliveryHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

interface DeliveryRecord {
  id: string;
  kivro_code: string;
  recipient_name: string;
  phone_number: string;
  address: string;
  package_type: string;
  delivery_date: string;
  delivery_time: string;
  status: 'delivered' | 'failed' | 'cancelled';
  rating: number;
  delivery_fee: number;
  distance: number;
  notes?: string;
  completion_time: string;
}

export default function DeliveryHistoryModal({ open, onClose }: DeliveryHistoryModalProps) {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'failed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchDeliveryHistory();
    }
  }, [open]);

  useEffect(() => {
    filterDeliveries();
  }, [deliveries, searchTerm, statusFilter, dateFilter]);

  const fetchDeliveryHistory = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock delivery history data
      const mockDeliveries: DeliveryRecord[] = [
        {
          id: '1',
          kivro_code: 'KV-ABC123',
          recipient_name: 'Ahmed Hassan',
          phone_number: '+252 61 234 5678',
          address: 'Hamarweyne District, Mogadishu',
          package_type: 'Electronics',
          delivery_date: '2025-11-13',
          delivery_time: '14:30',
          status: 'delivered',
          rating: 5,
          delivery_fee: 15.00,
          distance: 5.2,
          completion_time: '25 min',
          notes: 'Customer was very satisfied. Left package at front door as requested.'
        },
        {
          id: '2',
          kivro_code: 'KV-DEF456',
          recipient_name: 'Fatima Ali',
          phone_number: '+252 62 345 6789',
          address: 'Wadajir District, Mogadishu',
          package_type: 'Documents',
          delivery_date: '2025-11-13',
          delivery_time: '11:15',
          status: 'delivered',
          rating: 4,
          delivery_fee: 8.00,
          distance: 3.1,
          completion_time: '18 min'
        },
        {
          id: '3',
          kivro_code: 'KV-GHI789',
          recipient_name: 'Omar Mohamed',
          phone_number: '+252 63 456 7890',
          address: 'Hodan District, Mogadishu',
          package_type: 'Clothing',
          delivery_date: '2025-11-12',
          delivery_time: '16:45',
          status: 'failed',
          rating: 0,
          delivery_fee: 0,
          distance: 4.8,
          completion_time: '0 min',
          notes: 'Customer not available. Attempted delivery 3 times.'
        },
        {
          id: '4',
          kivro_code: 'KV-JKL012',
          recipient_name: 'Amina Yusuf',
          phone_number: '+252 64 567 8901',
          address: 'Karaan District, Mogadishu',
          package_type: 'Food',
          delivery_date: '2025-11-12',
          delivery_time: '19:20',
          status: 'delivered',
          rating: 5,
          delivery_fee: 12.00,
          distance: 6.7,
          completion_time: '32 min',
          notes: 'Fast delivery. Customer tipped extra $2.'
        },
        {
          id: '5',
          kivro_code: 'KV-MNO345',
          recipient_name: 'Hassan Ali',
          phone_number: '+252 65 678 9012',
          address: 'Shangani District, Mogadishu',
          package_type: 'Books',
          delivery_date: '2025-11-11',
          delivery_time: '10:30',
          status: 'cancelled',
          rating: 0,
          delivery_fee: 0,
          distance: 0,
          completion_time: '0 min',
          notes: 'Customer cancelled order before pickup.'
        }
      ];

      setDeliveries(mockDeliveries);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load delivery history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDeliveries = () => {
    let filtered = deliveries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(delivery =>
        delivery.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.kivro_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      filtered = filtered.filter(delivery => {
        const deliveryDate = new Date(delivery.delivery_date);
        
        switch (dateFilter) {
          case 'today':
            return delivery.delivery_date === today;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return deliveryDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return deliveryDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredDeliveries(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const exportHistory = () => {
    const csvContent = [
      'Date,Time,KIVRO Code,Recipient,Address,Package Type,Status,Rating,Fee,Distance,Completion Time',
      ...filteredDeliveries.map(d => 
        `${d.delivery_date},${d.delivery_time},${d.kivro_code},"${d.recipient_name}","${d.address}",${d.package_type},${d.status},${d.rating},$${d.delivery_fee},${d.distance}km,${d.completion_time}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete! 📊",
      description: "Delivery history exported to CSV file",
    });
  };

  const totalEarnings = filteredDeliveries.reduce((sum, d) => sum + d.delivery_fee, 0);
  const successfulDeliveries = filteredDeliveries.filter(d => d.status === 'delivered').length;
  const averageRating = filteredDeliveries.filter(d => d.rating > 0).reduce((sum, d, _, arr) => sum + d.rating / arr.length, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Delivery History
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading delivery history...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{filteredDeliveries.length}</div>
                  <div className="text-sm text-muted-foreground">Total Deliveries</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{successfulDeliveries}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total Earnings</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                    {averageRating.toFixed(1)} <Star className="h-4 w-4 fill-current" />
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, KIVRO code, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-sm border rounded px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="text-sm border rounded px-3 py-2"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <Button onClick={exportHistory} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Delivery List */}
            <div className="space-y-3">
              {filteredDeliveries.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No deliveries found matching your criteria</p>
                  </CardContent>
                </Card>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <Card 
                    key={delivery.id} 
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {delivery.kivro_code}
                            </span>
                            <Badge className={getStatusColor(delivery.status)}>
                              {getStatusIcon(delivery.status)}
                              <span className="ml-1">{delivery.status}</span>
                            </Badge>
                            {delivery.rating > 0 && (
                              <div className="flex items-center gap-1">
                                {renderStars(delivery.rating)}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{delivery.recipient_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{delivery.address}</span>
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>📅 {delivery.delivery_date} at {delivery.delivery_time}</div>
                              <div>📦 {delivery.package_type}</div>
                              <div>🚚 {delivery.distance}km • {delivery.completion_time}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ${delivery.delivery_fee.toFixed(2)}
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Delivery Detail Modal */}
        {selectedDelivery && (
          <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Delivery Details - {selectedDelivery.kivro_code}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Recipient Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {selectedDelivery.recipient_name}</div>
                      <div><strong>Phone:</strong> {selectedDelivery.phone_number}</div>
                      <div><strong>Address:</strong> {selectedDelivery.address}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Delivery Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Date:</strong> {selectedDelivery.delivery_date}</div>
                      <div><strong>Time:</strong> {selectedDelivery.delivery_time}</div>
                      <div><strong>Package:</strong> {selectedDelivery.package_type}</div>
                      <div><strong>Distance:</strong> {selectedDelivery.distance}km</div>
                      <div><strong>Duration:</strong> {selectedDelivery.completion_time}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Status & Rating</h4>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(selectedDelivery.status)}>
                      {selectedDelivery.status}
                    </Badge>
                    {selectedDelivery.rating > 0 && (
                      <div className="flex items-center gap-1">
                        {renderStars(selectedDelivery.rating)}
                        <span className="text-sm ml-1">({selectedDelivery.rating}/5)</span>
                      </div>
                    )}
                    <div className="text-lg font-bold text-green-600">
                      ${selectedDelivery.delivery_fee.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                {selectedDelivery.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedDelivery.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
