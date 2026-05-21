import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import KivroPinInput from '@/components/KivroPinInput';
import { 
  ShoppingCart, 
  MapPin, 
  Package, 
  CreditCard,
  Check,
  Truck,
  Code
} from 'lucide-react';

interface KivroAddress {
  short_code: string;
  display_address: string;
  latitude: number;
  longitude: number;
  region?: string;
  is_verified: boolean;
  is_business: boolean;
}

export default function KivroPinDemo() {
  const [deliveryAddress, setDeliveryAddress] = useState<KivroAddress | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleValidAddress = (address: KivroAddress) => {
    setDeliveryAddress(address);
  };

  const handleInvalidAddress = () => {
    setDeliveryAddress(null);
  };

  const handlePlaceOrder = () => {
    if (deliveryAddress) {
      setOrderPlaced(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setOrderPlaced(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">KIVRO PIN Integration</h1>
          </div>
          <p className="text-gray-600 text-lg">
            E-Commerce Checkout Demo - Use KIVRO Address as Delivery PIN
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Demo Checkout */}
          <div className="space-y-4">
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Checkout Demo
                </CardTitle>
                <CardDescription>
                  Example e-commerce checkout with KIVRO PIN integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock Cart Items */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span>Product A × 2</span>
                    <span className="font-medium">$40.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Product B × 1</span>
                    <span className="font-medium">$25.00</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-green-600">$65.00</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <Input placeholder="John Doe" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <Input placeholder="+252 61 234 5678" className="mt-1" />
                  </div>
                </div>

                {/* KIVRO PIN Input */}
                <div className="border-t pt-4">
                  <KivroPinInput
                    onValidAddress={handleValidAddress}
                    onInvalidAddress={handleInvalidAddress}
                    showMap={true}
                    autoValidate={true}
                  />
                </div>

                {/* Payment Method */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="justify-start">
                      💳 Card
                    </Button>
                    <Button variant="outline" className="justify-start">
                      📱 Mobile Money
                    </Button>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={!deliveryAddress || orderPlaced}
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                >
                  {orderPlaced ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Order Placed!
                    </>
                  ) : (
                    <>
                      <Package className="h-5 w-5 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>

                {deliveryAddress && !orderPlaced && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Truck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Delivery Ready</p>
                        <p>Your order will be delivered to: <strong>{deliveryAddress.short_code}</strong></p>
                        <p className="mt-1">{deliveryAddress.display_address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Integration Guide */}
          <div className="space-y-4">
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-purple-600" />
                  Integration Guide
                </CardTitle>
                <CardDescription>
                  How to integrate KIVRO PIN into your e-commerce site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Step 1 */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Install Component</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Add the KivroPinInput component to your checkout page
                      </p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`import KivroPinInput from '@/components/KivroPinInput';

<KivroPinInput
  onValidAddress={(address) => {
    // Handle valid address
    setDeliveryAddress(address);
  }}
  onInvalidAddress={() => {
    // Handle invalid address
    setDeliveryAddress(null);
  }}
  showMap={true}
  autoValidate={true}
/>`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">API Validation</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Validate KIVRO PIN via API endpoint
                      </p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`POST /api/addresses/validate-pin
{
  "kivro_pin": "KV-12345"
}

Response:
{
  "success": true,
  "valid": true,
  "address": {
    "short_code": "KV-12345",
    "display_address": "...",
    "latitude": 2.0469,
    "longitude": 45.3182,
    "google_maps_url": "...",
    "is_verified": true
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Delivery Integration</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Pass GPS coordinates to your delivery partner
                      </p>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`// Send to delivery company
const deliveryData = {
  order_id: "ORD-123",
  customer_name: "John Doe",
  delivery_address: address.display_address,
  gps_coordinates: {
    lat: address.latitude,
    lng: address.longitude
  },
  navigation_url: address.google_maps_url,
  kivro_pin: address.short_code
};`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-2">✨ Benefits</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Exact GPS coordinates for delivery drivers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>No manual address entry errors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Verified addresses reduce failed deliveries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Works across all African countries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Simple PIN format (e.g., KV-12345)</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* API Endpoints Card */}
            <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="text-sm">Available API Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <code className="text-purple-600 font-mono">POST /api/addresses/validate-pin</code>
                  <p className="text-gray-600 mt-1">Validate and retrieve address by PIN</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <code className="text-purple-600 font-mono">GET /api/addresses/pin/:pinCode</code>
                  <p className="text-gray-600 mt-1">Quick PIN lookup (GET request)</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <code className="text-purple-600 font-mono">GET /api/addresses/public/:shareToken</code>
                  <p className="text-gray-600 mt-1">Get full address details by share token</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>KIVRO PIN Integration Demo - Powered by KIVRO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
