import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode, 
  Camera, 
  MapPin, 
  Navigation, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  X,
  Copy
} from 'lucide-react';

interface ScanKivroModalProps {
  open: boolean;
  onClose: () => void;
}

interface AddressData {
  kivro_code: string;
  full_address: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  recipient_name?: string;
  landmark?: string;
  region?: string;
  district?: string;
}

export default function ScanKivroModal({ open, onClose }: ScanKivroModalProps) {
  const [activeTab, setActiveTab] = useState('pin');
  const [pinCode, setPinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanLoopRef = useRef<number | null>(null);
  const { toast } = useToast();

  // QR Code Scanner using native BarcodeDetector API
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current !== null) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Start scanning loop if BarcodeDetector is available
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const scan = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            scanLoopRef.current = requestAnimationFrame(scan);
            return;
          }
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const raw = codes[0].rawValue as string;
              stopCamera();
              setPinCode(raw.toUpperCase());
              setActiveTab('pin');
              resolveAddress(raw.toUpperCase());
              return;
            }
          } catch {
            // frame not ready yet — continue
          }
          scanLoopRef.current = requestAnimationFrame(scan);
        };
        scanLoopRef.current = requestAnimationFrame(scan);
      } else {
        toast({
          title: "QR scanning not supported",
          description: "Your browser does not support BarcodeDetector. Please enter the PIN manually.",
          variant: "destructive",
        });
        stopCamera();
        setActiveTab('pin');
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  // Resolve KIVRO Address via Supabase
  const resolveAddress = async (code: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase
        .from('kivro_addresses')
        .select('kivro_code, full_address, latitude, longitude, phone_number, full_name, landmark_description, region, district')
        .or(`kivro_code.eq.${code},short_code.eq.${code}`)
        .single() as unknown as Promise<{
          data: { kivro_code: string; full_address: string; latitude: number; longitude: number; phone_number: string; full_name: string | null; landmark_description: string | null; region: string | null; district: string | null } | null;
          error: any;
        }>);

      if (error || !data) {
        throw new Error('Address not found');
      }

      setAddressData({
        kivro_code: data.kivro_code,
        full_address: data.full_address,
        latitude: data.latitude,
        longitude: data.longitude,
        phone_number: data.phone_number,
        recipient_name: data.full_name ?? undefined,
        landmark: data.landmark_description ?? undefined,
        region: data.region ?? undefined,
        district: data.district ?? undefined,
      });
      toast({
        title: "Address Found!",
        description: `Located: ${data.full_address}`,
      });
    } catch (error) {
      toast({
        title: "Address Not Found",
        description: "Could not resolve this KIVRO code. Please check and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim()) {
      toast({
        title: "PIN Required",
        description: "Please enter a KIVRO PIN code",
        variant: "destructive"
      });
      return;
    }
    resolveAddress(pinCode.trim().toUpperCase());
  };

  const openInMaps = () => {
    if (!addressData) return;
    
    const { latitude, longitude } = addressData;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(googleMapsUrl, '_blank');
  };

  const copyAddress = () => {
    if (!addressData) return;
    
    const addressText = `📍 KIVRO Address: ${addressData.kivro_code}
📧 Full Address: ${addressData.full_address}
📞 Contact: ${addressData.phone_number}
${addressData.recipient_name ? `👤 Recipient: ${addressData.recipient_name}` : ''}
${addressData.landmark ? `🏛️ Landmark: ${addressData.landmark}` : ''}
🌍 GPS: ${addressData.latitude}, ${addressData.longitude}`;

    navigator.clipboard.writeText(addressText);
    toast({
      title: "Address Copied! 📋",
      description: "Address details copied to clipboard",
    });
  };

  const handleClose = () => {
    stopCamera();
    setAddressData(null);
    setPinCode('');
    setActiveTab('pin');
    onClose();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-green-600" />
            Scan KIVRO Address
          </DialogTitle>
        </DialogHeader>

        {!addressData ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pin">Enter PIN</TabsTrigger>
              <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
            </TabsList>

            <TabsContent value="pin" className="space-y-4">
              <div className="text-center py-4">
                <QrCode className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Enter KIVRO PIN</h3>
                <p className="text-muted-foreground text-sm">
                  Enter the customer's KIVRO PIN code to get their exact location
                </p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="pin">KIVRO PIN Code</Label>
                  <Input
                    id="pin"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="KV-ABC123"
                    className="text-center text-lg font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: KV-XXX-XXX (e.g., KV-ABC123)
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resolving Address...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Find Address
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="scan" className="space-y-4">
              <div className="text-center py-4">
                <Camera className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
                <p className="text-muted-foreground text-sm">
                  Scan the customer's KIVRO QR code for instant address lookup
                </p>
              </div>

              <div className="space-y-4">
                {!isScanning ? (
                  <Button 
                    onClick={startCamera}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-64 object-cover"
                        autoPlay
                        playsInline
                      />
                      <div className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-green-400 rounded-lg"></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <p className="flex-1 text-center text-sm text-green-700 font-medium py-2">
                        Scanning automatically...
                      </p>
                      <Button onClick={stopCamera} variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-800">Scanning Tips:</p>
                          <ul className="text-blue-700 mt-1 space-y-1">
                            <li>• Hold the camera steady</li>
                            <li>• Ensure good lighting</li>
                            <li>• Keep QR code within the frame</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Address Found! 📍</h3>
              <p className="text-muted-foreground">Ready for delivery navigation</p>
            </div>

            {/* Address Details */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-green-800">KIVRO Address</h4>
                  <span className="font-mono text-sm bg-green-200 text-green-800 px-2 py-1 rounded">
                    {addressData.kivro_code}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{addressData.full_address}</p>
                      {addressData.landmark && (
                        <p className="text-muted-foreground">{addressData.landmark}</p>
                      )}
                    </div>
                  </div>
                  
                  {addressData.recipient_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">👤</span>
                      <span>{addressData.recipient_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">📞</span>
                    <span>{addressData.phone_number}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">🌍</span>
                    <span className="font-mono text-xs">
                      {addressData.latitude}, {addressData.longitude}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={openInMaps} className="bg-green-600 hover:bg-green-700">
                <Navigation className="h-4 w-4 mr-2" />
                Navigate
              </Button>
              <Button onClick={copyAddress} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy Details
              </Button>
            </div>

            {/* New Scan Button */}
            <Button 
              onClick={() => {
                setAddressData(null);
                setPinCode('');
              }}
              variant="outline" 
              className="w-full"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scan Another Address
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
