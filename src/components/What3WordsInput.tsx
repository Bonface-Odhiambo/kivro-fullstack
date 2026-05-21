import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  MapPin,
  Search,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Navigation,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface What3WordsData {
  words: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  country: string;
  nearestPlace: string;
  language: string;
}

interface What3WordsInputProps {
  value?: string;
  onChange?: (data: What3WordsData | null) => void;
  onValidation?: (isValid: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  showMap?: boolean;
  focusLocation?: { lat: number; lng: number };
  className?: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

export default function What3WordsInput({
  value = '',
  onChange,
  onValidation,
  placeholder = 'Enter KIVRO Precision code (e.g., filled.count.soap)',
  disabled = false,
  showMap = true,
  focusLocation,
  className = ''
}: What3WordsInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [locationData, setLocationData] = useState<What3WordsData | null>(null);
  const [error, setError] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  // Debounced validation and autosuggest
  const debounceTimeout = React.useRef<NodeJS.Timeout>();

  const validateFormat = (words: string): boolean => {
    if (!words) return false;
    const cleanWords = words.replace(/^\/+|\/+$/g, '');
    const wordArray = cleanWords.split('.');
    return wordArray.length === 3 && wordArray.every(word => 
      word.length > 0 && /^[a-zA-Z]+$/.test(word)
    );
  };

  const convertToCoordinates = async (words: string) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/what3words/convert-to-coordinates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words }),
      });

      const result = await response.json();

      if (result.success) {
        const data: What3WordsData = {
          words: result.data.words,
          coordinates: result.data.coordinates,
          country: result.data.country,
          nearestPlace: result.data.nearestPlace,
          language: result.data.language
        };

        setLocationData(data);
        setIsValid(true);
        onChange?.(data);
        onValidation?.(true);

        toast({
          title: "Location Found",
          description: `${data.words} - ${data.nearestPlace}, ${data.country}`,
        });
      } else {
        setError(result.message || 'Invalid KIVRO Precision code');
        setLocationData(null);
        setIsValid(false);
        onChange?.(null);
        onValidation?.(false);
      }
    } catch (error) {
      setError('Failed to validate KIVRO Precision code');
      setLocationData(null);
      setIsValid(false);
      onChange?.(null);
      onValidation?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getAutosuggest = async (input: string) => {
    try {
      const options: any = {};
      if (focusLocation) {
        options.focus = focusLocation;
      }

      const response = await fetch(`${API_BASE_URL}/what3words/autosuggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input, ...options }),
      });

      const result = await response.json();

      if (result.success && result.data.suggestions) {
        setSuggestions(result.data.suggestions.slice(0, 5)); // Limit to 5 suggestions
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase();
    setInputValue(newValue);
    setError('');
    setIsValid(false);
    setLocationData(null);

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout for debounced operations
    debounceTimeout.current = setTimeout(() => {
      if (newValue.length > 0) {
        // Get autosuggest for partial input
        if (newValue.length >= 2 && !validateFormat(newValue)) {
          getAutosuggest(newValue);
        } else {
          setShowSuggestions(false);
        }

        // Validate complete 3-word address
        if (validateFormat(newValue)) {
          convertToCoordinates(newValue);
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
        onChange?.(null);
        onValidation?.(false);
      }
    }, 500);
  };

  const handleSuggestionClick = (suggestion: any) => {
    setInputValue(suggestion.words);
    setShowSuggestions(false);
    convertToCoordinates(suggestion.words);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch(`${API_BASE_URL}/what3words/convert-to-words`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });

          const result = await response.json();

          if (result.success) {
            setInputValue(result.data.words);
            const data: What3WordsData = {
              words: result.data.words,
              coordinates: result.data.coordinates,
              country: result.data.country,
              nearestPlace: result.data.nearestPlace,
              language: result.data.language
            };
            setLocationData(data);
            setIsValid(true);
            onChange?.(data);
            onValidation?.(true);

            toast({
              title: "Current Location Found",
              description: `Your KIVRO Precision code: ${result.data.words}`,
            });
          }
        } catch (error) {
          toast({
            title: "Location Error",
            description: "Failed to get your current location.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        toast({
          title: "Location Access Denied",
          description: "Please allow location access or enter your KIVRO Precision code manually.",
          variant: "destructive"
        });
      }
    );
  };

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="what3words-input" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          KIVRO Precision Location
        </Label>
        
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="what3words-input"
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled || isLoading}
                className={`pr-10 ${isValid ? 'border-green-500' : error ? 'border-red-500' : ''}`}
              />
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : error ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <Search className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={getCurrentLocation}
              disabled={disabled || isLoading}
              title="Use current location"
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </div>

          {/* Autosuggest Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto">
              <CardContent className="p-0">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{suggestion.words}</p>
                        <p className="text-xs text-muted-foreground">
                          {suggestion.nearestPlace}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.country}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>

      {/* Location Details */}
      {locationData && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location Details
                </h4>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {locationData.country}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">KIVRO Precision Code</p>
                  <p className="font-medium">{locationData.words}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nearest Place</p>
                  <p className="font-medium">{locationData.nearestPlace}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Coordinates</p>
                  <p className="font-medium">
                    {locationData.coordinates.lat.toFixed(6)}, {locationData.coordinates.lng.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Language</p>
                  <p className="font-medium">{locationData.language}</p>
                </div>
              </div>

              {showMap && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // View on map - internal KIVRO map view
                      if (locationData.coordinates) {
                        const url = `https://www.google.com/maps?q=${locationData.coordinates.lat},${locationData.coordinates.lng}`;
                        window.open(url, '_blank');
                      }
                    }}
                    className="w-full"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    View on KIVRO Map
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
