import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Truck, Zap, Shield, Users } from 'lucide-react';

const EnterpriseSection: React.FC = () => {
  return (
    <section id="enterprise" className="py-20 px-4 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Enterprise Partnerships
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powering Global Delivery Networks
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Major delivery companies like DHL, FedEx, and PostNord integrate with our APIs 
            to streamline deliveries across Africa and other emerging markets.
          </p>
        </div>

        {/* Partner Logos */}
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mb-12 md:mb-16 opacity-60">
          <div className="text-xl md:text-2xl font-bold">DHL</div>
          <div className="text-xl md:text-2xl font-bold">FedEx</div>
          <div className="text-xl md:text-2xl font-bold">PostNord</div>
          <div className="text-xl md:text-2xl font-bold">UPS</div>
          <div className="text-sm md:text-lg font-semibold">+ More Partners</div>
        </div>

        {/* API Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
          <Card>
            <CardHeader>
              <Globe className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Global Reach</CardTitle>
              <CardDescription>
                Extend delivery services to underserved regions across Africa with precise digital addressing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-12 h-12 text-primary mb-4" />
              <CardTitle>API Integration</CardTitle>
              <CardDescription>
                Seamlessly integrate Kivro addresses into existing logistics and tracking systems
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Truck className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Reduced Costs</CardTitle>
              <CardDescription>
                Minimize failed deliveries and customer service costs with accurate location data
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Features for Enterprise */}
        <div className="bg-card rounded-2xl p-6 md:p-8 mb-12 md:mb-16">
          <h3 className="text-xl md:text-2xl font-bold text-center mb-8 md:mb-12">Enterprise API Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">Bulk Address Validation</h4>
                  <p className="text-muted-foreground">Validate thousands of Kivro addresses in real-time to ensure delivery accuracy.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">Enterprise Security</h4>
                  <p className="text-muted-foreground">SOC 2 compliant APIs with enterprise-grade security and data protection.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">24/7 Support</h4>
                  <p className="text-muted-foreground">Dedicated support team and account management for enterprise partners.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-card to-muted/30 rounded-xl p-6 border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-3 text-sm font-medium text-muted-foreground">integration.js</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  JavaScript
                </Badge>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-3 md:p-4 overflow-x-auto">
                <pre className="text-xs md:text-sm leading-relaxed whitespace-pre">
                  <code className="text-slate-300">
                    <span className="text-slate-500">// Validate Kivro address</span>{'\n'}
                    <span className="text-blue-400">const</span> <span className="text-white">response</span> <span className="text-slate-400">=</span> <span className="text-blue-400">await</span> <span className="text-yellow-300">kivro</span><span className="text-slate-400">.</span><span className="text-green-400">validate</span><span className="text-slate-400">({'{'}
</span>                    <span className="text-red-400">  address</span><span className="text-slate-400">:</span> <span className="text-green-300">"KV-SO-48F2-9XQ1"</span><span className="text-slate-400">,</span>{'\n'}
                    <span className="text-red-400">  country</span><span className="text-slate-400">:</span> <span className="text-green-300">"SO"</span>{'\n'}
                    <span className="text-slate-400">{'});'}</span>{'\n\n'}
                    
                    <span className="text-slate-500">// Get delivery coordinates</span>{'\n'}
                    <span className="text-blue-400">const</span> <span className="text-white">coords</span> <span className="text-slate-400">=</span> <span className="text-white">response</span><span className="text-slate-400">.</span><span className="text-yellow-300">coordinates</span><span className="text-slate-400">;</span>{'\n'}
                    <span className="text-slate-500">// {'{ lat: 2.0469, lng: 45.3182 }'}</span>
                  </code>
                </pre>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Live API</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Copy Code
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="hero" size="lg" className="text-lg px-8 py-4">
            Partner with Kivro
          </Button>
          <p className="mt-4 text-muted-foreground">
            Join DHL, FedEx, PostNord, and other global leaders in revolutionizing African logistics
          </p>
        </div>
      </div>
    </section>
  );
};

export default EnterpriseSection;