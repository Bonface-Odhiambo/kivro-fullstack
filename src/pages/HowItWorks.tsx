import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Smartphone, Package } from 'lucide-react';

const steps = [
  {
    icon: <MapPin className="w-12 h-12 text-primary" />,
    title: "Drop Your Pin",
    description: "Open the Kivro app and drop a pin at your exact location. Our system generates a unique address code linked to your phone number."
  },
  {
    icon: <Smartphone className="w-12 h-12 text-primary" />,
    title: "Share Your Code", 
    description: "Share your Kivro address via SMS, WhatsApp, or QR code. Recipients can find you instantly without needing your exact coordinates."
  },
  {
    icon: <Package className="w-12 h-12 text-primary" />,
    title: "Receive Deliveries",
    description: "Couriers use your Kivro address to navigate directly to your location. Track packages in real-time through our platform."
  }
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 sm:py-16 lg:py-20">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">How Kivro Works</h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Transform any location into a deliverable address in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {steps.map((step, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6 sm:p-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{step.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 px-4">
            <section>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">The Technology Behind Kivro</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Kivro uses advanced geolocation technology combined with a unique addressing system 
                  to create precise, shareable addresses for any location in Somalia. Our platform 
                  integrates with existing courier networks and provides real-time tracking capabilities.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6">For Businesses</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground">
                  Integrate Kivro addresses into your e-commerce platform or delivery system. 
                  Our API makes it easy to validate addresses and provide accurate delivery 
                  locations for your customers.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6">Security & Privacy</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground">
                  Your phone number remains private. Only share what you want to share. 
                  Kivro addresses can be temporary or permanent, giving you full control 
                  over your delivery information.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;