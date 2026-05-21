import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Navigation, 
  Package, 
  Clock,
  Phone,
  User,
  Loader2,
  RefreshCw,
  Filter,
  Route
} from 'lucide-react';

interface DeliveryMapModalProps {
  open: boolean;
  onClose: () => void;
}

interface DeliveryLocation {
  id: string;
  kivro_code: string;
  recipient_name: string;
  phone_number: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'in_transit' | 'delivered';
  priority: 'high' | 'normal' | 'low';
  estimated_time: string;
  package_type: string;
  delivery_fee: number;
}

export default function DeliveryMapModal({ open, onClose }: DeliveryMapModalProps) {
  const [deliveries, setDeliveries] = useState<DeliveryLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryLocation | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_transit'>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchDeliveries();
    }
  }, [open]);

  const fetchDeliveries = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to fetch delivery locations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock delivery data
      const mockDeliveries: DeliveryLocation[] = [
        {
          id: '1',
          kivro_code: 'KV-ABC123',
          recipient_name: 'Ahmed Hassan',
          phone_number: '+252 61 234 5678',
          address: 'Hamarweyne District, Mogadishu',
          latitude: 2.0469,
          longitude: 45.3182,
          status: 'pending',
          priority: 'high',
          estimated_time: '30 min',
          package_type: 'Electronics',
          delivery_fee: 15.00
        },
        {
          id: '2',
          kivro_code: 'KV-DEF456',
          recipient_name: 'Fatima Ali',
          phone_number: '+252 62 345 6789',
          address: 'Wadajir District, Mogadishu',
          latitude: 2.0520,
          longitude: 45.3250,
          status: 'in_transit',
          priority: 'normal',
          estimated_time: '45 min',
          package_type: 'Documents',
          delivery_fee: 8.00
        },
        {
          id: '3',
          kivro_code: 'KV-GHI789',
          recipient_name: 'Omar Mohamed',
          phone_number: '+252 63 456 7890',
          address: 'Hodan District, Mogadishu',
          latitude: 2.0580,
          longitude: 45.3300,
          status: 'pending',
          priority: 'low',
          estimated_time: '1 hour',
          package_type: 'Clothing',
          delivery_fee: 12.00
        }
      ];

      setDeliveries(mockDeliveries);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load delivery locations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => 
    filterStatus === 'all' || delivery.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openInMaps = (delivery: DeliveryLocation) => {
    const { latitude, longitude } = delivery;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(googleMapsUrl, '_blank');
  };

  const callRecipient = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const optimizeRoute = () => {
    const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
    if (pendingDeliveries.length === 0) {
      toast({
        title: "No Pending Deliveries",
        description: "All deliveries are completed or in transit",
      });
      return;
    }

    // Create waypoints for Google Maps
    const waypoints = pendingDeliveries.map(d => `${d.latitude},${d.longitude}`).join('|');
    const origin = pendingDeliveries[0];
    const destination = pendingDeliveries[pendingDeliveries.length - 1];
    
    const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypoints}&travelmode=driving`;
    
    window.open(routeUrl, '_blank');
    
    toast({
      title: "Route Optimized! 🗺️",
      description: `Optimized route for ${pendingDeliveries.length} deliveries`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Delivery Map & Locations
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading delivery locations...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Map Placeholder */}
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <MapPin className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Interactive Delivery Map</h3>
                  <p className="text-muted-foreground mb-4">
                    View all your delivery locations on an interactive map
                  </p>
                  <div className="bg-white rounded-lg p-8 border-2 border-dashed border-green-300">
                    <p className="text-muted-foreground">
                      🗺️ Interactive map would be displayed here<br/>
                      Showing {filteredDeliveries.length} delivery locations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={fetchDeliveries} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Button onClick={optimizeRoute} className="bg-green-600 hover:bg-green-700" size="sm">
                <Route className="h-4 w-4 mr-2" />
                Optimize Route
              </Button>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Deliveries</option>
                  <option value="pending">Pending Only</option>
                  <option value="in_transit">In Transit Only</option>
                </select>
              </div>
            </div>

            {/* Delivery List */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Delivery Locations ({filteredDeliveries.length})
              </h4>

              {filteredDeliveries.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No deliveries found for the selected filter</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredDeliveries.map((delivery) => (
                    <Card 
                      key={delivery.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedDelivery?.id === delivery.id ? 'ring-2 ring-green-500' : ''
                      }`}
                      onClick={() => setSelectedDelivery(delivery)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {delivery.kivro_code}
                              </span>
                              <Badge className={getStatusColor(delivery.status)}>
                                {delivery.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(delivery.priority)}>
                                {delivery.priority}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{delivery.recipient_name}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{delivery.address}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {delivery.estimated_time}
                              </div>
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {delivery.package_type}
                              </div>
                              <div className="font-medium text-green-600">
                                ${delivery.delivery_fee.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                openInMaps(delivery);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Navigation className="h-3 w-3 mr-1" />
                              Navigate
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                callRecipient(delivery.phone_number);
                              }}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {deliveries.filter(d => d.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {deliveries.filter(d => d.status === 'in_transit').length}
                    </div>
                    <div className="text-sm text-muted-foreground">In Transit</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      ${deliveries.reduce((sum, d) => sum + d.delivery_fee, 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Earnings</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
