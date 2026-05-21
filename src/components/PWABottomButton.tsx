import { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWABottomButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the button
    const dismissed = localStorage.getItem('pwa-bottom-button-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Always show the button after a short delay, even without beforeinstallprompt
    setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, 2000);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      alert(
        'To install this app:\n\n' +
        'Chrome/Edge: Click the ⋮ menu → "Install Kivro"\n' +
        'Safari (iOS): Tap Share → "Add to Home Screen"\n' +
        'Firefox: Tap ⋮ → "Install"'
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      setIsDismissed(true);
    }, 300);
    localStorage.setItem('pwa-bottom-button-dismissed', 'true');
  };

  // Don't show button if already installed or dismissed
  if (isInstalled || isDismissed || !isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100px);
            opacity: 0;
          }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(10deg); }
          75% { transform: rotate(-10deg); }
        }
        
        .pwa-slide-up {
          animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .pwa-slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }
        
        .pwa-wiggle {
          animation: wiggle 2s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
      
      <div
        className={`fixed bottom-6 right-6 z-50 ${
          isAnimating ? 'pwa-slide-up' : 'pwa-slide-down'
        }`}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-xl rounded-full animate-pulse" />
          
          {/* Main button container */}
          <div className="relative bg-gradient-to-r from-primary to-primary/90 rounded-full shadow-2xl border border-primary/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-6 py-3">
              {/* Icon with animation */}
              <div className="flex-shrink-0 pwa-wiggle">
                <div className="relative">
                  <Download className="w-5 h-5 text-primary-foreground" />
                  <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>

              {/* Text content */}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary-foreground">
                  Install Kivro App
                </span>
                <span className="text-xs text-primary-foreground/80 hidden sm:block">
                  Quick access • Offline mode • Better experience
                </span>
              </div>

              {/* Install button */}
              <Button
                onClick={handleInstall}
                size="sm"
                variant="secondary"
                className="ml-2 bg-white hover:bg-white/90 text-primary font-semibold shadow-lg transition-all hover:scale-105"
              >
                Install
              </Button>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="ml-2 flex-shrink-0 text-primary-foreground/70 hover:text-primary-foreground transition-colors p-1 rounded-full hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
