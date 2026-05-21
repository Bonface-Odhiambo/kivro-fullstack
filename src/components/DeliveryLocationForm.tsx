import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Package,
  User,
  Phone,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Navigation
} from 'lucide-react';
import What3WordsInput from './What3WordsInput';
import { useToast } from '@/hooks/use-toast';
import { validateAfricanPhone, autoFormatAfricanPhoneInput } from '@/lib/africanPhoneValidation';

interface DeliveryLocationData {
  words: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  country: string;
  nearestPlace: string;
  language: string;
}

interface DeliveryDetails {
  recipientName: string;
  recipientPhone: string;
  what3wordsLocation: DeliveryLocationData | null;
  additionalInstructions: string;
  packageDescription: string;
  deliveryTime: string;
  estimatedFee: string;
  deliveryZone: string;
}

interface DeliveryLocationFormProps {
  onSubmit?: (details: DeliveryDetails) => void;
  onLocationChange?: (location: DeliveryLocationData | null) => void;
  initialData?: Partial<DeliveryDetails>;
  disabled?: boolean;
}

export default function DeliveryLocationForm({
  onSubmit,
  onLocationChange,
  initialData,
  disabled = false
}: DeliveryLocationFormProps) {
  const [formData, setFormData] = useState<DeliveryDetails>({
    recipientName: initialData?.recipientName || '',
    recipientPhone: initialData?.recipientPhone || '',
    what3wordsLocation: initialData?.what3wordsLocation || null,
    additionalInstructions: initialData?.additionalInstructions || '',
    packageDescription: initialData?.packageDescription || '',
    deliveryTime: initialData?.deliveryTime || '',
    estimatedFee: initialData?.estimatedFee || '',
    deliveryZone: initialData?.deliveryZone || ''
  });

  const [isLocationValid, setIsLocationValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLocationChange = async (locationData: DeliveryLocationData | null) => {
    setFormData(prev => ({ ...prev, what3wordsLocation: locationData }));
    onLocationChange?.(locationData);

    if (locationData) {
      // Get delivery details based on location
      try {
        setIsLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/what3words/location-details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ words: locationData.words }),
        });

        const result = await response.json();

        if (result.success) {
          setFormData(prev => ({
            ...prev,
            deliveryTime: result.data.estimatedDeliveryTime,
            estimatedFee: result.data.deliveryFee,
            deliveryZone: result.data.deliveryZone
          }));
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        deliveryTime: '',
        estimatedFee: '',
        deliveryZone: ''
      }));
    }
  };

  const handleLocationValidation = (isValid: boolean) => {
    setIsLocationValid(isValid);
  };

  const handleInputChange = (field: keyof DeliveryDetails, value: string) => {
    // Auto-format phone number as user types
    if (field === 'recipientPhone') {
      const formattedPhone = autoFormatAfricanPhoneInput(value);
      setFormData(prev => ({ ...prev, [field]: formattedPhone }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.recipientName.trim()) {
      toast({
        title: "Validation Error",
        description: "Recipient name is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.recipientPhone.trim()) {
      toast({
        title: "Validation Error",
        description: "Recipient phone number is required",
        variant: "destructive"
      });
      return false;
    }

    // Validate phone number format
    const phoneValidation = validateAfricanPhone(formData.recipientPhone);
    if (!phoneValidation.isValid) {
      toast({
        title: "Invalid Phone Number",
        description: phoneValidation.error || "Please enter a valid African phone number with country code",
        variant: "destructive"
      });
      return false;
    }

    if (!isLocationValid || !formData.what3wordsLocation) {
      toast({
        title: "Validation Error",
        description: "Valid KIVRO Precision location is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.packageDescription.trim()) {
      toast({
        title: "Validation Error",
        description: "Package description is required",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Clean the phone number before submitting
    const phoneValidation = validateAfricanPhone(formData.recipientPhone);
    const cleanedFormData = {
      ...formData,
      recipientPhone: phoneValidation.cleanedPhone || formData.recipientPhone
    };

    onSubmit?.(cleanedFormData);
    
    toast({
      title: "Delivery Location Set",
      description: `Package will be delivered to ${formData.what3wordsLocation?.words}`,
    });
  };

  const getDeliveryZoneColor = (zone: string) => {
    switch (zone) {
      case 'Somalia': return 'bg-green-100 text-green-800';
      case 'International': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Recipient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Recipient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipientName">Recipient Name *</Label>
              <Input
                id="recipientName"
                value={formData.recipientName}
                onChange={(e) => handleInputChange('recipientName', e.target.value)}
                placeholder="Enter recipient's full name"
                disabled={disabled}
                required
              />
            </div>
            <div>
              <Label htmlFor="recipientPhone">Phone Number *</Label>
              <Input
                id="recipientPhone"
                type="tel"
                value={formData.recipientPhone}
                onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                placeholder="+252 61 234 5678"
                disabled={disabled}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Delivery Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <What3WordsInput
            value={formData.what3wordsLocation?.words || ''}
            onChange={handleLocationChange}
            onValidation={handleLocationValidation}
            placeholder="Enter KIVRO Precision code for delivery (e.g., filled.count.soap)"
            disabled={disabled}
            showMap={true}
          />
        </CardContent>
      </Card>

      {/* Package Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Package Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="packageDescription">Package Description *</Label>
            <Textarea
              id="packageDescription"
              value={formData.packageDescription}
              onChange={(e) => handleInputChange('packageDescription', e.target.value)}
              placeholder="Describe the package contents (e.g., Electronics, Documents, Clothing)"
              disabled={disabled}
              required
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="additionalInstructions">Additional Delivery Instructions</Label>
            <Textarea
              id="additionalInstructions"
              value={formData.additionalInstructions}
              onChange={(e) => handleInputChange('additionalInstructions', e.target.value)}
              placeholder="Any special instructions for the delivery (e.g., Call before delivery, Leave at gate)"
              disabled={disabled}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery Details */}
      {formData.what3wordsLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Delivery Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Zone</p>
                  <Badge className={getDeliveryZoneColor(formData.deliveryZone)}>
                    {formData.deliveryZone}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Time</p>
                  <p className="font-medium">{formData.deliveryTime || 'Calculating...'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Fee</p>
                  <p className="font-medium">{formData.estimatedFee || 'Calculating...'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Location Confirmed</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Package will be delivered to <strong>{formData.what3wordsLocation.words}</strong> 
                    {' '}near {formData.what3wordsLocation.nearestPlace}, {formData.what3wordsLocation.country}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={disabled || !isLocationValid || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Delivery Location
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFormData({
              recipientName: '',
              recipientPhone: '',
              what3wordsLocation: null,
              additionalInstructions: '',
              packageDescription: '',
              deliveryTime: '',
              estimatedFee: '',
              deliveryZone: ''
            });
            setIsLocationValid(false);
          }}
          disabled={disabled}
        >
          Clear Form
        </Button>
      </div>

      {/* Help Text */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">How to use KIVRO Precision</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Search using 3 KIVRO words separated by dots (e.g., filled.count.soap)</li>
                <li>• Use the location button to get your current KIVRO Precision code</li>
                <li>• Each code represents a precise 3m x 3m location</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
