import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [position, setPosition] = useState<[number, number]>([2.0469, 45.3182]); // Default to Mogadishu
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const addressParam = searchParams.get('address');

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        setPosition([latitude, longitude]);
        setAddress(addressParam ? decodeURIComponent(addressParam) : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    }
    
    setIsLoading(false);
  }, [searchParams]);

  const handleGetDirections = () => {
    const [lat, lng] = position;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Kivro Location',
      text: `Find me at: ${address}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Location link copied to clipboard.",
        });
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Location link copied to clipboard.",
        });
      } catch (error) {
        toast({
          title: "Share failed",
          description: "Unable to share or copy link.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading map...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shared Location
              </CardTitle>
              <p className="text-sm text-muted-foreground">{address}</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 w-full">
                <MapContainer
                  center={position}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  className="rounded-b-lg"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={position}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-medium">Shared Location</p>
                        <p className="text-xs text-gray-600 mt-1">{address}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {position[0].toFixed(6)}, {position[1].toFixed(6)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              
              <div className="p-4 border-t">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleGetDirections}
                    className="flex items-center gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share Location
                  </Button>
                </div>
                
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Location Details</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><strong>Address:</strong> {address}</p>
                    <p><strong>Coordinates:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
                    <p><strong>Kivro Format:</strong> KV -P.O Box [phone] {address.split(',')[0]} {address.includes('Somalia') ? 'Somalia' : 'Mogadishu'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MapView;
