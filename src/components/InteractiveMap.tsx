import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Share2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useKivroShare } from '@/hooks/useKivroShare';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InteractiveMapProps {
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  initialPosition?: [number, number];
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  height?: string;
  allowPinDrop?: boolean;
  showShareButton?: boolean;
}

interface LocationMarker {
  lat: number;
  lng: number;
  address?: string;
  timestamp: number;
}

const LocationMarker: React.FC<{
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
}> = ({ onLocationSelect }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState<string>('');

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      
      // Reverse geocoding to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(response => response.json())
        .then(data => {
          const displayName = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setAddress(displayName);
          onLocationSelect?.(lat, lng, displayName);
        })
        .catch(() => {
          const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setAddress(fallbackAddress);
          onLocationSelect?.(lat, lng, fallbackAddress);
        });
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        <div className="text-sm">
          <p className="font-medium">Selected Location</p>
          <p className="text-xs text-gray-600 mt-1">{address}</p>
          <p className="text-xs text-gray-500 mt-1">
            Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  onLocationSelect,
  initialPosition,
  initialLat,
  initialLng,
  initialAddress,
  height = '400px',
  allowPinDrop = true,
  showShareButton = true,
}) => {
  // Determine the initial position
  const getInitialPosition = (): [number, number] => {
    if (initialLat && initialLng) {
      return [initialLat, initialLng];
    }
    if (initialPosition) {
      return initialPosition;
    }
    // Default to Nairobi, Kenya (will be updated by GPS detection)
    return [-1.2921, 36.8219];
  };

  const [selectedLocation, setSelectedLocation] = useState<LocationMarker | null>(() => {
    // If we have initial coordinates, set them as selected
    if (initialLat && initialLng) {
      return {
        lat: initialLat,
        lng: initialLng,
        address: initialAddress || `${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}`,
        timestamp: Date.now(),
      };
    }
    return null;
  });
  const [shareableLink, setShareableLink] = useState<string>('');
  const { toast } = useToast();
  
  // Initialize KIVRO share modal
  const { openShare, ShareModal, updateShareData } = useKivroShare({
    url: shareableLink,
    title: "My KIVRO Location",
    description: "📍 Find me at this KIVRO location"
  });

  const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
    const location: LocationMarker = {
      lat,
      lng,
      address,
      timestamp: Date.now(),
    };
    setSelectedLocation(location);
    
    // Generate shareable link
    const link = `${window.location.origin}/map?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address || '')}`;
    setShareableLink(link);
    
    // Update share modal data
    updateShareData(
      link,
      "My KIVRO Location",
      `📍 Find me at this KIVRO location: ${address || 'this location'}`
    );
    
    onLocationSelect?.(lat, lng, address);
  }, [onLocationSelect, updateShareData]);

  const handleCopyLink = async () => {
    if (shareableLink) {
      try {
        await navigator.clipboard.writeText(shareableLink);
        toast({
          title: "KIVRO Location Copied!",
          description: "Shareable KIVRO location link copied to clipboard.",
        });
      } catch (error) {
        toast({
          title: "Failed to copy",
          description: "Please copy the link manually.",
          variant: "destructive",
        });
      }
    }
  };

  const handleShareLocation = async () => {
    if (shareableLink && selectedLocation) {
      // Use our custom KIVRO share modal
      openShare();
    } else {
      toast({
        title: "No location selected",
        description: "Please select a location first to share.",
        variant: "destructive",
      });
    }
  };

  // Get user's current location only if no initial coordinates provided
  useEffect(() => {
    if (!initialLat && !initialLng && navigator.geolocation && allowPinDrop) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationSelect(latitude, longitude, 'Your current location');
        },
        (error) => {
          alert('Unable to get your precise location. Please ensure location services are enabled and try again.');
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    }
  }, [handleLocationSelect, initialLat, initialLng, allowPinDrop]);

  // Update share data when initial location is provided
  useEffect(() => {
    if (selectedLocation && !shareableLink) {
      const link = `${window.location.origin}/map?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}&address=${encodeURIComponent(selectedLocation.address || '')}`;
      setShareableLink(link);
      updateShareData(
        link,
        "My KIVRO Location",
        `📍 Find me at this KIVRO location: ${selectedLocation.address || 'this location'}`
      );
    }
  }, [selectedLocation, shareableLink, updateShareData]);

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Interactive Location Map
          </CardTitle>
          {allowPinDrop && (
            <p className="text-sm text-muted-foreground">
              Click anywhere on the map to drop a pin and share your location
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div style={{ height }} className="w-full relative">
            <MapContainer
              center={getInitialPosition()}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
              className="rounded-b-lg"
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {allowPinDrop && <LocationMarker onLocationSelect={handleLocationSelect} />}
              {selectedLocation && (
                <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">Kivro Address Location</p>
                      <p className="text-xs text-gray-600 mt-1">{selectedLocation.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
          
          {selectedLocation && (
            <div className="p-4 border-t">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Selected Location</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedLocation.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
                
                {selectedLocation && shareableLink && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="flex items-center gap-1 hover:bg-gray-50"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleShareLocation}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <Share2 className="h-3 w-3" />
                      Share
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* KIVRO Share Modal */}
      <ShareModal />
    </div>
  );
};

export default InteractiveMap;
