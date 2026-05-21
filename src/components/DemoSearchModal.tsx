import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, Navigation, Phone, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DemoSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DemoAddress {
  kivro_code: string;
  display_address: string;
  region: string;
  district: string;
  landmark: string;
  latitude: number;
  longitude: number;
  phone_number?: string;
}

// Demo addresses for testing
const demoAddresses: DemoAddress[] = [
  {
    kivro_code: 'KIVRO-MG-001',
    display_address: 'Mogadishu, Hodan District, Near Liido Beach',
    region: 'Benadir',
    district: 'Hodan',
    landmark: 'Liido Beach, 200m north of the main entrance',
    latitude: 2.0469,
    longitude: 45.3182,
    phone_number: '+252 61 234 5678',
  },
  {
    kivro_code: 'KIVRO-HR-002',
    display_address: 'Hargeisa, Ibrahim Kodbuur Street',
    region: 'Maroodi Jeex',
    district: 'Hargeisa',
    landmark: 'Near Hargeisa Cultural Center, white building',
    latitude: 9.5599,
    longitude: 44.0650,
    phone_number: '+252 63 567 8901',
  },
  {
    kivro_code: 'KIVRO-BO-003',
    display_address: 'Bosaso, Port Area',
    region: 'Bari',
    district: 'Bosaso',
    landmark: 'Bosaso Port, Container Terminal Building',
    latitude: 11.2842,
    longitude: 49.1816,
    phone_number: '+252 90 876 5432',
  },
];

const DemoSearchModal: React.FC<DemoSearchModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<DemoAddress | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a Kivro code or phone number');
      return;
    }

    // Search in demo addresses
    const result = demoAddresses.find(
      (addr) =>
        addr.kivro_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.phone_number?.includes(searchQuery)
    );

    if (result) {
      setSearchResult(result);
      toast.success('Address found!');
    } else {
      setSearchResult(null);
      toast.error('Address not found. Try one of the demo codes: KIVRO-MG-001, KIVRO-HR-002, or KIVRO-BO-003');
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleNavigate = () => {
    if (!searchResult) return;
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${searchResult.latitude},${searchResult.longitude}`;
    window.open(googleMapsUrl, '_blank');
    toast.success('Opening navigation...');
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Demo Address Search
          </DialogTitle>
          <DialogDescription>
            Try searching for Kivro addresses with demo data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search by Kivro Code or Phone Number</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                type="text"
                placeholder="e.g., KIVRO-MG-001 or +252 61 234 5678"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="default">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Demo Codes Helper */}
          {!searchResult && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Try These Demo Codes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {demoAddresses.map((addr) => (
                  <div key={addr.kivro_code} className="flex items-center justify-between">
                    <div>
                      <Badge variant="secondary" className="font-mono">
                        {addr.kivro_code}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {addr.district}, {addr.region}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearchQuery(addr.kivro_code);
                        handleSearch();
                      }}
                    >
                      Use
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {searchResult && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        {searchResult.kivro_code}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {searchResult.display_address}
                      </CardDescription>
                    </div>
                    <Badge variant="default">Demo</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Region</Label>
                      <p className="font-medium">{searchResult.region}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">District</Label>
                      <p className="font-medium">{searchResult.district}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Landmark</Label>
                    <p className="text-sm mt-1">{searchResult.landmark}</p>
                  </div>

                  {/* GPS Coordinates */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <Label className="text-xs font-semibold">GPS Coordinates</Label>
                    <div className="flex items-center justify-between">
                      <code className="text-sm">
                        {searchResult.latitude}, {searchResult.longitude}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleCopy(`${searchResult.latitude}, ${searchResult.longitude}`, 'coords')
                        }
                      >
                        {copiedField === 'coords' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Phone Number */}
                  {searchResult.phone_number && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{searchResult.phone_number}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(searchResult.phone_number!, 'phone')}
                      >
                        {copiedField === 'phone' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleNavigate} className="flex-1" variant="default">
                      <Navigation className="w-4 h-4 mr-2" />
                      Navigate
                    </Button>
                    <Button onClick={handleReset} variant="outline" className="flex-1">
                      New Search
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Map Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Location Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${searchResult.latitude},${searchResult.longitude}&zoom=15`}
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoSearchModal;
