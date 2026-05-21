import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Navigation, MapPin, Clock, Shield, Smartphone } from 'lucide-react';
import CourierSignupModal from './CourierSignupModal';
import DemoSearchModal from './DemoSearchModal';

const CouriersSection: React.FC = () => {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showDemoSearchModal, setShowDemoSearchModal] = useState(false);

  return (
    <section id="couriers" className="py-20 px-4">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            For Delivery Partners
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simplify Your Deliveries
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Access accurate addresses instantly, navigate with confidence, and provide 
            better service to customers without traditional street addresses. Trusted by 
            major delivery companies like DHL and FedEx for African deliveries.
          </p>
        </div>

        {/* Key Features for Couriers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
          <Card>
            <CardHeader>
              <Search className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Quick Address Lookup</CardTitle>
              <CardDescription>
                Search by Kivro code, phone number, or Plus Code to instantly find delivery locations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Navigation className="w-12 h-12 text-primary mb-4" />
              <CardTitle>One-Tap Navigation</CardTitle>
              <CardDescription>
                Get precise GPS coordinates and open directions in your preferred navigation app
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Delivery Tracking</CardTitle>
              <CardDescription>
                Update delivery status in real-time and leave notes for future deliveries
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works for Couriers */}
        <div className="bg-muted/30 rounded-2xl p-6 md:p-8 mb-12 md:mb-16">
          <h3 className="text-xl md:text-2xl font-bold text-center mb-8 md:mb-12">How Couriers Use Kivro</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold mb-2">1. Search</h4>
              <p className="text-sm text-muted-foreground">
                Enter the Kivro code from the delivery instructions
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold mb-2">2. Locate</h4>
              <p className="text-sm text-muted-foreground">
                See the exact location with landmarks and GPS coordinates
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold mb-2">3. Navigate</h4>
              <p className="text-sm text-muted-foreground">
                Open your navigation app with one tap for turn-by-turn directions
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold mb-2">4. Deliver</h4>
              <p className="text-sm text-muted-foreground">
                Complete delivery and update status for customer and dispatcher
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-16">
          <div>
            <h3 className="text-2xl font-bold mb-6">Why Couriers Love Kivro</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">Reduce Failed Deliveries</h4>
                  <p className="text-muted-foreground">Accurate locations mean fewer failed delivery attempts and happier customers.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">Save Time</h4>
                  <p className="text-muted-foreground">No more calling customers for directions or searching for unclear addresses.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">Easy to Use</h4>
                  <p className="text-muted-foreground">Simple interface that works on any device, online or offline.</p>
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
              <CardDescription>
                Join thousands of couriers already using Kivro for more efficient deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={() => setShowSignupModal(true)}
                >
                  Sign Up as Courier
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={() => setShowDemoSearchModal(true)}
                >
                  Try Demo Search
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Free to use • No subscription required
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CourierSignupModal 
        isOpen={showSignupModal} 
        onClose={() => setShowSignupModal(false)} 
      />
      <DemoSearchModal 
        isOpen={showDemoSearchModal} 
        onClose={() => setShowDemoSearchModal(false)} 
      />
    </section>
  );
};

export default CouriersSection;