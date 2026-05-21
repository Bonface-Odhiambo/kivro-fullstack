import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check,
  Copy,
  Share2,
  Download,
  MapPin,
  Shield,
  QrCode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import KivroShareModal from './KivroShareModal';
import QRCode from 'qrcode';

interface AddressVerificationSectionProps {
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
  } | null;
  onClose: () => void;
}

const AddressVerificationSection: React.FC<AddressVerificationSectionProps> = ({ 
  address, 
  onClose 
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (address?.share_token) {
      generateQRCode();
    }
  }, [address]);

  const generateQRCode = async () => {
    if (!address?.share_token) return;
    
    try {
      const shareUrl = `${window.location.origin}/kv/${address.share_token}`;
      const qrUrl = await QRCode.toDataURL(shareUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#16a34a',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
    }
  };

  const handleCopyShareLink = async () => {
    if (!address?.share_token) return;
    
    try {
      const shareUrl = `${window.location.origin}/kv/${address.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Share Link Copied!",
        description: "Link copied to clipboard - paste anywhere to share your address",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `kivro-qr-${address?.short_code || 'address'}.png`;
    link.href = qrCodeUrl;
    link.click();
    
    toast({
      title: "QR Code Downloaded!",
      description: "QR code saved to your downloads folder",
    });
  };

  if (!address) return null;

  const shareUrl = `${window.location.origin}/kv/${address.share_token}`;

  return (
    <>
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Check className="h-6 w-6" />
            Location Saved
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your address is now verified. You can share it as a link, a short code, or a QR.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* QR Code */}
            {qrCodeUrl && (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-3">Scan QR Code</p>
                <div className="inline-block p-3 bg-white border-2 border-green-200 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                </div>
                <p className="text-xs text-gray-500 mt-2 mb-3">Opens map + address</p>
                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            )}

            {/* PIN Code Display */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-3">KIVRO PIN</p>
              {address.short_code ? (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-4">
                  <p className="text-3xl font-bold text-purple-600 font-mono mb-2">
                    {address.short_code}
                  </p>
                  <p className="text-xs text-gray-600 mb-3">For e-commerce checkout</p>
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
                    <Copy className="h-4 w-4 mr-2" />
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
            <p className="text-sm font-medium text-gray-700 mb-2">Share Link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 font-mono"
              />
              <Button
                onClick={handleCopyShareLink}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              📍 QR code, PIN link, and share link all show your address on a map
            </p>
          </div>

          {/* Coordinates */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-500 mb-1">GPS Coordinates</p>
            <p className="text-sm font-mono text-gray-900">
              {address.latitude?.toFixed(6)}, {address.longitude?.toFixed(6)}
            </p>
          </div>

          {/* How to Use Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-3">💡 How to Use Your KIVRO Address:</p>
            <ul className="space-y-2 text-sm text-blue-800">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <Button
              onClick={() => setShowShareModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Address
            </Button>
            <Button
              onClick={() => {
                window.open(`https://www.google.com/maps?q=${address.latitude},${address.longitude}`, '_blank');
              }}
              variant="outline"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Open in Maps
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Modal */}
      {showShareModal && address && (
        <KivroShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareUrl={shareUrl}
          addressData={address}
          title="Share Your KIVRO Address"
          description="Share your verified KIVRO address with others"
        />
      )}
    </>
  );
};

export default AddressVerificationSection;
