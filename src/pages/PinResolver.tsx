import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * PinResolver Component
 * 
 * Resolves a KIVRO PIN (short_code) to the full address view.
 * When users paste a PIN URL in the browser, this component:
 * 1. Fetches the address using the PIN
 * 2. Redirects to /kv/:shareToken to show the map and address
 */
export default function PinResolver() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shortCode) {
      setError('No PIN code provided');
      setLoading(false);
      return;
    }

    resolvePin();
  }, [shortCode]);

  const resolvePin = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/addresses/public/code/${shortCode}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('PIN not found. Please check the code and try again.');
        }
        throw new Error('Failed to resolve PIN');
      }

      const data = await response.json();

      // Redirect to the share token view
      if (data.share_token) {
        navigate(`/kv/${data.share_token}`, { replace: true });
      } else {
        throw new Error('No share token available for this address');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resolve KIVRO PIN');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <MapPin className="h-8 w-8 text-green-600 animate-bounce" />
                <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Resolving KIVRO PIN
              </h2>
              <p className="text-gray-600 mb-2">
                Looking up address for PIN: <span className="font-mono font-bold text-green-600">{shortCode}</span>
              </p>
              <p className="text-sm text-gray-500">
                You'll be redirected to the map in a moment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">PIN Not Found</h2>
              <p className="text-gray-600 mb-2">
                Could not find address for PIN: <span className="font-mono font-bold">{shortCode}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">{error}</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/')} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Go to Home
                </Button>
                <Button 
                  onClick={resolvePin} 
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
