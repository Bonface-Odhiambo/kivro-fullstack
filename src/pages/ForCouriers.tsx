import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, Clock, Shield, TrendingUp } from 'lucide-react';

const benefits = [
  {
    icon: <Navigation className="w-12 h-12 text-primary" />,
    title: "Accurate Navigation",
    description: "Get precise directions to any Kivro address. No more calling customers for directions or getting lost in unmarked areas."
  },
  {
    icon: <Clock className="w-12 h-12 text-primary" />,
    title: "Faster Deliveries",
    description: "Reduce delivery times by up to 40%. Kivro addresses lead you directly to the customer's exact location."
  },
  {
    icon: <Shield className="w-12 h-12 text-primary" />,
    title: "Verified Addresses",
    description: "All Kivro addresses are verified and linked to real phone numbers, reducing failed delivery attempts."
  },
  {
    icon: <TrendingUp className="w-12 h-12 text-primary" />,
    title: "Increase Revenue",
    description: "Complete more deliveries per day with accurate addressing. Higher efficiency means higher earnings."
  }
];

const ForCouriers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-6">Kivro for Couriers</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join the delivery revolution. Make every delivery successful with precise Kivro addresses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            <section className="text-center bg-muted rounded-lg p-8">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                Join hundreds of couriers already using Kivro to improve their delivery success rate.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">Download Courier App</Button>
                <Button variant="outline" size="lg">Learn More</Button>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6">How It Works for Couriers</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Download the App</h3>
                  <p className="text-muted-foreground">
                    Install the Kivro Courier app and create your delivery profile.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Scan Kivro Addresses</h3>
                  <p className="text-muted-foreground">
                    Use your phone to scan Kivro QR codes or enter address codes manually.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Navigate & Deliver</h3>
                  <p className="text-muted-foreground">
                    Follow GPS directions directly to the customer's exact location.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6">Courier Features</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3"></div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Real-time Navigation</h3>
                    <p className="text-muted-foreground">
                      Get turn-by-turn directions to any Kivro address with real-time traffic updates.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3"></div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Delivery Confirmation</h3>
                    <p className="text-muted-foreground">
                      Confirm deliveries with photo proof and automatic customer notifications.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-3"></div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Earnings Dashboard</h3>
                    <p className="text-muted-foreground">
                      Track your deliveries, earnings, and performance metrics in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForCouriers;