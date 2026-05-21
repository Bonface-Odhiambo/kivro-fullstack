import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'EN' | 'SO' | 'FR' | 'SW' | 'AR' | 'PT' | 'HA' | 'AM';

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translations = {
  // Header
  'nav.howItWorks': {
    EN: 'How it Works',
    SO: 'Sida uu u shaqeeyo',
    FR: 'Comment ça marche',
    SW: 'Jinsi Inavyofanya Kazi',
    AR: 'كيف يعمل',
    PT: 'Como Funciona',
    HA: 'Yadda Yake Aiki',
    AM: 'እንዴት እንደሚሰራ',
  },
  'nav.pricing': {
    EN: 'Pricing',
    SO: 'Qiimaha',
    FR: 'Tarifs',
    SW: 'Bei',
    AR: 'الأسعار',
    PT: 'Preços',
    HA: 'Farashi',
    AM: 'ዋጋ',
  },
  'nav.forCouriers': {
    EN: 'For Couriers',
    SO: 'Wasiirka',
    FR: 'Pour les coursiers',
    SW: 'Kwa Wapelekezi',
    AR: 'للمرسلين',
    PT: 'Para Estafetas',
    HA: 'Don Masu Isar Kaya',
    AM: 'ለዲሊቨሪ ሰራተኞች',
  },
  'header.signIn': {
    EN: 'Sign In',
    SO: 'Gal',
    FR: 'Se connecter',
    SW: 'Ingia',
    AR: 'تسجيل الدخول',
    PT: 'Entrar',
    HA: 'Shiga',
    AM: 'ግባ',
  },
  'header.getAddress': {
    EN: 'Get Your Address',
    SO: 'Hel cinwaankaaga',
    FR: 'Obtenez votre adresse',
    SW: 'Pata Anwani Yako',
    AR: 'احصل على عنوانك',
    PT: 'Obtenha o Seu Endereço',
    HA: 'Samu Adireshin Ka',
    AM: 'አድራሻህን ያግኝ',
  },
  // Hero Section
  'hero.title': {
    EN: 'Your address, powered by your phone',
    SO: 'Cinwaankaaga, kaasoo ka shaqeeya taleefankaaga',
    FR: 'Votre adresse, alimentée par votre téléphone',
    SW: 'Anwani yako, inayotumia simu yako',
    AR: 'عنوانك، مدعوم بهاتفك',
    PT: 'O seu endereço, alimentado pelo seu telemóvel',
    HA: 'Adireshinku, yana aiki da wayarka',
    AM: 'አድራሻህ፣ በስልክህ የሚሰራ',
  },
  'hero.subtitle': {
    EN: "Get a secure, shareable digital address linked to your phone number. Perfect for deliveries, services, and identity verification - even without a traditional street address.",
    SO: 'Hel cinwaan dijital ah oo ammaan ah oo la wadaagi karo oo ku xidhan lambarka taleefankaaga. Fiican u ah gaarsiinta, adeegyada, iyo xaqiijinta aqoonsiga - xitaa haddii aanad haysan cinwaan waddo dhaqameed.',
    FR: 'Obtenez une adresse numérique sécurisée et partageable liée à votre numéro de téléphone. Parfait pour les livraisons, les services et la vérification d\'identité - même sans adresse de rue traditionnelle.',
    SW: 'Pata anwani ya kidijitali salama na inayoweza kushirikiwa iliyounganishwa na nambari ya simu yako. Inafaa kwa uwasilishaji, huduma, na uthibitisho wa kitambulisho - hata bila anwani ya jadi ya barabara.'
  },
  'hero.getKivroAddress': {
    EN: 'Get Your Kivro Address',
    SO: 'Hel Cinwaankaaga Kivro',
    FR: 'Obtenez votre adresse Kivro',
    SW: 'Pata Anwani Yako ya Kivro'
  },
  'hero.seeHowItWorks': {
    EN: 'See How it Works',
    SO: 'Arag sida uu u shaqeeyo',
    FR: 'Voir comment ça marche',
    SW: 'Ona Jinsi Inavyofanya Kazi'
  }
};

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('EN');

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
  };

  const t = (key: string): string => {
    return translations[key]?.[currentLanguage] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};