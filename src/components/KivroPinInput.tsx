import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Check, 
  X, 
  Loader2, 
  Navigation,
  AlertCircle,
  Building2,
  Home
} from 'lucide-react';

interface KivroAddress {
  short_code: string;
  kivro_code: string;
  display_address: string;
  latitude: number;
  longitude: number;
  region?: string;
  district?: string;
  landmark?: string;
  location_note?: string;
  house_number?: string;
  is_verified: boolean;
  is_business: boolean;
  country?: string;
  google_maps_url: string;
}

interface KivroPinInputProps {
  onValidAddress?: (address: KivroAddress) => void;
  onInvalidAddress?: () => void;
  placeholder?: string;
  label?: string;
  showMap?: boolean;
  autoValidate?: boolean;
  className?: string;
}

export const KivroPinInput: React.FC<KivroPinInputProps> = ({
  onValidAddress,
  onInvalidAddress,
  placeholder = "Enter KIVRO PIN (e.g., KV-12345)",
  label = "Delivery Address (KIVRO PIN)",
  showMap = true,
  autoValidate = true,
  className = ""
}) => {
  const [pinValue, setPinValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [address, setAddress] = useState<KivroAddress | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-validate on input change (with debounce)
  useEffect(() => {
    if (!autoValidate || !pinValue.trim()) {
      setValidationStatus('idle');
      setAddress(null);
      return;
    }

    const timer = setTimeout(() => {
      validatePin(pinValue);
    }, 800); // Debounce for 800ms

    return () => clearTimeout(timer);
  }, [pinValue, autoValidate]);

  const validatePin = async (pin: string) => {
    if (!pin.trim()) {
      setValidationStatus('idle');
      setAddress(null);
      return;
    }

    setIsValidating(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/addresses/validate-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kivro_pin: pin.trim() })
      });

      const data = await response.json();

      if (data.success && data.valid) {
        setValidationStatus('valid');
        setAddress(data.address);
        if (onValidAddress) {
          onValidAddress(data.address);
        }
      } else {
        setValidationStatus('invalid');
        setAddress(null);
        setErrorMessage(data.message || 'Invalid KIVRO PIN');
        if (onInvalidAddress) {
          onInvalidAddress();
        }
      }
    } catch (error) {
      setValidationStatus('invalid');
      setAddress(null);
      setErrorMessage('Failed to validate PIN. Please try again.');
      if (onInvalidAddress) {
        onInvalidAddress();
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualValidate = () => {
    validatePin(pinValue);
  };

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
    if (validationStatus === 'valid') {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    if (validationStatus === 'invalid') {
      return <X className="h-4 w-4 text-red-600" />;
    }
    return <MapPin className="h-4 w-4 text-gray-400" />;
  };

  const getStatusColor = () => {
    if (validationStatus === 'valid') return 'border-green-500 focus:ring-green-500';
    if (validationStatus === 'invalid') return 'border-red-500 focus:ring-red-500';
    return 'border-gray-300';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-green-600" />
        {label}
      </label>

      {/* Input Field */}
      <div className="relative">
        <Input
          type="text"
          value={pinValue}
          onChange={(e) => setPinValue(e.target.value.toUpperCase())}
          placeholder={placeholder}
          className={`pr-10 ${getStatusColor()}`}
          disabled={isValidating}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Manual Validate Button (if auto-validate is off) */}
      {!autoValidate && (
        <Button
          onClick={handleManualValidate}
          disabled={isValidating || !pinValue.trim()}
          className="w-full"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Validate Address
            </>
          )}
        </Button>
      )}

      {/* Error Message */}
      {validationStatus === 'invalid' && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Valid Address Display */}
      {validationStatus === 'valid' && address && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {address.is_business ? (
                <Building2 className="h-5 w-5 text-purple-600" />
              ) : (
                <Home className="h-5 w-5 text-green-600" />
              )}
              <div>
                <p className="text-xs font-medium text-gray-600">
                  {address.is_business ? 'Business Address' : 'Delivery Address'}
                </p>
                <p className="text-sm font-bold text-gray-900">{address.short_code}</p>
              </div>
            </div>
            {address.is_verified && (
              <Badge className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          {/* Address Details */}
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              {address.display_address}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              {address.region && (
                <div>
                  <span className="font-medium">Region:</span> {address.region}
                </div>
              )}
              {address.district && (
                <div>
                  <span className="font-medium">District:</span> {address.district}
                </div>
              )}
              {address.house_number && (
                <div>
                  <span className="font-medium">House #:</span> {address.house_number}
                </div>
              )}
              {address.country && (
                <div>
                  <span className="font-medium">Country:</span> {address.country}
                </div>
              )}
            </div>
            {address.landmark && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Landmark:</span> {address.landmark}
                </p>
              </div>
            )}
            {address.location_note && (
              <div className="mt-1">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Note:</span> {address.location_note}
                </p>
              </div>
            )}
          </div>

          {/* Map Preview */}
          {showMap && (
            <div className="relative rounded-lg overflow-hidden border border-green-200">
              <iframe
                width="100%"
                height="200"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${address.latitude},${address.longitude}&output=embed&z=16`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={address.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow-md text-xs font-medium text-green-600 hover:bg-green-50 flex items-center gap-1"
              >
                <Navigation className="h-3 w-3" />
                Navigate
              </a>
            </div>
          )}

          {/* GPS Coordinates */}
          <div className="text-xs text-gray-500 text-center">
            📍 GPS: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
          </div>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Enter your KIVRO short code (e.g., KV-12345) or full KIVRO address for accurate delivery
      </p>
    </div>
  );
};

export default KivroPinInput;
