import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Share2, Shield } from 'lucide-react';

const features = [
  {
    icon: <MapPin className="w-12 h-12 text-primary" />,
    title: "Easy Setup", 
    description: "Drop a pin, get your code. Ready in under 60 seconds."
  },
  {
    icon: <Share2 className="w-12 h-12 text-primary" />,
    title: "Share Anywhere",
    description: "Send via SMS, WhatsApp, or QR code. Works everywhere."
  },
  {
    icon: <Shield className="w-12 h-12 text-primary" />,
    title: "Privacy First",
    description: "Your phone number stays private. Share only what you want."
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-20 px-4">
      <div className="container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 sm:p-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;