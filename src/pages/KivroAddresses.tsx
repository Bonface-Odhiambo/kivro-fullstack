import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MapPin,
  Search,
  Eye,
  Calendar,
  Share2,
  Edit,
  Image as ImageIcon,
  Building2,
  Phone,
  Navigation,
  Scan,
  Loader2,
  Upload,
  X,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenantQuery } from '@/hooks/useTenantQuery';
import { CardListSkeleton } from '@/components/PageSkeleton';
import { toast } from '@/hooks/use-toast';
import KivroShareModal from '@/components/KivroShareModal';
import EditAddressModal from '@/components/EditAddressModal';
import EditBusinessAddressModal from '@/components/EditBusinessAddressModal';
import VerifyLocationModal from '@/components/VerifyLocationModal';
import AddressVerificationSection from '@/components/AddressVerificationSection';
import InteractiveMap from '@/components/InteractiveMap';
import PrecisionCodeGuide from '@/components/PrecisionCodeGuide';
import AddressGeneratedModal from '@/components/AddressGeneratedModal';
import { validateSomaliPhoneNumber, autoFormatPhoneInput, PHONE_PLACEHOLDER } from '@/lib/phoneValidation';
import { detectCountryFromPhone, validateAfricanPhone, autoFormatAfricanPhoneInput } from '@/lib/africanPhoneValidation';
import { getLocationForAddressGeneration, getRegionFromCoordinates, isLocationInAfrica, searchAfricanRegions } from '@/lib/africanGeolocation';
import { validateUserLocation } from '@/lib/geolocation';
import { API_ENDPOINTS } from '@/config/api';

interface KivroAddress {
  id: string;
  kivro_code: string;
  display_address: string;
  region: string;
  district?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  is_business?: boolean;
  is_verified?: boolean;
  short_code?: string;
  share_token?: string;
  location_note?: string;
  geo_confidence?: number;
  created_at: string;
  created_by?: string;
  house_number?: string;
  house_image_url?: string;
  company_logo_url?: string;
}

