import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  MapPin, 
  Phone, 
  Navigation, 
  Target,
  Building2,
  User,
  Landmark,
  AlertCircle,
  Upload,
  X,
  Image as ImageIcon,
  Crosshair
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateAfricanPhone, handleSmartPhoneInput, getPhonePlaceholder } from '../lib/africanPhoneValidation';
import { validateUserLocation, getCurrentLocation } from '../lib/geolocation';
import { detectRegionFromPhone, detectRegionFromGPS } from '../lib/africanRegionDetection';
import InteractiveMap from '@/components/InteractiveMap';
import { API_ENDPOINTS } from '@/config/api';

interface GenerateAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GenerateAddressModal: React.FC<GenerateAddressModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeMethod, setActiveMethod] = useState('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [detectedRegionInfo, setDetectedRegionInfo] = useState<{
    country: string;
    region: string;
    city: string;
    confidence: number;
  } | null>(null);
  
  // Common fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [region, setRegion] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  
  // GPS fields
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  
  // KIVRO Precision fields
  const [precisionCode, setPrecisionCode] = useState('');
  
  // Business fields
  const [isBusinessAddress, setIsBusinessAddress] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState('');
  const [houseImageFile, setHouseImageFile] = useState<File | null>(null);
  const [houseImagePreview, setHouseImagePreview] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  // Auto-capture GPS coordinates for phone method
  const captureCurrentLocation = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "📍 Getting your location...",
        description: "Please allow location access for accurate address generation",
      });

      const location = await getCurrentLocation();
      setLatitude(location.latitude);
      setLongitude(location.longitude);
      setSelectedAddress(`${location.country} (${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)})`);
      
      // Detect region from GPS coordinates
      if (phoneNumber) {
        const regionInfo = detectRegionFromPhone(phoneNumber, location.latitude, location.longitude);
        if (regionInfo) {
          setDetectedRegionInfo(regionInfo);
          setRegion(regionInfo.region);
          toast({
            title: "🌍 Region Detected!",
            description: `You are in ${regionInfo.city}, ${regionInfo.region}, ${regionInfo.country}`,
          });
        }
      }
      
      toast({
        title: "✅ Location captured!",
        description: `Your GPS coordinates have been captured for accurate address generation`,
      });
    } catch (error) {
      toast({
        title: "Location Error",
        description: error instanceof Error ? error.message : "Unable to get your current location. Please select manually on the map.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Detect region from phone number only
  const detectRegionFromPhoneOnly = (phone: string) => {
    if (phone.length >= 4) {
      const regionInfo = detectRegionFromPhone(phone);
      if (regionInfo) {
        setDetectedRegionInfo(regionInfo);
        if (!region) {
          setRegion(regionInfo.region);
        }
        toast({
          title: `🌍 ${regionInfo.country} Detected`,
          description: `Phone number suggests ${regionInfo.city}, ${regionInfo.region}`,
        });
      }
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
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
    } catch (error) {
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (address) {
      setSelectedAddress(address);
      const addressParts = address.split(',');
      if (addressParts.length > 0 && !landmark) {
        setLandmark(addressParts[0].trim());
      }
      if (addressParts.length > 1 && !region) {
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

  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Company logo must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setCompanyLogoFile(file);
      setCompanyLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleHouseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "House image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setHouseImageFile(file);
      setHouseImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      return null;
    }
  };

  const handleGenerate = async () => {
    // Validate phone number
    const phoneValidation = validateAfricanPhone(phoneNumber);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      toast({
        title: "Invalid Phone Number",
        description: phoneValidation.error || 'Please enter a valid African phone number with country code',
        variant: "destructive",
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

    // Validate based on method
    if ((activeMethod === 'gps' || activeMethod === 'phone' || activeMethod === 'business') && (!latitude || !longitude)) {
      toast({
        title: "Location Required",
        description: "Please select your location on the map for accurate delivery",
        variant: "destructive",
      });
      return;
    }

    if (activeMethod === 'precision' && !precisionCode) {
      toast({
        title: "Precision Code Required",
        description: "Please enter a KIVRO precision code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to create your address');
      }

      // Upload images if provided
      let houseImageUrl = null;
      let companyLogoUrl = null;

      if (houseImageFile) {
        toast({ title: "Uploading house image..." });
        houseImageUrl = await uploadImage(houseImageFile, 'house-images', 'houses');
      }

      if (companyLogoFile) {
        toast({ title: "Uploading company logo..." });
        companyLogoUrl = await uploadImage(companyLogoFile, 'company-logos', 'logos');
      }

      // Determine API endpoint based on method
      let apiEndpoint = API_ENDPOINTS.ADDRESSES.GENERATE;
      if (activeMethod === 'gps') {
        apiEndpoint = API_ENDPOINTS.ADDRESSES.GENERATE_WITH_LOCATION;
      } else if (activeMethod === 'precision') {
        apiEndpoint = API_ENDPOINTS.ADDRESSES.GENERATE_WITH_W3W;
      }

      const requestBody: any = {
        full_name: isBusinessAddress ? companyName : fullName,
        phone_number: phoneNumber,
        region: region || 'mogadishu',
        landmark: landmark,
        house_number: houseNumber || undefined,
        house_image_url: houseImageUrl || undefined,
        company_logo_url: companyLogoUrl || undefined,
        is_business: isBusinessAddress,
      };

      if (activeMethod === 'gps' && latitude && longitude) {
        requestBody.latitude = latitude;
        requestBody.longitude = longitude;
        requestBody.landmark_description = landmark || selectedAddress;
      } else if (activeMethod === 'precision') {
        requestBody.precision_code = precisionCode;
      } else if (activeMethod === 'phone' && latitude && longitude) {
        // Include GPS coordinates for phone method to get accurate location
        requestBody.latitude = latitude;
        requestBody.longitude = longitude;
      } else if (activeMethod === 'business' && latitude && longitude) {
        // Include GPS coordinates for business method to get accurate location
        requestBody.latitude = latitude;
        requestBody.longitude = longitude;
      }

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
        
        if (errorData.error === 'Validation failed' && errorData.details) {
          const phoneError = errorData.details.find((d: any) => d.param === 'phone_number');
          if (phoneError) {
            setPhoneError(phoneError.msg);
            toast({
              title: "❌ Invalid Phone Number",
              description: phoneError.msg,
              variant: "destructive",
            });
            return;
          }
        }
        
        if (errorData.upgrade_required) {
          toast({
            title: "Upgrade Required",
            description: errorData.message || "You've reached the free tier limit.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(errorData.message || 'Failed to generate address');
      }

      const addressData = await response.json();

      // Check if address was auto-verified based on method
      const isAutoVerified = (activeMethod === 'gps' || activeMethod === 'precision' || 
                             (activeMethod === 'phone' && latitude && longitude) ||
                             (activeMethod === 'business' && latitude && longitude));
      
      toast({
        title: isAutoVerified ? "🎉 Address Created & Verified!" : "🎉 Address Created!",
        description: isAutoVerified 
          ? `Your verified KIVRO address: ${addressData.data?.display_address || addressData.kivro_code}`
          : `Your KIVRO address: ${addressData.data?.display_address || addressData.kivro_code}. Please verify location for accurate deliveries.`,
        duration: 5000,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhoneNumber('');
    setLandmark('');
    setRegion('');
    setHouseNumber('');
    setLatitude(null);
    setLongitude(null);
    setSelectedAddress('');
    setPrecisionCode('');
    setCompanyName('');
    setCompanyLogoFile(null);
    setCompanyLogoPreview('');
    setHouseImageFile(null);
    setHouseImagePreview('');
    setIsBusinessAddress(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Virtual Address</DialogTitle>
          <DialogDescription>
            Choose your preferred method to generate a KIVRO virtual address
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeMethod} onValueChange={(value) => {
          setActiveMethod(value);
          setIsBusinessAddress(value === 'business');
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="phone" className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Phone</span>
            </TabsTrigger>
            <TabsTrigger value="gps" className="flex items-center gap-1">
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">GPS</span>
            </TabsTrigger>
            <TabsTrigger value="precision" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Precision</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
          </TabsList>

          {/* Phone Number Method */}
          <TabsContent value="phone" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  Generate by Phone Number
                </CardTitle>
                <CardDescription>
                  Create your address using your phone number and current GPS location for accuracy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder={getPhonePlaceholder()}
                      value={phoneNumber}
                      onChange={(e) => {
                        const inputResult = handleSmartPhoneInput(phoneNumber, e.target.value);
                        
                        if (inputResult.shouldPrevent) {
                          if (inputResult.message) {
                            setPhoneError(inputResult.message);
                          }
                          return;
                        }
                        
                        setPhoneNumber(inputResult.value);
                        
                        // Detect region from phone number
                        if (inputResult.value.length >= 4) {
                          detectRegionFromPhoneOnly(inputResult.value);
                        }
                        
                        if (inputResult.message) {
                          if (inputResult.message.includes('✅')) {
                            setPhoneError('');
                          } else {
                            setPhoneError(inputResult.message);
                          }
                        } else {
                          setPhoneError('');
                        }
                      }}
                      className={phoneError ? 'border-red-500' : ''}
                    />
                    {phoneError && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span>{phoneError}</span>
                      </div>
                    )}
                    {detectedRegionInfo && (
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 p-2 rounded-md">
                        <MapPin className="h-3 w-3" />
                        <span>
                          📍 Detected: {detectedRegionInfo.city}, {detectedRegionInfo.region}, {detectedRegionInfo.country}
                          {detectedRegionInfo.confidence && (
                            <span className="text-green-500 ml-1">
                              ({Math.round(detectedRegionInfo.confidence * 100)}% confidence)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Region/City *</Label>
                    <Input
                      id="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g., Mogadishu, Hargeisa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="houseNumber">House Number</Label>
                    <Input
                      id="houseNumber"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      placeholder="e.g., 123, A-45"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark Description *</Label>
                  <Textarea
                    id="landmark"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g., Blue kiosk near Central Mosque"
                    rows={2}
                  />
                </div>

                {/* GPS Location Section */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium">Current Location (for accuracy)</Label>
                  {latitude && longitude ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-700">
                          <Navigation className="h-4 w-4" />
                          <span className="text-sm font-medium">Location Captured</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLatitude(null);
                            setLongitude(null);
                            setSelectedAddress('');
                          }}
                        >
                          Change Location
                        </Button>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Your GPS coordinates are required for accurate address generation
                      </p>
                      <Button
                        type="button"
                        onClick={captureCurrentLocation}
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Getting Location...
                          </>
                        ) : (
                          <>
                            <Navigation className="h-4 w-4 mr-2" />
                            Get My Current Location
                          </>
                        )}
                      </Button>
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground">or</span>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Select manually on map:</Label>
                        <InteractiveMap
                          onLocationSelect={(lat, lng, address) => {
                            setLatitude(lat);
                            setLongitude(lng);
                            setSelectedAddress(address || '');
                          }}
                          height="150px"
                          allowPinDrop={true}
                          showShareButton={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GPS Location Method */}
          <TabsContent value="gps" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-green-600" />
                  Generate by GPS Location
                </CardTitle>
                <CardDescription>
                  Use your current GPS coordinates to generate a precise address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone Number *</Label>
                      <Input
                        type="tel"
                        placeholder={getPhonePlaceholder()}
                        value={phoneNumber}
                        onChange={(e) => {
                          const inputResult = handleSmartPhoneInput(phoneNumber, e.target.value);
                          
                          if (inputResult.shouldPrevent) {
                            if (inputResult.message) {
                              setPhoneError(inputResult.message);
                            }
                            return;
                          }
                          
                          setPhoneNumber(inputResult.value);
                          
                          if (inputResult.message) {
                            if (inputResult.message.includes('✅')) {
                              setPhoneError('');
                            } else {
                              setPhoneError(inputResult.message);
                            }
                          } else {
                            setPhoneError('');
                          }
                        }}
                        className={phoneError ? 'border-red-500' : ''}
                      />
                    </div>

                    {selectedAddress && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <Label className="text-xs font-medium text-green-600">Selected Location</Label>
                        <p className="text-sm text-green-800">{selectedAddress}</p>
                        {latitude && longitude && (
                          <p className="text-xs text-green-600 mt-1">
                            📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="mb-2 block">Select Location on Map</Label>
                    <InteractiveMap 
                      onLocationSelect={handleLocationSelect}
                      height="300px"
                      allowPinDrop={true}
                      showShareButton={false}
                      initialLat={latitude || undefined}
                      initialLng={longitude || undefined}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KIVRO Precision Method */}
          <TabsContent value="precision" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Generate by KIVRO Precision
                </CardTitle>
                <CardDescription>
                  Use a KIVRO precision code for exact location mapping
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="precisionPhone" className="text-sm font-medium">
                    Phone number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="precisionPhone"
                      type="tel"
                      placeholder="Enter Phone number"
                      value={phoneNumber}
                      onChange={(e) => {
                        const inputResult = handleSmartPhoneInput(phoneNumber, e.target.value);
                        
                        if (inputResult.shouldPrevent) {
                          if (inputResult.message) {
                            setPhoneError(inputResult.message);
                          }
                          return;
                        }
                        
                        setPhoneNumber(inputResult.value);
                        
                        if (inputResult.message) {
                          if (inputResult.message.includes('✅')) {
                            setPhoneError('');
                          } else {
                            setPhoneError(inputResult.message);
                          }
                        } else {
                          setPhoneError('');
                        }
                      }}
                      className={`pl-10 ${phoneError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {phoneError && (
                    <div className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>

                {/* KIVRO Precision Code Field */}
                <div className="space-y-2">
                  <Label htmlFor="precisionCode" className="text-sm font-medium">
                    KIVRO Precision Code <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="precisionCode"
                      value={precisionCode}
                      onChange={(e) => setPrecisionCode(e.target.value)}
                      placeholder="filled.count.soup"
                      className="pl-10 font-mono"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter your 3-word precision code (e.g., filled.count.soup)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Address Method */}
          <TabsContent value="business" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Generate Business Address
                </CardTitle>
                <CardDescription>
                  Create a professional address for your company or business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter Company name"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessPhone" className="text-sm font-medium">
                      Phone number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="businessPhone"
                        type="tel"
                        placeholder="Enter Phone number"
                        value={phoneNumber}
                        onChange={(e) => {
                          const inputResult = handleSmartPhoneInput(phoneNumber, e.target.value);
                          
                          if (inputResult.shouldPrevent) {
                            if (inputResult.message) {
                              setPhoneError(inputResult.message);
                            }
                            return;
                          }
                          
                          setPhoneNumber(inputResult.value);
                          
                          if (inputResult.message) {
                            if (inputResult.message.includes('✅')) {
                              setPhoneError('');
                            } else {
                              setPhoneError(inputResult.message);
                            }
                          } else {
                            setPhoneError('');
                          }
                        }}
                        className={`pl-10 ${phoneError ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {phoneError && (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span>{phoneError}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessRegion" className="text-sm font-medium">
                      Region <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="businessRegion"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="e.g Mogadishu"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buildingNumber" className="text-sm font-medium">
                      Building Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="buildingNumber"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        placeholder="Optional"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationNotes" className="text-sm font-medium">
                    Location Notes (Optional)
                  </Label>
                  <Textarea
                    id="locationNotes"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Central Area, white gate on the left etc."
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add helpful details for drivers and delivery personnel
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium">Business Location (GPS coordinates required)</Label>
                  {latitude && longitude ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-700">
                          <Navigation className="h-4 w-4" />
                          <span className="text-sm font-medium">Business Location Captured</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLatitude(null);
                            setLongitude(null);
                            setSelectedAddress('');
                          }}
                        >
                          Change Location
                        </Button>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Please select the exact location of your business for accurate address generation
                      </p>
                      <Button
                        type="button"
                        onClick={captureCurrentLocation}
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Getting Location...
                          </>
                        ) : (
                          <>
                            <Navigation className="h-4 w-4 mr-2" />
                            Get My Current Location
                          </>
                        )}
                      </Button>
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground">or</span>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Select manually on map:</Label>
                        <InteractiveMap
                          onLocationSelect={(lat, lng, address) => {
                            setLatitude(lat);
                            setLongitude(lng);
                            setSelectedAddress(address || '');
                          }}
                          height="200px"
                          allowPinDrop={true}
                          showShareButton={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || (activeMethod === 'business' ? !companyName : !fullName) || !phoneNumber}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                {activeMethod === 'business' ? 'Generate Business Address' : 'Generate Address'}
              </>
            )}
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    );
};

export default GenerateAddressModal;
