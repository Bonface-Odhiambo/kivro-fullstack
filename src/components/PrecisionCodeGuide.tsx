import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Target, Navigation, CheckCircle2, Info } from 'lucide-react';

interface PrecisionCodeGuideProps {
  compact?: boolean;
}

const PrecisionCodeGuide: React.FC<PrecisionCodeGuideProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
              KIVRO Precision
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                Meter-Level Accuracy
              </Badge>
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              Get a unique 3-word code that pinpoints your exact location with meter-level precision.
            </p>
            <div className="text-xs text-blue-700 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                <span>Works anywhere in Africa</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                <span>Easy to share and remember</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                <span>Perfect for deliveries</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              KIVRO Precision
              <Badge className="bg-blue-600 hover:bg-blue-700">Meter-Level Accuracy</Badge>
            </div>
            <p className="text-sm font-normal text-muted-foreground mt-1">
              The most accurate way to share your location
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* What is it */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What is KIVRO Precision?</h4>
              <p className="text-sm text-gray-700">
                KIVRO Precision gives you a unique <strong>3-word code</strong> that identifies your exact location 
                with meter-level accuracy. It's like a digital address that works anywhere in the world.
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Navigation className="h-4 w-4 text-blue-600" />
            How to Use KIVRO Precision
          </h4>
          
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 mb-1">Get Your Precision Code</h5>
                <p className="text-sm text-gray-600">
                  Use the KIVRO Precision tool below or any compatible precision location service. Allow location access to see your current 3-word code.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 mb-1">Copy Your Code</h5>
                <p className="text-sm text-gray-600">
                  Your code will look like this: <code className="bg-gray-100 px-2 py-1 rounded text-blue-600 font-mono text-xs">filled.count.soap</code>
                  <br />
                  Tap to copy it to your clipboard.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 mb-1">Paste Into KIVRO</h5>
                <p className="text-sm text-gray-600">
                  Return to KIVRO and paste your 3-word code into the "Precision Code" field. 
                  We'll automatically convert it to your exact GPS coordinates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Why Use KIVRO Precision?
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Meter-Level Accuracy</p>
                <p className="text-xs text-green-700">Pinpoints your exact location within 3 meters</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Easy to Share</p>
                <p className="text-xs text-green-700">Just 3 words - simple to say and remember</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Works Everywhere</p>
                <p className="text-xs text-green-700">Every 3m x 3m square on Earth has a unique code</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Perfect for Deliveries</p>
                <p className="text-xs text-green-700">Couriers find you easily, even without street addresses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Example */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Example</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-gray-700">Your location:</span>
              <code className="bg-white px-2 py-1 rounded text-blue-600 font-mono text-xs border border-blue-200">
                index.home.raft
              </code>
            </div>
            <p className="text-xs text-blue-700 pl-6">
              This code represents a specific 3m x 3m square at your exact location. 
              Delivery drivers can navigate directly to this spot using GPS.
            </p>
          </div>
        </div>

        {/* Quick tip */}
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>💡 Pro Tip:</strong> Save your home's precision code in your phone's notes. 
            You can reuse it for all future deliveries to that location!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrecisionCodeGuide;
