import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Account for sticky header height
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center py-20 px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      
      <div className="container relative z-10 text-center">
        {/* Badge */}
        <Badge variant="secondary" className="mb-6 inline-flex items-center gap-2 text-primary">
          <MapPin size={16} className="text-accent-orange" />
          Digital Addressing Made Simple
        </Badge>

        {/* Hero Text */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          {t('hero.title')}
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            variant="hero" 
            size="lg" 
            className="text-lg px-8 py-4"
            onClick={() => navigate('/auth')}
          >
            {t('hero.getKivroAddress')}
            <ArrowRight size={20} />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100"
            onClick={() => navigate('/delivery-setup')}
          >
            <MapPin size={20} className="mr-2" />
            Try KIVRO Address Search Delivery
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="text-lg px-8 py-4"
            onClick={() => scrollToSection('how-it-works')}
          >
            {t('hero.seeHowItWorks')}
          </Button>
        </div>

        {/* Example Address */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-card border rounded-lg px-4 sm:px-6 py-4 shadow-sm max-w-md sm:max-w-none mx-auto">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">Example Kivro Address:</div>
          <div className="font-mono text-base sm:text-lg font-semibold text-primary text-center">KV P.O BOX 25261000000-00100 Mogadishu GPO</div>
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">Blue kiosk near Central Mosque, Mogadishu</div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;