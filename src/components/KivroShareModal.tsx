import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Copy, 
  Share2, 
  MessageCircle, 
  Mail, 
  Phone, 
  Facebook, 
  Twitter, 
  Linkedin,
  MapPin,
  ExternalLink,
  AlertCircle,
  Navigation
} from 'lucide-react';

interface KivroShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title?: string;
  description?: string;
  addressId?: string;
  addressData?: any;
}

const KivroShareModal: React.FC<KivroShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  title = "Share KIVRO Address",
  description,
  addressId,
  addressData
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Debug: Log address data when modal opens
  React.useEffect(() => {
    if (isOpen && addressData) {
    }
  }, [isOpen, addressData]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Share link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My KIVRO Address',
          text: `Check out my KIVRO address: ${addressData?.display_address || ''}`,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled or error occurred
        handleCopy();
      }
    } else {
      handleCopy();
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast({
          title: "Location Retrieved",
          description: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`,
        });
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Could not retrieve your current location",
          variant: "destructive",
        });
      }
    );
  };

  const shareViaWhatsApp = () => {
    const message = `🏠 My KIVRO Address:\n\n${addressData?.display_address || ''}\n\n📱 ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = "My KIVRO Address";
    const body = `Hi! I wanted to share my KIVRO address with you:\n\n${addressData?.display_address || ''}\n\n📱 Share Link: ${shareUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaSMS = () => {
    const message = `🏠 My KIVRO Address:\n\n${addressData?.display_address || ''}\n\n📱 ${shareUrl}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`);
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = `Check out my KIVRO address: ${addressData?.display_address || ''}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareViaLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Use My Current Location Button */}
          <Button
            onClick={handleUseCurrentLocation}
            variant="outline"
            className="w-full h-11 border-2 border-green-500 text-green-600 hover:bg-green-50"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Use My Current Location
          </Button>

          {/* Map with Address Card */}
          {addressData?.latitude && addressData?.longitude ? (
            <div className="relative rounded-lg overflow-hidden border border-gray-300" style={{ height: '350px' }}>
              {/* Google Maps Embed */}
              <div className="absolute inset-0">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${Number(addressData.latitude)},${Number(addressData.longitude)}&z=16&output=embed`}
                  allowFullScreen
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Address Location Map"
                />
              </div>

              {/* Open in map button - Top Left */}
              <a
                href={`https://www.google.com/maps?q=${addressData.latitude},${addressData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 left-3 bg-white rounded-md shadow-md px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1 z-10"
              >
                <ExternalLink className="h-3 w-3" />
                Open in map
              </a>
              
              {/* Address Card Overlay - Bottom Right */}
              <div className="absolute bottom-3 right-3 bg-white rounded-lg shadow-xl border-2 border-blue-400 p-3 max-w-[320px] z-10">
                <div className="space-y-2">
                  {/* Short Code */}
                  {addressData.short_code && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Short Code</p>
                      <p className="text-xl font-bold text-blue-600">{addressData.short_code}</p>
                      <p className="text-xs text-gray-500">Easy to remember and share</p>
                    </div>
                  )}
                  
                  {/* Full Address */}
                  <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
                    <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900 leading-relaxed">
                        {addressData.display_address}
                      </p>
                    </div>
                  </div>

                  {/* Copy and Share Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 border-gray-300"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy
                    </Button>
                    <Button
                      onClick={handleShare}
                      size="sm"
                      className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1.5" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-gray-300 bg-gray-50 flex items-center justify-center" style={{ height: '350px' }}>
              <div className="text-center p-6">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">Location Not Available</p>
                <p className="text-xs text-gray-500">This address hasn't been verified with GPS coordinates yet.</p>
                <p className="text-xs text-gray-500 mt-2">Please verify the location first to see the map.</p>
              </div>
            </div>
          )}

          {/* Direct Navigation Link */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Direct Navigation Link</h3>
            <div className="relative">
              <Input
                value={shareUrl}
                readOnly
                className="h-11 text-sm bg-white pr-10 border-gray-300 font-mono text-gray-700"
              />
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
              >
                <Copy className="h-4 w-4 text-green-600" />
              </Button>
            </div>
            <p className="text-xs text-green-600">
              Works like GPS sharing: Opens navigation app automatically on mobile devices
            </p>
          </div>

          {/* Quick Share */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Quick Share</h3>
            <div className="flex gap-2">
              <Button
                onClick={shareViaEmail}
                size="sm"
                className="h-10 w-10 p-0 bg-orange-500 hover:bg-orange-600 rounded-md"
                title="Email"
              >
                <Mail className="h-4 w-4 text-white" />
              </Button>
              <Button
                onClick={shareViaSMS}
                size="sm"
                className="h-10 w-10 p-0 bg-blue-500 hover:bg-blue-600 rounded-md"
                title="Phone"
              >
                <Phone className="h-4 w-4 text-white" />
              </Button>
              <Button
                onClick={shareViaWhatsApp}
                size="sm"
                className="h-10 w-10 p-0 bg-green-500 hover:bg-green-600 rounded-md"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4 text-white" />
              </Button>
              <Button
                onClick={shareViaFacebook}
                size="sm"
                className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 rounded-md"
                title="Facebook"
              >
                <Facebook className="h-4 w-4 text-white" />
              </Button>
              <Button
                onClick={shareViaTwitter}
                size="sm"
                className="h-10 w-10 p-0 bg-sky-400 hover:bg-sky-500 rounded-md"
                title="Twitter"
              >
                <Twitter className="h-4 w-4 text-white" />
              </Button>
              <Button
                onClick={shareViaLinkedIn}
                size="sm"
                className="h-10 w-10 p-0 bg-blue-700 hover:bg-blue-800 rounded-md"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>

          {/* Don't have a KIVRO address yet? */}
          <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <MapPin className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">
                Don't have a KIVRO address yet?
              </p>
              <p className="text-xs text-green-800 mb-2">
                Get your own digital address in seconds! Make sure you're at your location when generating for accurate results.
              </p>
              <a
                href="/dashboard/addresses"
                className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                Generate your address
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Important: Be at Your Location */}
          <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900 mb-1">
                Important: Be at Your Location
              </p>
              <p className="text-xs text-orange-800">
                For the most accurate address generation, please make sure you are physically at your house, business location, or specific landmark when generating your address.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KivroShareModal;
