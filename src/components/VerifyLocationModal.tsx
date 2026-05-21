import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Loader2, 
  Navigation, 
  Check,
  AlertCircle,
  Copy,
  Share2,
  Download,
  CheckCircle,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import InteractiveMap from './InteractiveMap';
import KivroShareModal from './KivroShareModal';
import QRCode from 'qrcode';

interface VerifyLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: {
    id: string;
    kivro_code: string;
    display_address: string;
    latitude?: number;
    longitude?: number;
    short_code?: string;
    share_token?: string;
    is_verified?: boolean;
    location_note?: string;
  };
  onUpdate: () => void;
  onVerificationComplete?: (address: any) => void;
}

const VerifyLocationModal: React.FC<VerifyLocationModalProps> = ({ 
  isOpen, 
  onClose, 
  address, 
  onUpdate,
  onVerificationComplete
}) => {
  const [latitude, setLatitude] = useState<number | null>(address.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(address.longitude || null);
  const [locationNote, setLocationNote] = useState(address.location_note || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'verifying' | 'verified'>(
    address.is_verified ? 'verified' : 'unverified'
  );
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (address.latitude && address.longitude) {
      setLatitude(address.latitude);
      setLongitude(address.longitude);
    }
  }, [address]);

  const handleLocationSelect = (lat: number, lng: number, addressText?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addressText && !locationNote) {
      setLocationNote(addressText);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        setIsLoading(false);
        
        
        toast({
          title: "📍 Precise Location Retrieved",
          description: `Your current location has been set with ${accuracy < 10 ? 'high' : accuracy < 50 ? 'good' : 'moderate'} accuracy (±${accuracy.toFixed(0)}m)`,
        });
      },
      (error) => {
        setIsLoading(false);
        let errorMsg = "Could not get your current location. Please drag the pin manually.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permission denied. Please enable location access and try again.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out. Please try again or drag the pin manually.";
        }
        toast({
          title: "Location Error",
          description: errorMsg,
          variant: "destructive",
        });
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Always get fresh location
      }
    );
  };

  const generateQRCode = async (url: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#16a34a', // green-600
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
    }
  };

  const handleSave = async () => {
    if (!latitude || !longitude) {
      toast({
        title: "Location Required",
        description: "Please select a location on the map",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVerificationStatus('verifying');
    
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      // Call backend API to update location
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/addresses/${address.id}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          latitude,
          longitude,
          location_note: locationNote,
          method: 'manual'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      const data = await response.json();
      
      setIsSaved(true);
      setVerificationStatus('verified');
      
      toast({
        title: "🎉 Address Verified Successfully!",
        description: "Your KIVRO address is now verified and ready to share",
      });

      onUpdate();
      
      // Call the verification complete callback with updated address data
      if (onVerificationComplete) {
        onVerificationComplete({
          ...address,
          ...data,
          latitude,
          longitude,
          location_note: locationNote,
          is_verified: true
        });
      } else {
        // Fallback to showing confirmation modal if no callback provided
        setShowConfirmation(true);
        const shareUrl = `${window.location.origin}/kv/${data.share_token}`;
        await generateQRCode(shareUrl);
      }
    } catch (error: any) {
      setVerificationStatus('unverified');
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!address.share_token) return;
    
    const shareUrl = `${window.location.origin}/kv/${address.share_token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Share link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `kivro-${address.short_code || address.kivro_code}-qr.png`;
    link.href = qrCodeUrl;
    link.click();
    
    toast({
      title: "QR Code Downloaded",
      description: "QR code has been saved to your device",
    });
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setIsSaved(false);
    onClose();
  };

  if (showConfirmation && isSaved) {
    const shareUrl = `${window.location.origin}/kv/${address.share_token}`;
    
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-6 w-6" />
              Location Saved
            </DialogTitle>
            <DialogDescription>
              Your address is now verified. You can share it as a link, a short code, or a QR.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* KIVRO PIN - Prominent Display */}
            {address.short_code ? (
              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-4 text-center shadow-lg">
                <p className="text-xs font-medium mb-2 opacity-90">📍 YOUR KIVRO PIN</p>
                <p className="text-4xl font-bold font-mono tracking-wider mb-1">
                  {address.short_code}
                </p>
                <p className="text-xs opacity-90">Use this PIN for deliveries & e-commerce</p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg p-4 text-center shadow-lg">
                <p className="text-xs font-medium mb-2 opacity-90">📍 KIVRO PIN</p>
                <p className="text-2xl font-bold mb-1">Generating your PIN...</p>
                <p className="text-xs opacity-90">Your unique PIN will appear here momentarily</p>
              </div>
            )}

            {/* QR Code & PIN Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-700 mb-2">Scan QR Code</p>
                  <div className="inline-block p-2 sm:p-3 bg-white border-2 border-green-200 rounded-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 sm:w-32 sm:h-32" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Opens map + address</p>
                  <Button
                    onClick={handleDownloadQR}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              )}

              {/* PIN Code Display */}
              <div className="text-center">
                <p className="text-xs font-medium text-gray-700 mb-2">KIVRO PIN</p>
                {address.short_code ? (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-4">
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600 font-mono mb-2">
                      {address.short_code}
                    </p>
                    <p className="text-xs text-gray-600 mb-2">For e-commerce checkout</p>
                    <Button
                      onClick={async () => {
                        try {
                          const pinUrl = `${window.location.origin}/pin/${address.short_code}`;
                          await navigator.clipboard.writeText(pinUrl);
                          toast({
                            title: "PIN Link Copied!",
                            description: "Share this link - it opens the map with your address",
                          });
                        } catch (error) {
                          toast({
                            title: "Copy Failed",
                            description: "Please copy manually",
                            variant: "destructive",
                          });
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy PIN Link
                    </Button>
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-2">PIN generating...</p>
                    <p className="text-xs text-gray-400">Your PIN will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Share Link */}
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-1">Share Link</Label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-50 font-mono"
                />
                <Button
                  onClick={handleCopyShareLink}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                📍 QR code, PIN link, and share link all show your address on a map
              </p>
            </div>

            {/* Coordinates */}
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs font-medium text-gray-500 mb-0.5">GPS Coordinates</p>
              <p className="text-xs font-mono text-gray-900">
                {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
              </p>
            </div>

            {/* How to Use Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-2">💡 How to Use Your KIVRO Address:</p>
              <ul className="space-y-1 text-xs text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span><strong>QR Code:</strong> Scan to see address with map and PIN location</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span><strong>PIN Link:</strong> Copy and paste in browser - shows map with your exact location</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span><strong>Share Link:</strong> Send to friends - opens navigation directly on mobile</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <Button
                onClick={() => {
                  setShowShareModal(true);
                }}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button
                onClick={() => {
                  window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
                }}
                size="sm"
                variant="outline"
              >
                <MapPin className="h-4 w-4 mr-1" />
                Open Map
              </Button>
            </div>

            <Button
              onClick={handleClose}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl h-[85vh] max-h-[85vh] p-0 flex flex-col">
        <div className="p-3 sm:p-6 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              Verify Your KIVRO Address
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Set the exact location for your address so taxis and deliveries can find you.
              You can use your current GPS, drag the pin, or search for a nearby place.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
          {/* Verification Status Alert */}
          {!verificationStatus || verificationStatus === 'unverified' ? (
            <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 sm:p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900 mb-1">Location Not Verified</p>
                <p className="text-sm text-orange-800">
                  Verify your location to enable sharing and ensure accurate deliveries
                </p>
              </div>
            </div>
          ) : verificationStatus === 'verified' ? (
            <div className="bg-green-50 border border-green-300 rounded-lg p-3 sm:p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 mb-1">✅ Address Verified</p>
                <p className="text-sm text-green-700">Your location is confirmed and ready to share</p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 sm:p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">🔄 Verifying Location...</p>
                <p className="text-sm text-blue-700">Please wait while we confirm your address location</p>
              </div>
            </div>
          )}

          {/* Use Current Location Button */}
          <Button
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            variant="outline"
            className="w-full h-10 sm:h-11 text-sm sm:text-base"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Use My Current Location
          </Button>

          {/* Map with Selected Location Panel and Tip */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden" style={{ height: '350px', position: 'relative' }}>
                <InteractiveMap
                  onLocationSelect={handleLocationSelect}
                  initialLat={latitude || undefined}
                  initialLng={longitude || undefined}
                  height="350px"
                  allowPinDrop={true}
                  showShareButton={false}
                />
                
                {/* Selected Location Overlay */}
                {latitude && longitude && (
                  <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px] z-[1000]">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Selected Location</p>
                    <div className="space-y-2">
                      <div className="bg-gray-50 rounded px-2 py-1.5">
                        <p className="text-xs font-mono text-gray-900">
                          {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded px-2 py-1.5">
                        <p className="text-xs font-mono text-gray-900">
                          {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </p>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <Button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                              toast({
                                title: "Coordinates Copied!",
                                description: "GPS coordinates copied to clipboard",
                              });
                            } catch (error) {
                              toast({
                                title: "Copy Failed",
                                description: "Please copy manually",
                                variant: "destructive",
                              });
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          onClick={() => {
                            const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                            window.open(mapsUrl, '_blank');
                          }}
                          className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {latitude && longitude && (
                <p className="text-xs text-gray-500 mt-2">
                  📍 Click on the map to update your location
                </p>
              )}
            </div>

            {/* Tip Box */}
            <div className="lg:col-span-1">
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 h-full flex items-start">
                <div className="text-sm text-yellow-900">
                  <p className="font-medium mb-2">💡 Tip:</p>
                  <p className="text-xs leading-relaxed">
                    If streets are unmarked, place the pin at your gate or nearest landmark.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Note */}
          <div>
            <Label htmlFor="location-note" className="text-sm sm:text-base">
              Location Notes (Optional)
            </Label>
            <Textarea
              id="location-note"
              placeholder="e.g., Near Central Area, Salahley, white gate on the left"
              value={locationNote}
              onChange={(e) => setLocationNote(e.target.value)}
              rows={2}
              className="mt-1 min-h-[60px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add helpful details for drivers and delivery personnel
            </p>
          </div>

          </div>
        </div>
        
        {/* Sticky Footer */}
        <div className="border-t p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSave}
              disabled={isLoading || !latitude || !longitude}
              className="flex-1 bg-green-600 hover:bg-green-700 h-11 sm:h-12 w-full text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Verify Location
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="h-11 sm:h-12 w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Share Modal */}
      {showShareModal && address.share_token && (
        <KivroShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={`${window.location.origin}/kv/${address.share_token}`}
          title="Share Your Verified KIVRO Address"
          description="Your address is verified and ready to share"
          addressId={address.id}
          addressData={{
            ...address,
            latitude,
            longitude,
            location_note: locationNote
          }}
        />
      )}
    </Dialog>
  );
};

export default VerifyLocationModal;
