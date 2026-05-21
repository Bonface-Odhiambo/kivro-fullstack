import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'kivro_cookie_consent';

type ConsentState = 'accepted' | 'declined' | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so banner doesn't flash on first paint
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState;
    if (!stored) setTimeout(() => setVisible(true), 800);
    else setConsent(stored);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setConsent('accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setConsent('declined');
    setVisible(false);
  };

  if (!visible || consent) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-background border-t shadow-lg"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Cookie className="w-6 h-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-muted-foreground flex-1">
          We use cookies to improve your experience and analyse how Kivro is used.
          See our{' '}
          <a href="/privacy" className="underline text-primary hover:text-primary/80">
            Privacy Policy
          </a>{' '}
          for details.
        </p>
        <div className="flex gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={decline}>
            Decline
          </Button>
          <Button size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
