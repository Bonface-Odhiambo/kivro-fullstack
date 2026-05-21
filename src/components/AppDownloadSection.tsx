import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Download, QrCode } from 'lucide-react';

const AppDownloadSection: React.FC = () => {
  const googlePlayUrl = "https://play.google.com/store/apps/details?id=com.kivro.app";
  const appStoreUrl = "https://apps.apple.com/app/kivro/id123456789";

  return (
    <section id="download-app" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Download the KIVRO App
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Get the KIVRO mobile app for the best experience. Available on Android and iOS.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
          {/* Left: App Info */}
          <div className="space-y-6">
            <Card className="border-2 border-green-200 bg-white/80 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Mobile App Features</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        Create and manage KIVRO addresses on the go
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        Receive instant notifications for deliveries
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        Share addresses via QR code or SMS
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        Track packages in real-time
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        Works offline with cached addresses
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download Buttons */}
            <div className="space-y-4">
              <h3 className="font-semibold text-center sm:text-left">Download Now:</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Google Play Button */}
                <a 
                  href={googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button 
                    className="w-full bg-black hover:bg-gray-800 text-white h-14 gap-3"
                    size="lg"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">GET IT ON</div>
                      <div className="text-sm font-semibold">Google Play</div>
                    </div>
                  </Button>
                </a>

                {/* App Store Button */}
                <a 
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button 
                    className="w-full bg-black hover:bg-gray-800 text-white h-14 gap-3"
                    size="lg"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">Download on the</div>
                      <div className="text-sm font-semibold">App Store</div>
                    </div>
                  </Button>
                </a>
              </div>
            </div>

            {/* PWA Option */}
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground mb-2">
                Or use KIVRO directly in your browser - no download needed!
              </p>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Install as Web App
              </Button>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <Card className="bg-gradient-to-br from-green-600 to-blue-600 p-8 max-w-sm">
              <CardContent className="p-0">
                <div className="bg-white rounded-3xl p-6 shadow-2xl">
                  <div className="space-y-6">
                    {/* QR Code Placeholder */}
                    <div className="bg-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center aspect-square">
                      <QrCode className="h-32 w-32 text-gray-400 mb-4" />
                      <p className="text-sm font-medium text-gray-600 text-center">
                        Scan to Download
                      </p>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Point your camera at this QR code to download the app
                      </p>
                    </div>

                    {/* App Info */}
                    <div className="text-center">
                      <h4 className="font-bold text-lg mb-1">KIVRO</h4>
                      <p className="text-sm text-muted-foreground">Digital Addressing Made Simple</p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-medium">4.8</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">50K+</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Downloads</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">4.8</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Rating</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">100K+</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Addresses</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">15+</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Countries</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
