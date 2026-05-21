import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, User, Building2, Upload, Camera } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { validateAfricanPhoneNumber, normalizePhoneNumber } from '@/utils/phoneValidation';
import { clearAddressIntent, type AddressIntent } from '@/lib/addressIntent';
import { API_ENDPOINTS } from '@/config/api';

// ── Step progress bar ─────────────────────────────────────────────────────
function AddressCreationProgress({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Your details' },
    { n: 2, label: 'Location' },
    { n: 3, label: 'Confirm' },
  ];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2 flex-1">
          <div className={`flex items-center gap-2 ${step >= s.n ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${
              step > s.n  ? 'border-primary bg-primary text-white' :
              step === s.n ? 'border-primary text-primary' :
              'border-muted-foreground'
            }`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-px ${step > s.n ? 'bg-primary' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  );
}

const CreateKivroAddress = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [creationStep, setCreationStep] = useState<1 | 2 | 3>(1);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [region, setRegion] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [defaultTab, setDefaultTab] = useState('manual');
  // Auto-advance to step 2 when location is captured
  const setCoordinates = (lat: number, lng: number) => { setLatitude(lat); setLongitude(lng); setCreationStep(prev => prev < 2 ? 2 : prev); };
  const [hasLocationIntent, setHasLocationIntent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please sign in to create your Kivro address.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }
        
        // Pre-fill user data if available
        if (session.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, phone_number')
            .eq('user_id', session.user.id)
            .single();
            
          if (profile) {
            setFullName(profile.display_name || '');
            setPhoneNumber(profile.phone_number || '');
          }
        }

        // Check for address intent from navigation state
        const state = location.state as { intent?: AddressIntent } | null;
        if (state?.intent) {
          const intent = state.intent;
          
          // Set location if available
          if (intent.location) {
            setLatitude(intent.location.latitude);
            setLongitude(intent.location.longitude);
            setDefaultTab('map'); // Switch to map tab
            setHasLocationIntent(true);
            
            toast({
              title: "📍 Location loaded!",
              description: "Your location has been set. Fill in your details to generate your address.",
              duration: 4000,
            });
          } else {
            // No location, but user wanted to generate address
            toast({
              title: "Welcome!",
              description: "Please fill in your details to generate your KIVRO address.",
              duration: 3000,
            });
          }
          
          // Clear the intent from localStorage
          clearAddressIntent();
        }
      } catch (error) {
        navigate('/auth');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate, toast, location]);

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (address) {
      setSelectedAddress(address);
      // Auto-fill landmark and region from the selected address
      const addressParts = address.split(',');
      if (addressParts.length > 0 && !landmark) {
        setLandmark(addressParts[0].trim());
      }
      if (addressParts.length > 1 && !region) {
        // Try to extract city/region from address
        const cityPart = addressParts.find(part => 
          part.toLowerCase().includes('mogadishu') || 
          part.toLowerCase().includes('hargeisa') ||
          part.toLowerCase().includes('somalia')
        );
        if (cityPart) {
          setRegion(cityPart.trim());
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number for any African country
    const phoneValidation = validateAfricanPhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      toast({
        title: "❌ Invalid Phone Number",
        description: phoneValidation.suggestion || phoneValidation.error || 'Please enter a valid African phone number with country code',
        variant: "destructive",
      });
      return;
    }
    
    // Show success message with detected country
    if (phoneValidation.country) {
      toast({
        title: `✅ ${phoneValidation.country.name} Number Validated`,
        description: `Phone number formatted: ${phoneValidation.formatted}`,
        duration: 2000,
      });
    }
    
    setPhoneError('');
    
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create your Kivro address.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const user = session.user;

      // Check if profile exists, create only if it doesn't
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: fullName,
            phone_number: phoneNumber,
            user_type: 'customer',
            created_at: new Date().toISOString()
          });

        if (profileError) {
          throw new Error('Failed to create user profile');
        }
      }

      // Create the Kivro address with location data if available
      const apiEndpoint = latitude && longitude 
        ? API_ENDPOINTS.ADDRESSES.GENERATE_WITH_LOCATION 
        : API_ENDPOINTS.ADDRESSES.GENERATE;
      
      const requestBody = {
        region: region || 'mogadishu',
        landmark: landmark,
        phone_number: phoneValidation.formatted, // Use normalized phone number
        full_name: fullName,
        ...(latitude && longitude && {
          latitude: latitude,
          longitude: longitude,
          landmark_description: landmark || selectedAddress
        })
      };


      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check for phone validation errors from backend
        if (errorData.error === 'Validation failed' && errorData.details) {
          const phoneError = errorData.details.find((d: any) => d.param === 'phone_number');
          if (phoneError) {
            setPhoneError(phoneError.msg);
            toast({
              title: "❌ Invalid Phone Number Format",
              description: phoneError.msg || "Your phone number must start with +252 and be followed by exactly 9 digits. Example: +252 61 234 5678",
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
          // Optionally redirect to pricing page
          setTimeout(() => navigate('/pricing'), 2000);
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
        
        throw new Error(errorData.message || 'Failed to create Kivro address');
      }

      const addressData = await response.json();

      toast({
        title: "🎉 Kivro Address Created!",
        description: `Your address: ${addressData.data?.display_address || addressData.kivro_code}`,
        duration: 5000,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error creating address",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Checking authentication...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Create Your Kivro Address</CardTitle>
              <CardDescription>
<AddressCreationProgress step={creationStep} />
                Fill in your information or use the map to generate your unique digital address
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasLocationIntent && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Your location has been captured! The map below shows your current position.
                  </p>
                </div>
              )}
              <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="map">Use Map</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder={PHONE_PLACEHOLDER}
                    value={phoneNumber}
                    onChange={(e) => {
                      const formatted = autoFormatPhoneInput(e.target.value);
                      setPhoneNumber(formatted);
                      if (phoneError) setPhoneError('');
                    }}
                    onBlur={() => {
                      if (phoneNumber.trim()) {
                        const validation = validateSomaliPhoneNumber(phoneNumber);
                        if (!validation.isValid) {
                          setPhoneError(validation.error || 'Invalid phone number');
                        } else {
                          setPhoneError('');
                          if (validation.formatted) {
                            setPhoneNumber(validation.formatted);
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
                      {PHONE_HELPER_TEXT}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landmark" className="flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    Landmark/Description
                  </Label>
                  <Input
                    id="landmark"
                    type="text"
                    placeholder="e.g., Blue kiosk near Central Mosque"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Region/City
                  </Label>
                  <Input
                    id="region"
                    type="text"
                    placeholder="e.g., Mogadishu, Hargeisa"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Your Address...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Create My Kivro Address
                    </>
                  )}
                </Button>

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Your address will look like:</h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        KV -P.O Box {phoneNumber || '[your-phone]'} {landmark || '[landmark]'} {region || 'Mogadishu'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Example: KV -P.O Box 252610000000 Blue kiosk near Central Mosque Mogadishu
                      </p>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="map" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="mapFullName" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Your Full Name
                          </Label>
                          <Input
                            id="mapFullName"
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mapPhoneNumber" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </Label>
                          <Input
                            id="mapPhoneNumber"
                            type="tel"
                            placeholder={PHONE_PLACEHOLDER}
                            value={phoneNumber}
                            onChange={(e) => {
                              const formatted = autoFormatPhoneInput(e.target.value);
                              setPhoneNumber(formatted);
                              if (phoneError) setPhoneError('');
                            }}
                            onBlur={() => {
                              if (phoneNumber.trim()) {
                                const validation = validateSomaliPhoneNumber(phoneNumber);
                                if (!validation.isValid) {
                                  setPhoneError(validation.error || 'Invalid phone number');
                                } else {
                                  setPhoneError('');
                                  if (validation.formatted) {
                                    setPhoneNumber(validation.formatted);
                                  }
                                }
                              }
                            }}
                            className={phoneError ? 'border-red-500' : ''}
                            required
                          />
                          {phoneError && (
                            <div className="flex items-center gap-1 text-xs text-red-500">
                              <AlertCircle className="h-3 w-3" />
                              <span>{phoneError}</span>
                            </div>
                          )}
                        </div>

                        {selectedAddress && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Selected Location:</h4>
                            <p className="text-sm text-muted-foreground">{selectedAddress}</p>
                            {latitude && longitude && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                              </p>
                            )}
                          </div>
                        )}

                        <Button 
                          onClick={handleSubmit} 
                          className="w-full" 
                          disabled={isLoading || !phoneNumber || !fullName}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Your Address...
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-2 h-4 w-4" />
                              Create My Kivro Address
                            </>
                          )}
                        </Button>
                      </div>
                      
                      <div>
                        <InteractiveMap 
                          onLocationSelect={handleLocationSelect}
                          height="400px"
                          allowPinDrop={true}
                          showShareButton={false}
                          initialLat={latitude || undefined}
                          initialLng={longitude || undefined}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateKivroAddress;