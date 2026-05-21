import React from 'react';
import Logo from './Logo';
import { Mail, Phone, Globe, Smartphone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-foreground text-background py-12 md:py-16">
      <div className="container px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Logo variant="footer" size="lg" className="mb-6" />
            <p className="text-background/80 mb-6 max-w-md text-sm leading-relaxed">
              Digital addressing for everyone. Get your secure, phone-linked 
              address that works anywhere, anytime.
            </p>
            <div className="flex items-center space-x-4">
              <a href="mailto:support@kivro.so" className="w-8 h-8 bg-primary rounded flex items-center justify-center hover:bg-primary/80 transition-colors">
                <Mail size={16} className="text-white" />
              </a>
              <a href="tel:+252612345678" className="w-8 h-8 bg-primary rounded flex items-center justify-center hover:bg-primary/80 transition-colors">
                <Phone size={16} className="text-white" />
              </a>
              <a href="https://kivro.so" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-primary rounded flex items-center justify-center hover:bg-primary/80 transition-colors">
                <Globe size={16} className="text-white" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><a href="/how-it-works" className="hover:text-background transition-colors">How it Works</a></li>
              <li><a href="/pricing" className="hover:text-background transition-colors">Pricing</a></li>
              <li><a href="/couriers" className="hover:text-background transition-colors">For Couriers</a></li>
              <li><a href="/api" className="hover:text-background transition-colors">API</a></li>
              <li><a href="/business" className="hover:text-background transition-colors">For Business &amp; Gov</a></li>
            </ul>
          </div>

          {/* Download App Links */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Smartphone size={16} />
              Download App
            </h4>
            <div className="space-y-3">
              <a 
                href="https://play.google.com/store/apps/details?id=com.kivro.app"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="bg-background/10 hover:bg-background/20 transition-colors rounded-lg p-2 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-background/60">GET IT ON</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </div>
              </a>
              <a 
                href="https://apps.apple.com/app/kivro/id123456789"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="bg-background/10 hover:bg-background/20 transition-colors rounded-lg p-2 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-background/60">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-background/80">
              <li><a href="/help" className="hover:text-background transition-colors">Help Center</a></li>
              <li><a href="/contact" className="hover:text-background transition-colors">Contact Us</a></li>
              <li><a href="/privacy" className="hover:text-background transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-background transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 md:mt-12 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-background/60 gap-4">
          <p> 2025 Kivro. All rights reserved.</p>
          <div>
            Available in: EN | SO | SW
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;