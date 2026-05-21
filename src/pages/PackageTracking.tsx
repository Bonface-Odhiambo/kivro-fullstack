import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Package,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  User,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PackageInfo {
  id: string;
  tracking_number: string;
  qr_code: string;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  kivro_address?: string;
  status: string;
  weight_kg?: number;
  dimensions?: string;
  created_at: string;
  estimated_delivery?: string;
  current_bag?: {
    bag_number: string;
    current_agency_id: string;
  };
  origin_agency?: {
    name: string;
    location: string;
  };
  destination_agency?: {
    name: string;
    location: string;
  };
}

interface ScanHistory {
  id: string;
  scanned_at: string;
  scan_location?: string;
  scanned_by?: string;
  scan_notes?: string;
  agency?: {
    name: string;
    location: string;
  };
}

export default function PackageTracking() {
  const [trackingInput, setTrackingInput] = useState('');
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // Real-time subscription: update package status automatically when it changes
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!packageInfo?.id) return;

    // Clean up any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`package-${packageInfo.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'packages',
          filter: `id=eq.${packageInfo.id}`,
        },
        (payload) => {
          setPackageInfo(prev => prev ? { ...prev, ...(payload.new as Partial<PackageInfo>) } : prev);
          toast({
            title: '📦 Package updated',
            description: `Status changed to ${(payload.new as PackageInfo).status?.replace('_', ' ')}`,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [packageInfo?.id]);

  const handleTrackPackage = async () => {
    if (!trackingInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking number or QR code",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Call the track-package edge function with proper parameters
      const isQRCode = trackingInput.startsWith('KV-');
      const queryParams = new URLSearchParams();
      
      if (isQRCode) {
        queryParams.append('qr_code', trackingInput);
      } else {
        queryParams.append('tracking_number', trackingInput);
      }
      
      const { data, error } = await supabase.functions.invoke('track-package', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: queryParams.toString(),
      });

      if (error) throw error;

      if (data.success) {
        setPackageInfo(data.package);
        setScanHistory(data.scan_history || []);
        toast({
          title: "Package Found",
          description: `Package ${trackingInput} has been located`,
        });
      } else {
        toast({
          title: "Package Not Found",
          description: data.error || "No package found with this identifier",
          variant: "destructive",
        });
        setPackageInfo(null);
        setScanHistory([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to track package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Package Tracking</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Track packages throughout Somalia's postal network
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Track Your Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter tracking number or QR code..."
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTrackPackage()}
              />
            </div>
            <Button 
              onClick={handleTrackPackage}
              disabled={loading}
              className="bg-primary hover:bg-primary-dark w-full sm:w-auto"
            >
              {loading ? 'Tracking...' : 'Track Package'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Package Information */}
      {packageInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Package Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                <p className="text-lg font-semibold">{packageInfo.tracking_number}</p>
              </div>

              <div className="flex items-center gap-2">
                {getStatusIcon(packageInfo.status)}
                <Badge className={getStatusColor(packageInfo.status)}>
                  {packageInfo.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Sender
                  </label>
                  <p className="font-medium">{packageInfo.sender_name}</p>
                  {packageInfo.sender_phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {packageInfo.sender_phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Recipient
                  </label>
                  <p className="font-medium">{packageInfo.recipient_name}</p>
                  {packageInfo.recipient_phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {packageInfo.recipient_phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Delivery Address
                </label>
                <p className="text-sm">{packageInfo.recipient_address}</p>
                {packageInfo.kivro_address && (
                  <p className="text-sm text-primary font-medium">
                    Kivro: {packageInfo.kivro_address}
                  </p>
                )}
              </div>

              {(packageInfo.weight_kg || packageInfo.dimensions) && (
                <div className="grid grid-cols-2 gap-4">
                  {packageInfo.weight_kg && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Weight</label>
                      <p className="text-sm">{packageInfo.weight_kg} kg</p>
                    </div>
                  )}
                  {packageInfo.dimensions && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Dimensions</label>
                      <p className="text-sm">{packageInfo.dimensions}</p>
                    </div>
                  )}
                </div>
              )}

              {packageInfo.estimated_delivery && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Estimated Delivery</span>
                  </div>
                  <p className="text-blue-700 mt-1">
                    {new Date(packageInfo.estimated_delivery).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent-orange" />
                Tracking History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanHistory.length > 0 ? (
                <div className="space-y-4">
                  {scanHistory.map((scan, index) => (
                    <div key={scan.id} className="relative">
                      {index < scanHistory.length - 1 && (
                        <div className="absolute left-2 top-8 w-px h-8 bg-border" />
                      )}
                      <div className="flex items-start gap-3">
                        <div className="h-4 w-4 bg-primary rounded-full flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {scan.agency?.name || 'Postal Agency'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(scan.scanned_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {scan.scan_location || scan.agency?.location}
                          </p>
                          {scan.scan_notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {scan.scan_notes}
                            </p>
                          )}
                          {scan.scanned_by && (
                            <p className="text-xs text-muted-foreground">
                              Scanned by: {scan.scanned_by}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tracking history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Search className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-2">Track by Number</h3>
              <p className="text-sm text-muted-foreground">
                Use your tracking number to get real-time updates
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 text-accent-orange" />
              <h3 className="font-medium mb-2">QR Code Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Scan or enter your QR code for instant tracking
              </p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Phone className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium mb-2">Customer Support</h3>
              <p className="text-sm text-muted-foreground">
                Call +252-xx-xxx-xxxx for assistance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}