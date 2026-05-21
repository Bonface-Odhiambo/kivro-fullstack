import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Menu, X } from 'lucide-react';
import Logo from './Logo';
import AddressModal from './AddressModal';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { setAddressIntent } from '@/lib/addressIntent';
import { useToast } from '@/hooks/use-toast';

const Header: React.FC = () => {
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { tenant, isWhiteLabel } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Detect if user is accessing admin routes
  const isAdminPortal = location.pathname.startsWith('/admin');

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetAddress = () => {
    if (isAuthenticated) {
      navigate('/create-address');
    } else {
      // Request location permission before redirecting to auth
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Store intent with location
            setAddressIntent({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            toast({
              title: "📍 Location captured!",
              description: "Please sign in to generate your address",
            });
            navigate('/auth');
          },
          (error) => {
            // Store intent without location if permission denied
            setAddressIntent();
            toast({
              title: "Sign in to continue",
              description: "You can set your location after signing in",
            });
            navigate('/auth');
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        // No geolocation support, store intent without location
        setAddressIntent();
        navigate('/auth');
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Apply tenant primary color to CSS variable on mount
  React.useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', tenant.primary_color);
  }, [tenant.primary_color]);

  const languages = [
    { code: 'EN' as Language, name: 'English',    flag: '🇺🇸' },
    { code: 'SO' as Language, name: 'Somali',     flag: '🇸🇴' },
    { code: 'FR' as Language, name: 'Français',   flag: '🇫🇷' },
    { code: 'SW' as Language, name: 'Kiswahili',  flag: '🇹🇿' },
    { code: 'AR' as Language, name: 'العربية',     flag: '🇪🇬' },
    { code: 'PT' as Language, name: 'Português',  flag: '🇲🇿' },
    { code: 'HA' as Language, name: 'Hausa',       flag: '🇳🇬' },
    { code: 'AM' as Language, name: 'አማርኛ',       flag: '🇪🇹' }
  ];

  const scrollToSection = (sectionId: string) => {
    // If we're not on the homepage, navigate there first
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.offsetTop;
          const offsetPosition = elementPosition - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      // We're already on homepage, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.offsetTop;
        const offsetPosition = elementPosition - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Logo size="md" showIcon={true} />
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium">
          {location.pathname === '/' ? (
            <>
              <button 
                onClick={() => scrollToSection('how-it-works')} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.howItWorks')}
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.pricing')}
              </button>
              <button 
                onClick={() => scrollToSection('couriers')} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t('nav.forCouriers')}
              </button>
            </>
          ) : (
            <>
              <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                {t('nav.howItWorks')}
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                {t('nav.pricing')}
              </Link>
              <Link to="/couriers" className="text-muted-foreground hover:text-primary transition-colors">
                {t('nav.forCouriers')}
              </Link>
              <Link to="/business" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                For Business
              </Link>
              {isWhiteLabel && (
                <Link to="/reseller" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  Partner portal
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                🌐 {currentLanguage}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => setLanguage(language.code)}
                  className={currentLanguage === language.code ? "bg-accent" : ""}
                >
                  <span className="mr-2">{language.flag}</span>
                  {language.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
              {!isAdminPortal && (
                <Button variant="hero" size="sm" onClick={handleGetAddress}>
                  Create Address
                </Button>
              )}
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  {t('header.signIn')}
                </Button>
              </Link>
              {!isAdminPortal && (
                <Button variant="hero" size="sm" onClick={handleGetAddress}>
                  {t('header.getAddress')}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2">
                🌐
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language.code}
                  onClick={() => setLanguage(language.code)}
                  className={currentLanguage === language.code ? "bg-accent" : ""}
                >
                  <span className="mr-2">{language.flag}</span>
                  {language.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!isAdminPortal && (
            <Button variant="hero" size="sm" onClick={handleGetAddress} className="px-3">
              {isAuthenticated ? 'Create' : 'Get'}
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            {location.pathname === '/' ? (
              <>
                <button 
                  onClick={() => {
                    scrollToSection('how-it-works');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('nav.howItWorks')}
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('pricing');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('nav.pricing')}
                </button>
                <button 
                  onClick={() => {
                    scrollToSection('couriers');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('nav.forCouriers')}
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('nav.howItWorks')}
                </Link>
                <Link 
                  to="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('nav.pricing')}
                </Link>
                <Link 
                  to="/couriers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left py-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('nav.forCouriers')}
                </Link>
              </>
            )}
            <hr className="border-border" />
            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full justify-start"
                >
                  {t('header.signIn')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <AddressModal isOpen={addressModalOpen} onClose={() => setAddressModalOpen(false)} />
    </header>
  );
};

export default Header;