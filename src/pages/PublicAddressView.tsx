import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Copy, 
  Check,
  AlertCircle,
  Home,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PublicAddress {
  id: string;
  kivro_code: string;
  display_address: string;
  latitude: number;
  longitude: number;
  short_code: string;
  region?: string;
  district?: string;
  landmark?: string;
  location_note?: string;
  house_number?: string;
  house_image_url?: string;
  building_image_url?: string;
  company_logo_url?: string;
  is_verified: boolean;
  is_business?: boolean;
}

export default function PublicAddressView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [address, setAddress] = useState<PublicAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoNavigated, setAutoNavigated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPublicAddress();
  }, [shareToken]);

  // Auto-navigate when address is loaded (like GPS sharing)
  useEffect(() => {
    if (address && !autoNavigated) {
      setAutoNavigated(true);
      
      // Detect if user is on mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Auto-redirect to navigation app on mobile (like GPS sharing)
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);
        
        // Small delay to ensure page loads first
        setTimeout(() => {
          if (isIOS) {
            // iOS: Try Apple Maps first, fallback to Google Maps
            window.location.href = `http://maps.apple.com/?ll=${address.latitude},${address.longitude}&q=${encodeURIComponent(address.display_address)}`;
          } else if (isAndroid) {
            // Android: Try Google Maps app first
            window.location.href = `geo:${address.latitude},${address.longitude}?q=${address.latitude},${address.longitude}(${encodeURIComponent(address.display_address)})`;
            
            // Fallback to Google Maps web if app not installed
            setTimeout(() => {
              window.location.href = `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
            }, 1500);
          } else {
            // Other mobile devices: use Google Maps
            window.location.href = `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
          }
        }, 500);
      }
    }
  }, [address, autoNavigated]);

  const fetchPublicAddress = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/addresses/public/${shareToken}`);
      
      if (!response.ok) {
        throw new Error('Address not found or not available');
      }

      const data = await response.json();
      setAddress(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load address');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address.display_address);
      setCopied(true);
      toast({
        title: "Address Copied!",
        description: "The address has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the address manually",
        variant: "destructive",
      });
    }
  };

  const openInGoogleMaps = () => {
    if (!address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
    window.open(url, '_blank');
  };

  const openInAppleMaps = () => {
    if (!address) return;
    const url = `http://maps.apple.com/?ll=${address.latitude},${address.longitude}&q=${encodeURIComponent(address.display_address)}`;
    window.open(url, '_blank');
  };

  const openInWaze = () => {
    if (!address) return;
    const url = `https://waze.com/ul?ll=${address.latitude},${address.longitude}&navigate=yes`;
    window.open(url, '_blank');
  };

  const startNavigation = () => {
    // Default to Google Maps for navigation
    openInGoogleMaps();
  };

  // Check if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading address...</p>
              {isMobile && (
                <p className="text-sm text-green-600 mt-2">📍 Preparing navigation...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-red-200">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Address Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'This address is not available or has been removed.'}</p>
              <Button onClick={() => window.location.href = 'https://kivro.africa'} className="bg-green-600 hover:bg-green-700">
                Go to KIVRO
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4 py-8">
        {/* Auto-Navigation Notice for Mobile */}
        {isMobile && autoNavigated && (
          <div className="bg-green-600 text-white rounded-lg p-4 shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <Navigation className="h-6 w-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">🧭 Opening Navigation App...</p>
                <p className="text-sm text-green-100">
                  If navigation didn't start automatically, use the buttons below
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">KIVRO Address</h1>
          </div>
          <p className="text-gray-600">
            {isMobile ? 'Navigation starting...' : 'Navigate to this location'}
          </p>
        </div>

        {/* Map with Address Overlay */}
        <Card className="overflow-hidden border-2 border-green-200">
          <div className="relative">
            <iframe
              width="100%"
              height="400"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps?q=${address.latitude},${address.longitude}&output=embed&z=17`}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            
            {/* Address Overlay on Map */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-4 border-2 border-green-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">KIVRO Address</p>
                  <p className="text-lg font-bold text-gray-900 break-words leading-tight">
                    {address.display_address}
                  </p>
                  {address.short_code && (
                    <p className="text-sm font-mono text-purple-600 mt-1">
                      Code: {address.short_code}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleCopyAddress}
                  variant="outline"
                  size="sm"
                  className={`flex-shrink-0 ${copied ? 'bg-green-50 border-green-200' : ''}`}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Verification Badge */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
              <Badge variant={address.is_verified ? "default" : "secondary"} className={address.is_verified ? "bg-green-600" : ""}>
                {address.is_verified ? '✓ Verified' : 'Unverified'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Address Details */}
        <Card className="border-2 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                {address.is_business ? (
                  <Building2 className="h-5 w-5 text-purple-600" />
                ) : (
                  <Home className="h-5 w-5 text-green-600" />
                )}
                {address.is_business ? 'Business Address' : 'Delivery Address'}
              </CardTitle>
              {address.short_code && (
                <Badge variant="outline" className="text-lg font-mono">
                  {address.short_code}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Address */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Full Address</p>
                  <p className="text-lg font-semibold text-gray-900 break-words">
                    {address.display_address}
                  </p>
                </div>
                <Button
                  onClick={handleCopyAddress}
                  variant="outline"
                  size="sm"
                  className={copied ? 'bg-green-50 border-green-200' : ''}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {address.region && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Region</p>
                  <p className="text-sm font-medium text-gray-900">{address.region}</p>
                </div>
              )}
              {address.district && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">District</p>
                  <p className="text-sm font-medium text-gray-900">{address.district}</p>
                </div>
              )}
              {address.house_number && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">House/Building Number</p>
                  <p className="text-sm font-medium text-gray-900">{address.house_number}</p>
                </div>
              )}
              {address.kivro_code && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">KIVRO Code</p>
                  <p className="text-sm font-mono font-medium text-gray-900">{address.kivro_code}</p>
                </div>
              )}
            </div>

            {/* Location Notes */}
            {(address.landmark || address.location_note) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-800 mb-1">📍 Location Notes</p>
                <p className="text-sm text-blue-900">
                  {address.location_note || address.landmark}
                </p>
              </div>
            )}

            {/* Building/House Images */}
            {(address.house_image_url || address.building_image_url || address.company_logo_url) && (
              <div className="space-y-3">
                {/* Company Logo (for business addresses) */}
                {address.is_business && address.company_logo_url && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Company Logo</p>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-center">
                      <img 
                        src={address.company_logo_url} 
                        alt="Company Logo" 
                        className="max-h-24 max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}
                
                {/* Building/House Photo */}
                {(address.building_image_url || address.house_image_url) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      {address.is_business ? 'Building Photo' : 'House Photo'}
                    </p>
                    <img 
                      src={address.building_image_url || address.house_image_url} 
                      alt={address.is_business ? 'Building' : 'House'} 
                      className="w-full h-64 object-cover rounded-lg border border-gray-200 shadow-md"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Coordinates */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">GPS Coordinates</p>
              <p className="text-sm font-mono text-gray-900">
                {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Navigation className="h-5 w-5 text-green-600" />
              Navigate to Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Primary Navigation Button */}
            <Button 
              onClick={startNavigation}
              className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
            >
              <Navigation className="h-5 w-5 mr-2" />
              Start Navigation
            </Button>

            {/* App-Specific Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                onClick={openInGoogleMaps}
                variant="outline"
                className="flex items-center justify-center gap-2 h-12"
              >
                <ExternalLink className="h-4 w-4" />
                Google Maps
              </Button>
              <Button
                onClick={openInAppleMaps}
                variant="outline"
                className="flex items-center justify-center gap-2 h-12"
              >
                <ExternalLink className="h-4 w-4" />
                Apple Maps
              </Button>
              <Button
                onClick={openInWaze}
                variant="outline"
                className="flex items-center justify-center gap-2 h-12"
              >
                <ExternalLink className="h-4 w-4" />
                Waze
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 pt-2">
              Choose your preferred navigation app
            </p>
          </CardContent>
        </Card>

        {/* Get Your Own Address CTA */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Get Your Own KIVRO Address
              </h3>
              <p className="text-gray-600 mb-4">
                Create your own digital address in seconds. Make deliveries and navigation easier for everyone.
              </p>
              <Button 
                onClick={() => window.location.href = 'https://kivro.africa'}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Free Address
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>Powered by KIVRO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
