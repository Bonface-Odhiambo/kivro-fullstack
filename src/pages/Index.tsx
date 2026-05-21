import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorksSection from '../components/HowItWorksSection';
import PricingSection from '../components/PricingSection';
import CouriersSection from '../components/CouriersSection';
import EnterpriseSection from '../components/EnterpriseSection';
import AppDownloadSection from '../components/AppDownloadSection';
import Footer from '../components/Footer';

const Index = () => {
  const navigate = useNavigate();

  // Check if user is authenticated and redirect to appropriate dashboard
  useEffect(() => {
    const checkAuthenticatedUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          
          // Check user profile to determine dashboard route
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', session.user.id)
            .single();

          if (!error && profile) {
            // Redirect based on user type
            if (profile.user_type === 'admin') {
              navigate('/admin/dashboard', { replace: true });
            } else if (profile.user_type === 'courier') {
              navigate('/courier-dashboard', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
            return;
          } else {
            // Profile not found, redirect to regular dashboard (profile will be created)
            navigate('/dashboard', { replace: true });
            return;
          }
        }
      } catch (error) {
      }
    };

    checkAuthenticatedUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <AppDownloadSection />
        <CouriersSection />
        <EnterpriseSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
