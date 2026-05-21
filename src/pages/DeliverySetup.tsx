import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Package,
  CheckCircle,
  ArrowRight,
  Globe,
  Navigation,
  Clock,
  DollarSign
} from 'lucide-react';
import DeliveryLocationForm from '@/components/DeliveryLocationForm';
import { useToast } from '@/hooks/use-toast';

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
  precisionLocation: DeliveryLocationData | null;
  additionalInstructions: string;
  packageDescription: string;
  deliveryTime: string;
  estimatedFee: string;
  deliveryZone: string;
}

export default function DeliverySetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails | null>(null);
  const { toast } = useToast();

  const handleDeliverySubmit = (details: DeliveryDetails) => {
    setDeliveryDetails(details);
    setCurrentStep(2);
    
    toast({
      title: "Delivery Location Confirmed",
      description: "Your package delivery has been set up successfully!",
    });
  };

  const handleLocationChange = (location: DeliveryLocationData | null) => {
    // Handle real-time location updates if needed
  };

  const createDeliveryOrder = () => {
    if (!deliveryDetails) return;

    // Here you would typically send the data to your backend
    
    toast({
      title: "Delivery Order Created",
      description: "Your package delivery order has been created successfully!",
    });
    
    setCurrentStep(3);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setDeliveryDetails(null);
  };

  const steps = [
    { number: 1, title: 'Set Delivery Location', description: 'Enter recipient details and KIVRO Precision code' },
    { number: 2, title: 'Review Details', description: 'Confirm delivery information' },
    { number: 3, title: 'Order Confirmed', description: 'Your delivery is being processed' }
  ];

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">KIVRO Delivery Setup</h1>
          <p className="text-muted-foreground">
            Use KIVRO Precision to set exact delivery locations anywhere in the world
          </p>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.number 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground mx-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === 1 && (
          <DeliveryLocationForm
            onSubmit={handleDeliverySubmit}
            onLocationChange={handleLocationChange}
          />
        )}

        {currentStep === 2 && deliveryDetails && (
          <div className="space-y-6">
            {/* Review Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Review Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recipient Information */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Recipient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{deliveryDetails.recipientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{deliveryDetails.recipientPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Location
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">3-Word Address</p>
                        <p className="font-bold text-lg text-primary">{deliveryDetails.precisionLocation?.words}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (deliveryDetails.precisionLocation?.coordinates) {
                            const url = `https://www.google.com/maps?q=${deliveryDetails.precisionLocation.coordinates.lat},${deliveryDetails.precisionLocation.coordinates.lng}`;
                            window.open(url, '_blank');
                          }
                        }}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        View Map
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nearest Place</p>
                        <p className="font-medium">{deliveryDetails.precisionLocation?.nearestPlace}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Country</p>
                        <Badge variant="outline">{deliveryDetails.precisionLocation?.country}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Coordinates</p>
                        <p className="font-mono text-sm">
                          {deliveryDetails.precisionLocation?.coordinates.lat.toFixed(6)}, {deliveryDetails.precisionLocation?.coordinates.lng.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Delivery Zone</p>
                        <Badge className={deliveryDetails.deliveryZone === 'Somalia' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                          {deliveryDetails.deliveryZone}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Information */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Package Information
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-medium">{deliveryDetails.packageDescription}</p>
                    </div>
                    {deliveryDetails.additionalInstructions && (
                      <div>
                        <p className="text-sm text-muted-foreground">Special Instructions</p>
                        <p className="font-medium">{deliveryDetails.additionalInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Summary */}
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Delivery Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Clock className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-sm text-green-700">Estimated Delivery Time</p>
                        <p className="font-bold text-green-900">{deliveryDetails.deliveryTime}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-700">Delivery Fee</p>
                        <p className="font-bold text-blue-900">{deliveryDetails.estimatedFee}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button onClick={createDeliveryOrder} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm & Create Order
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Edit Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 3 && (
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Delivery Order Confirmed!</h2>
                <p className="text-muted-foreground">
                  Your package delivery to <strong>{deliveryDetails?.precisionLocation?.words}</strong> has been confirmed.
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Order ID</p>
                <p className="font-mono font-bold">KIVRO-{Date.now().toString().slice(-6)}</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You will receive SMS updates about your delivery status.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={resetForm}>
                    Create Another Delivery
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KIVRO Precision Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-2">KIVRO Precision Technology</h3>
                <p className="text-blue-700 text-sm mb-3">
                  KIVRO uses precision location technology to provide exact delivery locations anywhere in the world. 
                  Every 3m x 3m square has been given a unique combination of three words.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white">Precise to 3 meters</Badge>
                  <Badge variant="outline" className="bg-white">Works offline</Badge>
                  <Badge variant="outline" className="bg-white">Available in 50+ languages</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
