import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="py-12 sm:py-20 px-4 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="secondary" className="mb-4">
            Simple Pricing
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you need more addresses or premium features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Free
                <Badge variant="outline">Most Popular</Badge>
              </CardTitle>
              <CardDescription>
                Perfect for personal use
              </CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-xs text-muted-foreground mt-1">Always free</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>1 active Kivro address for 1 month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>SMS/WhatsApp sharing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>QR code generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>Basic delivery tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>Mobile app access</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Get Started Free
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-primary">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                <Star size={14} className="mr-1" />
                Recommended
              </Badge>
            </div>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>
                For power users and small businesses
              </CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$1</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-xs text-muted-foreground mt-1">Billed annually at $12</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>1 active address</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>Priority pin verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>Custom vanity aliases</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>Advanced delivery analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>API access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>24/7 priority support</span>
                </li>
              </ul>
              <Button variant="hero" className="w-full">
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>

          {/* Business Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>Business</CardTitle>
              <CardDescription>
                For growing businesses and organizations
              </CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$2</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-xs text-muted-foreground mt-1">Billed annually at $24/year</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>Unlimited active addresses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>Bulk QR code generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>Team management tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>Advanced analytics dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>White-label options</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-primary" />
                  <span>Dedicated account manager</span>
                </li>
              </ul>
              <Button variant="default" className="w-full">
                Get Business Plan
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <p className="text-xs sm:text-sm text-muted-foreground px-4">
            Need custom pricing for your organization? 
            <a href="#" className="text-primary hover:underline ml-1">Contact our sales team</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;