export default function KivroAddresses() {
  const [addresses, setAddresses] = useState<KivroAddress[]>([]);
  const [selectedAddressDetail, setSelectedAddressDetail] = useState<KivroAddress | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [shareModalAddress, setShareModalAddress] = useState<KivroAddress | null>(null);
  const [editingAddress, setEditingAddress] = useState<KivroAddress | null>(null);
  const [verifyingAddress, setVerifyingAddress] = useState<KivroAddress | null>(null);
  const [verifiedAddress, setVerifiedAddress] = useState<KivroAddress | null>(null);
  const [showAddressSelection, setShowAddressSelection] = useState(false);
  const [generatedAddress, setGeneratedAddress] = useState<any>(null);
  const [showGeneratedModal, setShowGeneratedModal] = useState(false);
  
  // Generation form states
  const [addressCategory, setAddressCategory] = useState<'personal' | 'business'>('personal');
  const [activeMethod, setActiveMethod] = useState('phone');
  const [isGenerating, setIsGenerating] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [region, setRegion] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [precisionCode, setPrecisionCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState('');
  const [houseImageFile, setHouseImageFile] = useState<File | null>(null);
  const [houseImagePreview, setHouseImagePreview] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<string>('');

  useEffect(() => {
    fetchAddresses();
    loadUserProfile();
  }, []);

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

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('kivro_addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch Kivro addresses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAddresses = addresses.filter(address =>
    address.kivro_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    address.display_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    address.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (address: KivroAddress) => {
    setSelectedAddressDetail(address);
    setShowDetails(true);
  };

  const handleDeleteAddress = async (address: KivroAddress) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete address ${address.kivro_code}?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to delete addresses",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${API_ENDPOINTS.ADDRESSES.DELETE}/${address.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete address');
      }

      // Remove from local state
      setAddresses(prev => prev.filter(addr => addr.id !== address.id));
      
      toast({
        title: "Address Deleted",
        description: `Address ${address.kivro_code} has been deleted successfully`,
        duration: 3000,
      });

    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (address) {
      setSelectedAddress(address);
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
    // Use new African phone validation
    const phoneValidation = validateAfricanPhone(phoneNumber);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      toast({
        title: "Invalid Phone Number",
        description: phoneValidation.error || 'Please enter a valid African phone number',
        variant: "destructive",
      });
      return;
    }
    setPhoneError('');
    
    // Log detected country for debugging
    if (phoneValidation.country) {
    }

    // Store GPS coordinates in local variables to avoid race condition
    let currentLatitude = latitude;
    let currentLongitude = longitude;

    // AUTO-DETECT GPS LOCATION SILENTLY FOR PHONE NUMBER METHOD
    if (activeMethod === 'phone' && (!currentLatitude || !currentLongitude)) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { 
              enableHighAccuracy: true,
              timeout: 30000,
              maximumAge: 0
            }
          );
        });
        
        const detectedLat = position.coords.latitude;
        const detectedLng = position.coords.longitude;
        
        
        // Verify coordinates are for Nairobi area (rough check)
        // Nairobi: latitude around -1.2, longitude around 36.8
        if (detectedLat > -2 && detectedLat < 0 && detectedLng > 36 && detectedLng < 37) {
        } else {
        }
        
        // Store in local variables for immediate use
        currentLatitude = detectedLat;
        currentLongitude = detectedLng;
        
        // Also update state for future use
        setLatitude(detectedLat);
        setLongitude(detectedLng);
        
        // NO TOAST - Silent detection for phone number method
      } catch (gpsError) {
        toast({
          title: "Location Required",
          description: "Please enable location services to generate address with accurate location.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }
    }

    if (activeMethod === 'gps' && (!currentLatitude || !currentLongitude)) {
      toast({
        title: "Location Required",
        description: "Please select your location on the map",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in');

      let houseImageUrl = null;
      let companyLogoUrl = null;

      if (houseImageFile) {
        houseImageUrl = await uploadImage(houseImageFile, 'house-images', 'houses');
      }

      if (companyLogoFile) {
        companyLogoUrl = await uploadImage(companyLogoFile, 'company-logos', 'logos');
      }

      let apiEndpoint = API_ENDPOINTS.ADDRESSES.GENERATE;
      if (addressCategory === 'business') {
        apiEndpoint = API_ENDPOINTS.ADDRESSES.GENERATE_COMPANY;
      } else if (activeMethod === 'gps') {
        apiEndpoint = API_ENDPOINTS.ADDRESSES.GENERATE_WITH_LOCATION;
      } else if (activeMethod === 'precision') {
        apiEndpoint = API_ENDPOINTS.ADDRESSES.GENERATE_WITH_W3W;
      }

      // Use the auto-detected GPS coordinates (they are now in state)
      let detectedRegion = region; // Use user-provided region if available
      
      // GPS coordinates are now in local variables (immediate use)
      
      // Geographic validation - check if user is in the correct country
      try {
        const validationResult = await validateUserLocation(phoneNumber);
        if (!validationResult.isValid && validationResult.userCountry && validationResult.targetCountry) {
          toast({
            title: "🌍 Geographic Validation Failed",
            description: `You are currently in ${validationResult.userCountry}, but trying to generate an address for ${validationResult.targetCountry}. Please use a phone number from your current location.`,
            variant: "destructive",
          });
          setIsGenerating(false);
          return;
        }
      } catch (geoValidationError) {
        toast({
          title: "⚠️ Location Verification",
          description: "Unable to verify your location. Address generation will proceed, but please ensure you're using the correct phone number for your location.",
        });
      }

      // Fallback to phone-based country detection if GPS fails
      if (!detectedRegion) {
        const detectedCountry = detectCountryFromPhone(phoneNumber);
        if (detectedCountry) {
          // Use country capital as fallback region
          const countryCapitalMap: Record<string, string> = {
            'Kenya': 'Nairobi',
            'Somalia': 'Mogadishu',
            'Nigeria': 'Lagos',
            'South Africa': 'Cape Town',
            'Ghana': 'Accra',
            'Egypt': 'Cairo',
            'Tanzania': 'Dar es Salaam',
            'Uganda': 'Kampala',
            'Ethiopia': 'Addis Ababa',
            'Morocco': 'Casablanca',
            'Algeria': 'Algiers',
            'Tunisia': 'Tunis',
            'Libya': 'Tripoli',
            'Sudan': 'Khartoum',
            'Senegal': 'Dakar',
            'Ivory Coast': 'Abidjan',
            'Rwanda': 'Kigali',
            'Zimbabwe': 'Harare',
            'Zambia': 'Lusaka',
            'Angola': 'Luanda',
            'Cameroon': 'Douala',
            'Democratic Republic of Congo': 'Kinshasa'
          };
          detectedRegion = countryCapitalMap[detectedCountry.name] || 'Central';
        } else {
          detectedRegion = 'Central'; // Ultimate fallback
        }
      }

      const requestBody: any = {
        phone_number: phoneNumber,
      };

      if (addressCategory === 'business') {
        // Business addresses require company-specific fields
        if (!companyName || companyName.trim().length < 2) {
          toast({
            title: "Validation Error",
            description: "Company name is required and must be at least 2 characters long",
            variant: "destructive",
          });
          return;
        }
        
        requestBody.company_name = companyName.trim();
        requestBody.region = detectedRegion;
        requestBody.landmark = landmark || '';
        requestBody.company_logo_url = companyLogoUrl || undefined;
        if (currentLatitude && currentLongitude) {
          requestBody.latitude = currentLatitude;
          requestBody.longitude = currentLongitude;
        }
        
      } else {
        // Personal addresses
        requestBody.house_number = houseNumber || undefined;
        requestBody.house_image_url = houseImageUrl || undefined;
        requestBody.is_business = false;
        // Personal addresses - minimal info
        if (activeMethod === 'gps' && currentLatitude && currentLongitude) {
          requestBody.latitude = currentLatitude;
          requestBody.longitude = currentLongitude;
          requestBody.landmark_description = selectedAddress || 'GPS Location';
          requestBody.full_name = fullName || 'KIVRO User'; // API requires full_name (2-100 chars)
          requestBody.email = undefined; // Optional field
        } else if (activeMethod === 'precision') {
          // Precision method uses KIVRO Precision API
          requestBody.precision_code = precisionCode;
          requestBody.recipient_name = fullName || 'KIVRO User'; // Use name or default
          requestBody.delivery_instructions = undefined; // Optional
        } else {
          // Phone method - include GPS coordinates (from local variables)
          requestBody.region = region || detectedRegion; // Use detected country's default region
          requestBody.full_name = fullName || 'KIVRO User'; // Use name or default
          // Include GPS coordinates from local variables (immediate use)
          if (currentLatitude && currentLongitude) {
            requestBody.latitude = currentLatitude;
            requestBody.longitude = currentLongitude;
          }
        }
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
        
        // Show detailed error message
        let errorMessage = 'Failed to generate address';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details.map((detail: any) => detail.msg).join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        throw new Error(errorMessage);
      }

      const addressData = await response.json();

      // Show generated address in modal - extract data from nested structure
      const addressDetails = addressData.data || addressData;
      setGeneratedAddress({
        ...addressDetails,
        phone_number: phoneNumber,
        full_name: fullName,
        company_name: companyName
      });
      setShowGeneratedModal(true);

      toast({
        title: "🎉 Address Created!",
        description: `Your KIVRO address has been generated!`,
        duration: 3000,
      });

      // Reset form
      setLandmark('');
      setRegion('');
      setHouseNumber('');
      setCompanyName('');
      setCompanyLogoFile(null);
      setCompanyLogoPreview('');
      setHouseImageFile(null);
      setHouseImagePreview('');
      setPrecisionCode('');
      setLatitude(null);
      setLongitude(null);
      setSelectedAddress('');
      
      await fetchAddresses();
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Important Notice */}
      <Card className="border-orange-300 bg-orange-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-orange-900 mb-1">
                Important: Be at Your Location
              </h3>
              <p className="text-sm text-orange-800">
                For the most accurate address generation, please make sure you are physically at your house, business location, or specific landmark when generating your address.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Virtual Addresses</h1>
        </div>
        <Button
          onClick={() => {
            if (addresses.length === 0) {
              toast({
                title: "No addresses found",
                description: "Please generate an address first before verifying.",
              });
              return;
            }
            
            // If only one address, verify it directly
            if (addresses.length === 1) {
              setVerifyingAddress(addresses[0]);
              return;
            }
            
            // Multiple addresses - show selection modal
            setShowAddressSelection(true);
          }}
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto shadow-md"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Verify your address
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by Kivro code, address, or region"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 bg-white border-gray-300"
        />
      </div>

      {/* Address Verification Section */}
      {verifiedAddress && (
        <AddressVerificationSection
          address={verifiedAddress}
          onClose={() => setVerifiedAddress(null)}
        />
      )}


      {/* Your Addresses Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Addresses</h2>
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <CardListSkeleton count={5} />
            ) : filteredAddresses.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-900 font-medium text-lg mb-1">No addresses found</p>
                <p className="text-gray-500 text-sm">Generate your first address Below!</p>
              </div>
            ) : (
              <div className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50 border-b">
                      <TableHead className="font-semibold text-gray-700 py-4 w-[140px]">Kivro Code</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Address</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 w-[100px]">Region</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 w-[80px]">Details</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 w-[140px]">Created</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 w-[180px]">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 text-right w-[220px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAddresses.map((address) => (
                      <TableRow key={address.id} className="hover:bg-gray-50 border-b">
                        <TableCell className="font-mono text-xs font-semibold text-gray-900 py-4">{address.kivro_code}</TableCell>
                        <TableCell className="text-sm py-4">
                          <div className="font-normal text-gray-900 truncate max-w-[250px]" title={address.display_address}>
                            {address.display_address}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 py-4">{address.region}</TableCell>
                        <TableCell className="py-4">
                          <span className="text-xs text-blue-600 font-medium">
                            {address.is_business ? 'Biz' : 'P/N'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(address.created_at).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-500">{new Date(address.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1">
                            <Badge className={address.is_active ? "bg-green-100 text-green-700 text-xs font-medium border-green-200 w-fit" : "bg-gray-100 text-gray-700 text-xs font-medium border-gray-200 w-fit"}>
                              {address.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge className={address.is_verified ? "bg-blue-100 text-blue-700 text-xs font-medium border-blue-200 w-fit" : "bg-orange-100 text-orange-700 text-xs font-medium border-orange-200 w-fit"}>
                              {address.is_verified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewDetails(address)} 
                              className="h-7 w-7 p-0 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                              title="View"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setVerifyingAddress(address)} 
                              className="h-7 w-7 p-0 rounded-full bg-gray-800 hover:bg-gray-900 text-white"
                              title="Verify"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingAddress(address)} 
                              className="h-7 w-7 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setShareModalAddress(address);
                              }} 
                              className="h-7 w-7 p-0 rounded-full bg-green-600 hover:bg-green-700 text-white"
                              title="Share"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                if (address.latitude && address.longitude) {
                                  window.open(`https://www.google.com/maps?q=${address.latitude},${address.longitude}`, '_blank');
                                }
                              }} 
                              className="h-7 w-7 p-0 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                              title="Map"
                            >
                              <Navigation className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteAddress(address)} 
                              className="h-7 w-7 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate New Address Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Generate New Address</h2>
          
          {/* Personal/Business Toggle Buttons - Top Right */}
          <div className="flex gap-1">
            <Button
              variant={addressCategory === 'personal' ? 'default' : 'outline'}
              onClick={() => {
                setAddressCategory('personal');
                setActiveMethod('phone');
              }}
              size="sm"
              className={`h-9 px-4 ${
                addressCategory === 'personal' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              Personal
            </Button>
            <Button
              variant={addressCategory === 'business' ? 'default' : 'outline'}
              onClick={() => {
                setAddressCategory('business');
              }}
              size="sm"
              className={`h-9 px-4 ${
                addressCategory === 'business' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              Business
            </Button>
          </div>
        </div>
        
        <Card className="shadow-sm">
          <CardContent className="pt-6">
          {/* Main Category Selection */}
          <Tabs value={addressCategory} onValueChange={(val) => {
            setAddressCategory(val as 'personal' | 'business');
            // Reset to default method when switching categories
            if (val === 'personal') {
              setActiveMethod('phone');
            }
          }}>

            {/* Personal Address Methods */}
            <TabsContent value="personal">
              <Tabs value={activeMethod} onValueChange={setActiveMethod}>
                <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
                  <TabsTrigger value="phone" className="text-xs sm:text-sm py-2">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone Number
                  </TabsTrigger>
                  <TabsTrigger value="gps" className="text-xs sm:text-sm py-2">
                    <Navigation className="h-4 w-4 mr-2 rotate-45" />
                    GPS Location
                  </TabsTrigger>
                  <TabsTrigger value="precision" className="text-xs sm:text-sm py-2">
                    <Scan className="h-4 w-4 mr-2" />
                    KIVRO Precision
                  </TabsTrigger>
                </TabsList>

            {/* Phone Method */}
            <TabsContent value="phone" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="+XXX XXX XXX XXXX (Any African country)"
                    value={phoneNumber}
                    onChange={(e) => {
                      const formatted = autoFormatAfricanPhoneInput(e.target.value);
                      setPhoneNumber(formatted);
                      const country = detectCountryFromPhone(formatted);
                      setDetectedCountry(country ? `${country.flag} ${country.name}` : '');
                    }}
                    className="text-lg"
                  />
                  {detectedCountry && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      {detectedCountry}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your phone number from any African country. We'll auto-detect your location.
                  </p>
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={isGenerating || !phoneNumber} className="w-full bg-green-600 h-11 sm:h-12 text-sm sm:text-base">
                {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <MapPin className="mr-2" />}
                Generate Address
              </Button>
            </TabsContent>

            {/* GPS Method */}
            <TabsContent value="gps" className="space-y-4">
              {/* Main Container with Light Green Background */}
              <div className="bg-green-50 rounded-lg p-6 space-y-4">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Your Location on Map</h3>
                  <p className="text-sm text-gray-600">Click anywhere on the map to drop a pin and share your location</p>
                </div>

                {/* Main Content - Side by Side Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Side - Form (2 columns) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">Phone number *</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="tel"
                          placeholder="Enter Phone number"
                          value={phoneNumber}
                          onChange={(e) => {
                            const formatted = autoFormatAfricanPhoneInput(e.target.value);
                            setPhoneNumber(formatted);
                            const country = detectCountryFromPhone(formatted);
                            setDetectedCountry(country ? `${country.flag} ${country.name}` : '');
                          }}
                          className="pl-10 h-12 text-base bg-white"
                        />
                      </div>
                      {detectedCountry && (
                        <p className="text-sm text-green-600 mt-1 font-medium">
                          {detectedCountry}
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Handle click on map to select location
                        toast({
                          title: "Click on the map",
                          description: "Click anywhere on the map to select your location",
                        });
                      }}
                      className="w-full h-12 border-orange-300 text-orange-600 hover:bg-orange-50 bg-white"
                    >
                      Click on the map to select your location
                    </Button>
                  </div>
                  
                  {/* Right Side - Map (3 columns) */}
                  <div className="lg:col-span-3 relative rounded-lg overflow-hidden" style={{ height: '350px' }}>
                    <InteractiveMap 
                      onLocationSelect={handleLocationSelect}
                      height="350px"
                      allowPinDrop={true}
                      showShareButton={false}
                    />
                  </div>
                </div>
              </div>

              {/* Full Width Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !latitude || !phoneNumber} 
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Generate Address
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Precision Method */}
            <TabsContent value="precision" className="space-y-4">
              {/* Guide Section */}
              <PrecisionCodeGuide compact={false} />
              
              {/* Form Section */}
              <div className="space-y-4 mt-6">
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="+XXX XXX XXX XXXX (Any African country)"
                    value={phoneNumber}
                    onChange={(e) => {
                      const formatted = autoFormatAfricanPhoneInput(e.target.value);
                      setPhoneNumber(formatted);
                      const country = detectCountryFromPhone(formatted);
                      setDetectedCountry(country ? `${country.flag} ${country.name}` : '');
                    }}
                  />
                  {detectedCountry && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      {detectedCountry}
                    </p>
                  )}
                </div>
                <div>
                  <Label>KIVRO Precision Code *</Label>
                  <Input
                    type="text"
                    value={precisionCode}
                    onChange={(e) => setPrecisionCode(e.target.value.toLowerCase())}
                    placeholder="filled.count.soup"
                    className="text-lg font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your 3-word precision code (e.g., filled.count.soup)
                  </p>
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={isGenerating || !phoneNumber || !precisionCode} className="w-full bg-green-600 h-11 sm:h-12 text-sm sm:text-base">
                {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <MapPin className="mr-2" />}
                Generate Address with Precision
              </Button>
            </TabsContent>

              </Tabs>
            </TabsContent>

            {/* Business/Company Address */}
            <TabsContent value="business" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company name" />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="+XXX XXX XXX XXXX (Any African country)"
                    value={phoneNumber}
                    onChange={(e) => {
                      const formatted = autoFormatAfricanPhoneInput(e.target.value);
                      setPhoneNumber(formatted);
                      const country = detectCountryFromPhone(formatted);
                      setDetectedCountry(country ? `${country.flag} ${country.name}` : '');
                    }}
                  />
                  {detectedCountry && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      {detectedCountry}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Region *</Label>
                  <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g., Mogadishu" />
                </div>
                <div>
                  <Label>Building Number</Label>
                  <Input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div>
                <Label>Location Description *</Label>
                <Textarea 
                  value={landmark} 
                  onChange={(e) => setLandmark(e.target.value)} 
                  rows={2} 
                  placeholder="Describe the business location and nearby landmarks"
                />
              </div>
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-green-600 h-11 sm:h-12 text-sm sm:text-base">
                {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Building2 className="mr-2" />}
                Generate Business Address
              </Button>
            </TabsContent>
          </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Address Details</DialogTitle>
          </DialogHeader>
          {selectedAddressDetail && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500 font-medium">KIVRO Code</Label>
                <p className="font-semibold text-gray-900 mt-1">{selectedAddressDetail.kivro_code}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 font-medium">Full Address</Label>
                <p className="text-sm text-gray-900 mt-1 leading-relaxed">{selectedAddressDetail.display_address}</p>
              </div>
              <Button
                onClick={() => {
                  if (selectedAddressDetail.latitude && selectedAddressDetail.longitude) {
                    const mapsUrl = `https://www.google.com/maps?q=${selectedAddressDetail.latitude},${selectedAddressDetail.longitude}`;
                    window.open(mapsUrl, '_blank');
                  } else {
                    toast({
                      title: "Location Not Available",
                      description: "This address doesn't have GPS coordinates yet. Please verify the location first.",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 h-11"
              >
                <Navigation className="h-4 w-4 mr-2" />
                View on map
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {shareModalAddress && (
        <KivroShareModal
          isOpen={!!shareModalAddress}
          onClose={() => setShareModalAddress(null)}
          shareUrl={shareModalAddress.share_token ? `${window.location.origin}/kv/${shareModalAddress.share_token}` : `https://kivro.africa/address/${shareModalAddress.kivro_code}`}
          title="Share KIVRO Address"
          description={`Share your KIVRO address: ${shareModalAddress.short_code || shareModalAddress.kivro_code}`}
          addressId={shareModalAddress.id}
          addressData={{
            kivro_code: shareModalAddress.kivro_code,
            display_address: shareModalAddress.display_address,
            region: shareModalAddress.region,
            district: shareModalAddress.district,
            landmark: shareModalAddress.landmark,
            latitude: shareModalAddress.latitude,
            longitude: shareModalAddress.longitude,
            short_code: shareModalAddress.short_code,
            share_token: shareModalAddress.share_token,
            is_verified: shareModalAddress.is_verified
          }}
        />
      )}

      {editingAddress && !editingAddress.is_business && (
        <EditAddressModal
          isOpen={!!editingAddress}
          onClose={() => setEditingAddress(null)}
          address={editingAddress}
          onUpdate={fetchAddresses}
        />
      )}

      {editingAddress && editingAddress.is_business && (
        <EditBusinessAddressModal
          isOpen={!!editingAddress}
          onClose={() => setEditingAddress(null)}
          address={editingAddress}
          onUpdate={fetchAddresses}
        />
      )}

      {verifyingAddress && (
        <VerifyLocationModal
          isOpen={!!verifyingAddress}
          onClose={() => setVerifyingAddress(null)}
          address={verifyingAddress}
          onUpdate={fetchAddresses}
          onVerificationComplete={(address) => {
            setVerifiedAddress(address);
            setVerifyingAddress(null);
          }}
        />
      )}

      {/* Address Selection Modal */}
      {showAddressSelection && (
        <Dialog open={showAddressSelection} onOpenChange={setShowAddressSelection}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Select Address to Verify
              </DialogTitle>
              <DialogDescription>
                Choose which KIVRO address you want to verify the location for.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {addresses.map((address) => (
                <Card 
                  key={address.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    address.is_verified ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => {
                    setVerifyingAddress(address);
                    setShowAddressSelection(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {address.kivro_code}
                          </Badge>
                          {address.is_verified ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              ✓ Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              Needs Verification
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 font-medium mb-1">
                          {address.display_address}
                        </p>
                        <p className="text-xs text-gray-500">
                          Region: {address.region} • Created: {new Date(address.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {address.is_verified ? (
                          <div className="text-green-600">
                            <MapPin className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="text-yellow-600">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={() => setShowAddressSelection(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Address Generated Modal - WhatsApp Style */}
      {generatedAddress && (
        <AddressGeneratedModal
          isOpen={showGeneratedModal}
          onClose={() => {
            setShowGeneratedModal(false);
            setGeneratedAddress(null);
          }}
          addressData={generatedAddress}
        />
      )}
    </div>
  );
}
