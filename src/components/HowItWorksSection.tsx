import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, MessageSquare, Truck } from 'lucide-react';

const steps = [
  {
    step: "01",
    icon: <MapPin className="w-8 h-8 text-accent-orange" />,
    title: "Drop Your Pin",
    description: "Sign up with your phone number and drop a pin on the map at your location. Add a landmark description to help others find you easily."
  },
  {
    step: "02", 
    icon: <MessageSquare className="w-8 h-8 text-accent-orange" />,
    title: "Get Your Code",
    description: "Receive your unique Kivro Address code (like KV-SO-48F2-9XQ1) that's easy to share and remember. No more giving complex directions."
  },
  {
    step: "03",
    icon: <Truck className="w-8 h-8 text-accent-orange" />,
    title: "Share & Receive",
    description: "Share your Kivro Address via SMS, WhatsApp, or QR code. Couriers and services can find you instantly using the code."
  }
];

const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-12 sm:py-20 px-4 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">How Kivro Works</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Getting your digital address is simple. No technical knowledge required.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {/* Step Card */}
              <Card className="text-center h-full border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 sm:p-8">
                  {/* Step Badge */}
                  <div className="relative mb-4 sm:mb-6">
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center"
                    >
                      {step.step}
                    </Badge>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      {step.icon}
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{step.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-primary/20 transform -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>

        {/* Privacy Notice */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full" />
            GDPR Compliant • Privacy First • Encrypted Data
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;