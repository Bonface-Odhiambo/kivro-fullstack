import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Copy, Share2, QrCode, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import KivroShareModal from '@/components/KivroShareModal';

interface AddressGeneratedModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressData: {
    kivro_code?: string;
    short_code?: string;
    display_address?: string;
    phone_number?: string;
    full_name?: string;
    company_name?: string;
    city?: string;
    district?: string;
    region?: string;
    postal_code?: string;
    is_active?: boolean;
    latitude?: number;
    longitude?: number;
    share_token?: string;
  };
}

const AddressGeneratedModal: React.FC<AddressGeneratedModalProps> = ({
  isOpen,
  onClose,
  addressData
}) => {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  // Format phone number for display
  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return 'N/A';
    return phone;
  };

  // Get owner name (company name or full name)
  const getOwnerName = () => {
    if (addressData.company_name) return addressData.company_name;
    if (addressData.full_name) return addressData.full_name;
    return 'KIVRO User';
  };

  // Get city name
  const getCityName = () => {
    // Priority: district > city > region
    if (addressData.district) return addressData.district;
    if (addressData.city) return addressData.city;
    if (addressData.region) return addressData.region;
    return 'N/A';
  };

  // Get KIVRO postal code from backend data (location-based, persistent)
  const getPostalCode = () => {
    // Always use postal_code from backend - it's deterministic based on GPS coordinates
    if (addressData.postal_code) return addressData.postal_code;
    
    // Fallback: Extract from short_code if available
    if (addressData.short_code) {
      const parts = addressData.short_code.split('-');
      if (parts.length >= 2) {
        return `${parts[1]}-${parts[2]?.substring(0, 3) || '105'}`;
      }
    }
    
    return 'N/A';
  };

  // Get formatted address text for copying
  const getFormattedAddress = () => {
    const owner = getOwnerName();
    const phone = formatPhoneNumber(addressData.phone_number);
    const shortCode = addressData.short_code || addressData.kivro_code || 'N/A';
    const displayAddr = addressData.display_address || 'Location';
    const city = getCityName();
    const postalCode = getPostalCode();
    const status = addressData.is_active !== false ? 'Active' : 'Inactive';

    return `🏠 KIVRO Address\n\n${owner}, ${phone} KV-P.O Box ${shortCode} Near ${displayAddr}\n${addressData.short_code || ''}\n\nOwner: ${owner}\nPhone: ${phone}\nCity: ${city}\nPostal Code: ${postalCode}\n\nStatus: ${status}`;
  };

  // Get share URL
  const getShareUrl = () => {
    if (addressData.share_token) {
      return `${window.location.origin}/kv/${addressData.share_token}`;
    }
    if (addressData.kivro_code) {
      return `${window.location.origin}/address/${addressData.kivro_code}`;
    }
    return window.location.origin;
  };

  // Get KIVRO PIN link
  const getKivroPinLink = () => {
    if (addressData.latitude && addressData.longitude) {
      return `https://www.google.com/maps?q=${addressData.latitude},${addressData.longitude}`;
    }
    return null;
  };

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(getFormattedAddress());
      toast({
        title: "Address Copied!",
        description: "KIVRO address copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Generate QR code
  const handleGenerateQrCode = async () => {
    try {
      const url = getShareUrl();
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#16a34a',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrDataUrl);
      setShowQrCode(true);
      toast({
        title: "QR Code Generated!",
        description: "Scan to share your KIVRO address",
      });
    } catch (error) {
      toast({
        title: "QR Code Failed",
        description: "Unable to generate QR code",
        variant: "destructive",
      });
    }
  };

  // Copy KIVRO PIN link
  const handleCopyPinLink = async () => {
    const pinLink = getKivroPinLink();
    if (!pinLink) {
      toast({
        title: "No Location Data",
        description: "GPS coordinates not available",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(pinLink);
      toast({
        title: "KIVRO PIN Link Copied!",
        description: "Location link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Open map directly
  const handleViewOnMap = () => {
    const mapLink = getKivroPinLink();
    if (!mapLink) {
      toast({
        title: "No Location Data",
        description: "GPS coordinates not available",
        variant: "destructive",
      });
      return;
    }
    window.open(mapLink, '_blank');
  };

  // Handle KIVRO code click - open map view
  const handleKivroCodeClick = () => {
    const mapLink = getKivroPinLink();
    if (mapLink) {
      window.open(mapLink, '_blank');
      toast({
        title: "Opening Location",
        description: "View your KIVRO address on the map",
      });
    } else {
      toast({
        title: "Location Unavailable",
        description: "GPS coordinates not available for this address",
        variant: "destructive",
      });
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-green-100 rounded-full p-2">
              <span className="text-2xl">🏠</span>
            </div>
            KIVRO Address Generated
          </DialogTitle>
        </DialogHeader>

        {/* Address Card */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-md p-6 border-2 border-green-200">
          {/* Address Content */}
          <div className="space-y-2 text-gray-800">
            {/* Main Address Line */}
            <div className="text-base leading-relaxed">
              <span className="font-semibold">{getOwnerName()}</span>
              {addressData.phone_number && (
                <>
                  , <span className="text-blue-600 font-semibold underline">{formatPhoneNumber(addressData.phone_number)}</span>
                </>
              )}
              {' '}KV-P.O Box{' '}
              <span 
                onClick={handleKivroCodeClick}
                className="text-blue-600 font-semibold underline cursor-pointer hover:text-blue-800 hover:bg-blue-50 px-1 rounded transition-colors"
                title="Click to view location on map"
              >
                {addressData.short_code || addressData.kivro_code || 'N/A'}
              </span>
              {' '}Near {addressData.display_address || 'Location'}
            </div>

            {/* Short Code */}
            {addressData.short_code && (
              <div className="text-base">
                {addressData.short_code}
              </div>
            )}

            {/* Owner */}
            <div className="text-base mt-3">
              <span className="font-medium">Owner: </span>
              <span>{getOwnerName()}</span>
            </div>

            {/* Phone */}
            <div className="text-base">
              <span className="font-medium">Phone: </span>
              <span>{formatPhoneNumber(addressData.phone_number)}</span>
            </div>

            {/* City */}
            <div className="text-base">
              <span className="font-medium">City: </span>
              <span>{getCityName()}</span>
            </div>

            {/* Postal Code */}
            <div className="text-base">
              <span className="font-medium">Postal Code: </span>
              <span>{getPostalCode()}</span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-green-200">
              <span className="font-medium">Status: </span>
              <span className="font-semibold">
                {addressData.is_active !== false ? 'Active' : 'Inactive'}
              </span>
              {addressData.is_active !== false && (
                <div className="bg-green-500 rounded-full p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Display */}
        {showQrCode && qrCodeUrl && (
          <div className="mt-4 p-4 bg-white rounded-lg border-2 border-green-200 text-center">
            <h3 className="font-semibold mb-3 text-gray-800">Scan QR Code to Share</h3>
            <img src={qrCodeUrl} alt="QR Code" className="mx-auto rounded-lg shadow-md" />
            <p className="text-xs text-gray-600 mt-2">Scan with any QR code reader</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mt-6">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCopyAddress}
              variant="outline"
              className="h-11 border-green-500 text-green-700 hover:bg-green-50"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </Button>
            
            <Button
              onClick={() => setShowShareModal(true)}
              className="h-11 bg-green-600 hover:bg-green-700"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handleGenerateQrCode}
              variant="outline"
              className="h-10 border-blue-500 text-blue-700 hover:bg-blue-50 text-sm"
            >
              <QrCode className="h-4 w-4 mr-1" />
              QR Code
            </Button>
            
            <Button
              onClick={handleCopyPinLink}
              variant="outline"
              className="h-10 border-purple-500 text-purple-700 hover:bg-purple-50 text-sm"
              disabled={!getKivroPinLink()}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Copy PIN
            </Button>

            <Button
              onClick={handleViewOnMap}
              variant="outline"
              className="h-10 border-orange-500 text-orange-700 hover:bg-orange-50 text-sm"
              disabled={!getKivroPinLink()}
            >
              <MapPin className="h-4 w-4 mr-1" />
              View Map
            </Button>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 text-center">
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Share Modal */}
    {showShareModal && addressData && (
      <KivroShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={getShareUrl()}
        title="Share KIVRO Address"
        description={`Share your KIVRO address: ${addressData.short_code || addressData.kivro_code}`}
        addressData={{
          kivro_code: addressData.kivro_code,
          display_address: addressData.display_address,
          region: addressData.region,
          district: addressData.district,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          short_code: addressData.short_code,
          share_token: addressData.share_token,
          is_verified: addressData.is_active
        }}
      />
    )}
    </>
  );
};

export default AddressGeneratedModal;
