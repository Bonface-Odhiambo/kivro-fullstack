import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Navigation, Share2, Loader2, X, Copy, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useKivroShare } from '@/hooks/useKivroShare';
import { validateAfricanPhone, autoFormatAfricanPhoneInput, getPhonePlaceholder, handleSmartPhoneInput } from '@/lib/africanPhoneValidation';
import { validateUserLocation } from '@/lib/geolocation';
import { API_ENDPOINTS } from '@/config/api';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [landmark, setLandmark] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [generatedAddress, setGeneratedAddress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [phoneError, setPhoneError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Initialize KIVRO share modal
  const shareUrl = generatedAddress ? `${window.location.origin}/address/${generatedAddress.kivro_code}` : '';
  const { openShare, ShareModal } = useKivroShare({
    url: shareUrl,
    title: "My KIVRO Address",
    description: `🎉 Check out my new KIVRO address: ${generatedAddress?.display_address || generatedAddress?.full_address || ''}`,
    addressId: generatedAddress?.id,
    addressData: generatedAddress
  });

  // Check authentication when modal opens
  useEffect(() => {
    if (isOpen) {
      checkAuthentication();
    }
  }, [isOpen]);

  const checkAuthentication = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        // Pre-fill user data if available
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, phone_number')
          .eq('user_id', session.user.id)
          .single() as { data: { display_name: string; phone_number: string } | null; error: any };
          
        if (profile) {
          setFullName(profile.display_name || '');
          setPhoneNumber(profile.phone_number || '');
        }
        // Also set email from session
        if (session.user.email) {
          setEmail(session.user.email);
        }
        requestLocationPermission();
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleSignInRedirect = () => {
    onClose();
    navigate('/auth');
  };

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError('');
        setIsLoading(false);
      },
      (error) => {
        setLocationError('Location access denied. Please enable location services.');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleLocationSelect = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please allow location access to generate your address.",
        variant: "destructive"
      });
      return;
    }

    if (!fullName.trim()) {
      toast({
        title: "Full Name Required",
        description: "Please enter your full name.",
        variant: "destructive"
      });
      return;
    }

    // Validate phone number
    const phoneValidation = validateAfricanPhone(phoneNumber);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      toast({
        title: "Invalid Phone Number",
        description: phoneValidation.error || 'Please enter a valid African phone number with country code',
        variant: "destructive"
      });
      return;
    }
    setPhoneError('');

    // Validate user's geographic location
    try {
      const locationValidation = await validateUserLocation(phoneNumber);
      
      if (!locationValidation.isValid) {
        toast({
          title: "🌍 Location Verification",
          description: locationValidation.message,
          variant: "destructive"
        });
        
        // Still allow address generation but warn user
        if (!locationValidation.message.includes('Unable to verify')) {
          return; // Block if we can verify they're in wrong country
        }
      } else {
        toast({
          title: "📍 Location Verified",
          description: locationValidation.message,
        });
      }
    } catch (error) {
      // Continue with address generation if location validation fails
      toast({
        title: "⚠️ Location Check",
        description: "Unable to verify your location. Address generation will proceed.",
      });
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to create your address');
      }

      const response = await fetch(API_ENDPOINTS.ADDRESSES.GENERATE_WITH_LOCATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phoneNumber,
          latitude: location.lat,
          longitude: location.lng,
          email: email || undefined,
          landmark_description: landmark || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check for phone validation errors from backend
        if (errorData.error === 'Validation failed' && errorData.details) {
          const phoneError = errorData.details.find((d: any) => d.param === 'phone_number');
          if (phoneError) {
            setPhoneError(phoneError.msg);
            toast({
              title: "❌ Invalid Phone Number",
              description: phoneError.msg || "Please enter a valid Somalia phone number starting with +252 followed by 9 digits.",
              variant: "destructive",
            });
            return;
          }
        }
        
        if (errorData.upgrade_required) {
          toast({
            title: "Upgrade Required",
            description: errorData.message || "You've reached the free tier limit. Please upgrade to create more addresses.",
            variant: "destructive",
          });
          return;
        }
        
        if (errorData.renewal_required) {
          toast({
            title: "Subscription Expired",
            description: errorData.message || "Your subscription has expired. Please renew to continue.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(errorData.message || 'Failed to generate address');
      }

      const data = await response.json();

      if (data.success) {
        setGeneratedAddress(data.data);
        setStep(2);
        // Check if address was auto-verified (AddressModal always uses GPS coordinates)
        toast({
          title: "🎉 Address Created & Verified!",
          description: `Your verified KIVRO address: ${data.data.display_address || data.data.full_address}`,
        });
      } else {
        throw new Error(data.message || 'Failed to generate address');
      }
    } catch (error) {
      toast({
        title: "Address Generation Failed",
        description: (error as Error).message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get the well-formatted address
  const getFormattedAddress = () => {
    if (!generatedAddress) return '';
    return generatedAddress.display_address || generatedAddress.full_address || generatedAddress.kivro_code || '';
  };

  const handleShare = (method: string) => {
    if (!generatedAddress) return;
    
    if (method === 'copy') {
      // Use clean address format for copying
      const addressText = getFormattedAddress();
      const shareText = `🎉 Congratulations!\n\nYour KIVRO address is: ${addressText}\n\nYou can now receive packages at this address. Welcome to KIVRO!`;
      navigator.clipboard.writeText(shareText);
      toast({
        title: "KIVRO Address Copied!",
        description: "Your KIVRO address has been copied to clipboard",
      });
    } else if (method === 'whatsapp' || method === 'sms') {
      // Use our custom KIVRO share modal for better experience
      openShare();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {isCheckingAuth ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Checking authentication...</p>
            </div>
          </div>
        ) : !isAuthenticated ? (
          <>
            <DialogHeader>
              <DialogTitle>Sign In Required</DialogTitle>
              <DialogDescription>
                Please sign in to create your Kivro address
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 text-center py-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Get Your Digital Address</h3>
              <p className="text-muted-foreground">
                Create your account to get a unique Kivro address that works anywhere in Africa. 
                Perfect for online shopping, deliveries, and sharing your location.
              </p>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Maybe Later
                </Button>
                <Button onClick={handleSignInRedirect} className="flex-1 bg-green-600 hover:bg-green-700">
                  Sign In / Sign Up
                </Button>
              </div>
            </div>
          </>
        ) : step === 1 && (
          <>
            <DialogHeader className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-6 w-6 p-0"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
              <DialogTitle>Create Your Kivro Address</DialogTitle>
              <DialogDescription>
                Drop a pin on the map to set your precise location
              </DialogDescription>
            </DialogHeader>

            {/* User Credentials Display */}
            {(fullName || email || phoneNumber) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-green-800 mb-2">📋 Your Information</p>
                {fullName && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600 font-medium">Name:</span>
                    <span className="text-green-800">{fullName}</span>
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600 font-medium">Email:</span>
                    <span className="text-green-800">{email}</span>
                  </div>
                )}
                {phoneNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600 font-medium">Phone:</span>
                    <span className="text-green-800">{phoneNumber}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Map Section */}
              <div className="relative">
                <div className="h-64 rounded-lg overflow-hidden border bg-gray-100">
                  {location && !isLoading ? (
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng-0.01},${location.lat-0.01},${location.lng+0.01},${location.lat+0.01}&layer=mapnik&marker=${location.lat},${location.lng}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      title="Your current location"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {isLoading ? (
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Getting your location...</p>
                        </div>
                      ) : locationError ? (
                        <div className="text-center p-4">
                          <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-2">{locationError}</p>
                          <Button onClick={requestLocationPermission} size="sm">
                            Try Again
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Waiting for location access...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {location && (
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs">
                    📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm"
                  onClick={() => window.open(`https://maps.google.com/?q=${location?.lat},${location?.lng}`, '_blank')}
                  disabled={!location}
                >
                  View larger map
                </Button>
              </div>

              {/* Full Name Input */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your name will be associated with your Kivro address
                </p>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={getPhonePlaceholder()}
                  value={phoneNumber}
                  onChange={(e) => {
                    const inputResult = handleSmartPhoneInput(phoneNumber, e.target.value);
                    
                    if (inputResult.shouldPrevent) {
                      // Don't update if input should be prevented
                      if (inputResult.message) {
                        setPhoneError(inputResult.message);
                      }
                      return;
                    }
                    
                    setPhoneNumber(inputResult.value);
                    
                    // Show real-time feedback
                    if (inputResult.message) {
                      if (inputResult.message.includes('✅')) {
                        setPhoneError(''); // Clear error for valid input
                      } else {
                        setPhoneError(inputResult.message);
                      }
                    } else {
                      setPhoneError('');
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur
                    if (phoneNumber.trim()) {
                      const validation = validateAfricanPhone(phoneNumber);
                      if (!validation.isValid) {
                        setPhoneError(validation.error || 'Invalid phone number');
                      } else {
                        setPhoneError('');
                        // Update with cleaned version
                        if (validation.cleanedPhone) {
                          setPhoneNumber(validation.cleanedPhone);
                        }
                      }
                    }
                  }}
                  className={phoneError ? 'border-red-500' : ''}
                  required
                />
                {phoneError ? (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    <span>{phoneError}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Enter your phone number with country code (e.g., +234 803 123 4567)
                  </p>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We'll send you a confirmation email with your address
                </p>
              </div>

              {/* Landmark Input */}
              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark Description (Optional)</Label>
                <Textarea
                  id="landmark"
                  placeholder="e.g., Blue kiosk near Suuqa Xoolaha, next to the bus stop"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={requestLocationPermission}
                  disabled={isLoading}
                >
                  <Navigation size={16} className="mr-2" />
                  {isLoading ? 'Getting Location...' : 'Use Current Location'}
                </Button>
                <Button 
                  onClick={handleLocationSelect} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!location || isLoading || !fullName.trim() || !phoneNumber.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Confirm Location'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">🎉 Congratulations!</DialogTitle>
              <DialogDescription className="text-center">
                Your Kivro address has been successfully created
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Address Display */}
              <div className="text-center bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-sm text-green-600 mb-2 font-medium">Your address is:</p>
                <div className="font-mono text-lg font-bold text-green-800 break-all">
                  {getFormattedAddress()}
                </div>
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Region</Label>
                  <p className="font-medium">{generatedAddress?.region}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">District</Label>
                  <p className="font-medium">{generatedAddress?.district}</p>
                </div>
              </div>

              {/* KIVRO Description */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <Label className="text-xs font-medium text-blue-600">About KIVRO</Label>
                <p className="text-blue-800 text-sm">
                  KIVRO provides digital addresses for Africa, making it easy to receive packages and mail anywhere. 
                  Your address is now ready for deliveries, online shopping, and sharing with friends and family.
                </p>
              </div>

              {/* Landmark if provided */}
              {generatedAddress?.landmark && (
                <div>
                  <Label className="text-sm font-medium">Landmark</Label>
                  <p className="text-muted-foreground">{generatedAddress.landmark}</p>
                </div>
              )}

              {/* Notification Status */}
              {generatedAddress?.notifications && (
                <div className="text-sm space-y-1">
                  <Label className="font-medium">Notifications Sent:</Label>
                  {generatedAddress.notifications.email?.success && (
                    <p className="text-green-600">✅ Email confirmation sent</p>
                  )}
                  {generatedAddress.notifications.sms?.success && (
                    <p className="text-green-600">✅ SMS confirmation sent</p>
                  )}
                </div>
              )}

              {/* Share Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Share Your KIVRO Address</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShare('copy')}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => openShare()}
                      className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700"
                    >
                      <Share2 className="h-3 w-3" />
                      Share
                    </Button>
                  </div>
                </div>
                
                {/* Share Options Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleShare('sms')}
                    className="flex items-center gap-2 p-3 h-auto"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">📱</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">SMS</div>
                      <div className="text-xs text-muted-foreground">Send via text</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 p-3 h-auto"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">💬</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">WhatsApp</div>
                      <div className="text-xs text-muted-foreground">Share instantly</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Action Button */}
              <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
                Go to My Addresses
              </Button>
            </div>
          </>
        )}

      </DialogContent>
      
      {/* KIVRO Share Modal */}
      <ShareModal />
    </Dialog>
  );
};

export default AddressModal;