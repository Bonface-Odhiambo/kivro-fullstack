import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import { getAddressIntent, clearAddressIntent } from '@/lib/addressIntent';
import OTPVerificationModal from '@/components/OTPVerificationModal';
import { API_ENDPOINTS } from '@/config/api';
import { validateAfricanPhone, cleanPhoneNumber } from '@/lib/africanPhoneValidation';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [userType, setUserType] = useState<'individual' | 'courier' | 'business'>('individual');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{ email: string; phoneNumber: string; password?: string } | null>(null);
  const [otpRequired, setOtpRequired] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const otpRequiredRef = useRef(otpRequired);
  const otpFlowActiveRef = useRef(false); // Prevent state clearing during OTP flow

  // Debug: Log when OTP modal state changes
  useEffect(() => {
    // Update ref when state changes
    otpRequiredRef.current = otpRequired;
  }, [showOTPModal, pendingAuth, otpRequired]);

  // Detect if user is accessing admin routes
  const isAdminPortal = location.pathname.startsWith('/admin');

  // Helper function to get appropriate dashboard route based on user type
  const getDashboardRoute = async (userId: string): Promise<string> => {
    if (isAdminPortal) return '/admin/dashboard';
    
    try {
      // Fetch user profile to check user_type
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type, phone_number')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        
        // If profile doesn't exist (PGRST116), create one with user data
        if (error.code === 'PGRST116') {
          try {
            // Get current user data to extract profile information
            const { data: { user } } = await supabase.auth.getUser();
            
            // Extract user information from auth user data
            const fullName = user?.user_metadata?.full_name || 
                           user?.user_metadata?.name || 
                           user?.email?.split('@')[0] || 
                           'New User';
            
            const email = user?.email || '';
            
            
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                user_id: userId,
                full_name: fullName,
                display_name: fullName,
                user_type: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            
            if (createError) {
            } else {
            }
          } catch (createErr) {
          }
        }
        
        // Always return a valid dashboard route, never redirect to 404
        return '/dashboard';
      }
      
      // Redirect based on user type
      if (profile?.user_type === 'admin') {
        return '/admin/dashboard';
      } else if (profile?.user_type === 'courier') {
        return '/courier-dashboard';
      } else if (profile?.user_type === 'business') {
        return '/dashboard'; // Business users use the same dashboard as individuals for now
      } else {
        return '/dashboard';
      }
    } catch (error) {
      // Always return a valid dashboard route, never redirect to 404
      return '/dashboard';
    }
  };

  useEffect(() => {
    // Check for OAuth callback or email confirmation in URL
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const accessToken = urlParams.get('access_token');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    // Handle OAuth errors
    if (error) {
      toast({
        title: "Sign in failed",
        description: errorDescription || error,
        variant: "destructive",
      });
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/auth');
      return;
    }
    
    if (type === 'signup' && accessToken) {
      // User clicked email confirmation link
      toast({
        title: "🎉 Account confirmed",
        description: "Welcome to KIVRO! Your account has been successfully verified.",
        duration: 5000,
      });
      
      // Clear URL parameters and redirect to appropriate dashboard
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Get session and redirect to appropriate dashboard
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          const route = await getDashboardRoute(session.user.id);
          setTimeout(() => navigate(route), 2000);
        }
      });
      return;
    }

    // Handle OAuth callback (Google sign-in redirect)
    if (window.location.pathname === '/auth/callback') {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Get session - Supabase will automatically handle the OAuth code exchange
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          // The onAuthStateChange listener will handle the redirect
        } else {
          toast({
            title: "Sign in failed",
            description: "Could not establish session. Please try again.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth'), 2000);
        }
      });
      return;
    }

    // Check if user is already authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If this is admin portal, verify user is admin before proceeding
        if (isAdminPortal) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!profile || profile.user_type !== 'admin') {
            await supabase.auth.signOut();
            toast({
              title: "Access Denied",
              description: "This portal is restricted to administrators only. Please use the main KIVRO app.",
              variant: "destructive",
            });
            return;
          }
        }

        const dashboardRoute = await getDashboardRoute(session.user.id);
        
        // Check for address generation intent
        const intent = getAddressIntent();
        if (intent && intent.wantsToGenerate) {
          toast({
            title: "Welcome back to KIVRO!",
            description: "Taking you to create your address...",
            duration: 2000,
          });
          // Redirect to create address page with intent
          setTimeout(() => navigate('/create-address', { state: { intent } }), 500);
        } else {
          toast({
            title: "Welcome back to KIVRO!",
            description: "Redirecting to your dashboard...",
            duration: 2000,
          });
          // Redirect to appropriate dashboard based on user type
          setTimeout(() => navigate(dashboardRoute), 500);
        }
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        // Don't process auth changes if OTP flow is active
        if (otpFlowActiveRef.current) {
          return;
        }
        
        // Don't redirect if OTP verification is pending
        if (event === 'SIGNED_IN' && session && !otpRequiredRef.current) {
          
          const dashboardRoute = await getDashboardRoute(session.user.id);
          
          // Check for address generation intent
          const intent = getAddressIntent();
          if (intent && intent.wantsToGenerate) {
            toast({
              title: "🎉 Welcome to KIVRO!",
              description: "Generating your address...",
              duration: 3000,
            });
            
            // Auto-generate address with intent data
            try {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
              const phoneNumber = session.user.phone || session.user.email?.split('@')[0] || '+252612345678';
              const fullName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
              
              // First, ensure profile exists
              try {
                const profileResponse = await fetch(`${apiUrl}/api/auth/profile`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  },
                  body: JSON.stringify({
                    display_name: fullName,
                    phone_number: phoneNumber,
                    location: intent.location ? `${intent.location.latitude},${intent.location.longitude}` : null
                  })
                });

                if (!profileResponse.ok) {
                  throw new Error('Failed to create user profile');
                }
                
                // Small delay to ensure profile is fully committed
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (profileError) {
                toast({
                  title: "Profile Setup Failed",
                  description: "We couldn't set up your profile. Please try again from your dashboard.",
                  variant: "destructive",
                });
                // Still redirect to appropriate dashboard, user can generate address manually
                setTimeout(() => navigate(dashboardRoute), 2000);
                return;
              }

              const requestBody: any = {
                phone_number: phoneNumber,
                full_name: fullName,
              };

              // If we have location from intent, use location-based generation
              if (intent.location?.latitude && intent.location?.longitude) {
                const response = await fetch(`${apiUrl}/api/addresses/generate-with-location`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  },
                  body: JSON.stringify({
                    ...requestBody,
                    latitude: intent.location.latitude,
                    longitude: intent.location.longitude,
                    email: session.user.email,
                    landmark_description: 'My Location'
                  })
                });

                if (response.ok) {
                  const data = await response.json();
                  toast({
                    title: "✅ Address Generated!",
                    description: `Your KIVRO address: ${data.data.kivro_code}`,
                    duration: 5000,
                  });
                } else {
                  const errorData = await response.json();
                  toast({
                    title: "Address Generation Failed",
                    description: errorData.message || "You can generate your address from the dashboard.",
                    variant: "destructive",
                  });
                }
              } else {
                // Generate with phone only
                const response = await fetch(`${apiUrl}/api/addresses/generate`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  },
                  body: JSON.stringify({
                    ...requestBody,
                    landmark: 'Central Area',
                    region: 'mogadishu'
                  })
                });

                if (response.ok) {
                  const data = await response.json();
                  toast({
                    title: "✅ Address Generated!",
                    description: `Your KIVRO address: ${data.data.kivro_code}`,
                    duration: 5000,
                  });
                } else {
                  const errorData = await response.json();
                  toast({
                    title: "Address Generation Failed",
                    description: errorData.message || "You can generate your address from the dashboard.",
                    variant: "destructive",
                  });
                }
              }

              // Clear the intent
              clearAddressIntent();
            } catch (error) {
              toast({
                title: "Setup Error",
                description: "Something went wrong. Please try generating your address again.",
                variant: "destructive",
              });
            }
            
            // Redirect to appropriate dashboard
            setTimeout(() => navigate(dashboardRoute), 2000);
          } else {
            toast({
              title: "🎉 Welcome to KIVRO!",
              description: "Redirecting to your dashboard...",
              duration: 2000,
            });
            
            // Redirect to appropriate dashboard after successful sign in
            setTimeout(() => {
              navigate(dashboardRoute, { replace: true });
            }, 500);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleOAuthSignIn = async (provider: 'google') => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number with comprehensive trimming and validation
    if (!phoneNumber || phoneNumber.trim() === '') {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number to continue.",
        variant: "destructive",
      });
      return;
    }

    // Use African phone validation for comprehensive validation
    const phoneValidation = validateAfricanPhone(phoneNumber);
    if (!phoneValidation.isValid) {
      toast({
        title: "Invalid Phone Number",
        description: phoneValidation.error || "Please enter a valid African phone number with country code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use the cleaned phone number for submission
      const cleanedPhone = phoneValidation.cleanedPhone || phoneNumber;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?confirmed=true`,
          data: {
            full_name: fullName,
            user_type: userType,
            phone_number: cleanedPhone,
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      // If user was created, update their profile with phone number
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone_number: phoneNumber })
          .eq('user_id', authData.user.id);

        if (profileError) {
        }
      }

      toast({
        title: "📧 Check your email",
        description: "We've sent a confirmation link to your email. Please click it to verify your account.",
        duration: 6000,
      });
      
      // Clear form
      setEmail('');
      setPassword('');
      setFullName('');
      setPhoneNumber('');
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      
      // First, verify email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast({
          title: "Sign in failed",
          description: authError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Check if user has phone number and user_type in profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone_number, user_type')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
      }

      // Check admin portal detection

      // If this is admin portal, check if user is actually an admin
      if (isAdminPortal) {
        if (!profile || profile.user_type !== 'admin') {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "This portal is restricted to administrators only. Please use the main KIVRO app.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Skip phone number and OTP requirements for admin users in admin portal
      if (isAdminPortal && profile.user_type === 'admin') {
        setIsLoading(false);
        // Let the auth state change handler redirect to dashboard
        return;
      }

      if (!profile?.phone_number) {
        // Sign out immediately to prevent auto-redirect
        await supabase.auth.signOut();
        // Show prompt to add phone number
        setShowPhonePrompt(true);
        setIsLoading(false);
        return;
      }


      // ALWAYS require OTP for email+password login (Two-Factor Authentication)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      
      // IMPORTANT: Set OTP required BEFORE sending OTP to prevent redirect
      setOtpRequired(true);
      otpRequiredRef.current = true;
      otpFlowActiveRef.current = true; // Prevent state clearing during OTP flow
      
      // DON'T sign out - keep user authenticated but block redirect with flags
      
      // Send OTP to user's phone
      const otpResponse = await fetch(`${apiUrl}/api/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: profile.phone_number,
          purpose: 'login',
        }),
      });

      const otpData = await otpResponse.json();

      if (!otpData.success) {
        toast({
          title: "OTP Send Failed",
          description: otpData.message || "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      
      // Show OTP modal - user was signed out, store credentials for re-authentication
      const pendingAuthData = { email, phoneNumber: profile.phone_number, password };
      
      setPendingAuth(pendingAuthData);
      setShowOTPModal(true);
      
      // Force a state check after setting
      setTimeout(() => {
      }, 100);
      
      // Also check immediately
      
      
      toast({
        title: "📱 OTP Sent",
        description: `A 6-digit verification code has been sent to ${profile.phone_number}`,
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneOnlyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.trim() === '') {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return;
    }

    // Validate and clean phone number
    const phoneValidation = validateAfricanPhone(phoneNumber);
    if (!phoneValidation.isValid) {
      toast({
        title: "Invalid Phone Number",
        description: phoneValidation.error || "Please enter a valid African phone number with country code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Send OTP to phone number
      const otpResponse = await fetch(`${apiUrl}/api/otp/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneValidation.cleanedPhone || phoneNumber,
          purpose: 'login',
        }),
      });

      const otpData = await otpResponse.json();

      if (!otpData.success) {
        toast({
          title: "OTP Send Failed",
          description: otpData.message || "Failed to send OTP. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Show OTP modal
      setPendingAuth({ email: '', phoneNumber });
      setShowOTPModal(true);
      
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${phoneNumber}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "📧 Check your email",
        description: "We've sent you a password reset link. Please check your inbox.",
        duration: 6000,
      });
      
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode: string): Promise<boolean> => {
    if (!pendingAuth) return false;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: pendingAuth.phoneNumber,
          otp_code: otpCode,
          purpose: 'login',
        }),
      });

      const data = await response.json();

      if (data.success && data.verified) {
        
        // User is already authenticated, no need to re-authenticate
        
        toast({
          title: "✅ Verification Successful",
          description: "Welcome back to KIVRO!",
        });
        
        setShowOTPModal(false);
        setPendingAuth(null);
        setPassword(''); // Clear password from state
        setOtpRequired(false); // Reset OTP requirement - this allows redirect
        otpRequiredRef.current = false; // Reset ref immediately
        otpFlowActiveRef.current = false; // Allow auth state changes again
        
        // Auth state listener will now redirect since otpRequired is false
        return true;
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid OTP code. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleResendOTP = async () => {
    if (!pendingAuth) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/otp/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: pendingAuth.phoneNumber,
        purpose: 'login',
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to resend OTP');
    }
    
    toast({
      title: "OTP Resent",
      description: `A new verification code has been sent to ${pendingAuth.phoneNumber}`,
    });
  };

  const handleCloseOTPModal = async () => {
    setShowOTPModal(false);
    setPendingAuth(null);
    setOtpRequired(false);
    otpRequiredRef.current = false;
    otpFlowActiveRef.current = false; // Allow auth state changes again
    
    // Sign out the user since they didn't complete OTP verification
    await supabase.auth.signOut();
    
    toast({
      title: "Sign In Cancelled",
      description: "OTP verification was cancelled. Please sign in again.",
    });
  };

  const handleAddPhoneNumber = async () => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return;
    }

    // Validate and clean phone number
    const phoneValidation = validateAfricanPhone(phoneNumber);
    if (!phoneValidation.isValid) {
      toast({
        title: "Invalid Phone Number",
        description: phoneValidation.error || "Please enter a valid African phone number with country code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User session not found. Please sign in again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update profile with cleaned phone number
      const cleanedPhone = phoneValidation.cleanedPhone || phoneNumber;
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: cleanedPhone })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Phone Number Added",
        description: "Your phone number has been saved successfully.",
      });

      setShowPhonePrompt(false);
      
      // Now proceed with OTP flow
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const otpResponse = await fetch(`${apiUrl}/api/otp/send-login-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          phone_number: cleanedPhone,
        }),
      });

      const otpData = await otpResponse.json();

      if (otpData.success) {
        setPendingAuth({ email, phoneNumber: cleanedPhone });
        setShowOTPModal(true);
        
        toast({
          title: "OTP Sent",
          description: `A verification code has been sent to ${phoneNumber}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add phone number.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {isAdminPortal ? 'KIVRO Admin Portal' : 'Welcome to Kivro'}
              </CardTitle>
              <CardDescription>
                {isAdminPortal 
                  ? 'Administrator access only - Sign in to manage KIVRO' 
                  : 'Get your digital address powered by your phone'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className={`grid w-full ${isAdminPortal ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  {!isAdminPortal && <TabsTrigger value="signup">Sign Up</TabsTrigger>}
                </TabsList>
                
                <TabsContent value="signin" className="space-y-6">
                  {/* OAuth Providers - Hidden in Admin Portal */}
                  {!isAdminPortal && (
                    <>
                      <div className="space-y-3">
                        <Button 
                          onClick={() => handleOAuthSignIn('google')} 
                          variant="outline" 
                          className="w-full" 
                          disabled={isLoading}
                        >
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </Button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Login Method Toggle */}
                  <div className="flex gap-2 p-1 bg-secondary rounded-lg">
                    <Button
                      type="button"
                      variant={loginMethod === 'email' ? 'default' : 'ghost'}
                      className="flex-1"
                      onClick={() => setLoginMethod('email')}
                    >
                      Email & Password
                    </Button>
                    <Button
                      type="button"
                      variant={loginMethod === 'phone' ? 'default' : 'ghost'}
                      className="flex-1"
                      onClick={() => setLoginMethod('phone')}
                    >
                      Phone Number
                    </Button>
                  </div>

                  {loginMethod === 'email' ? (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                      
                      {!isAdminPortal && (
                        <div className="text-center">
                          <Button
                            type="button"
                            variant="link"
                            className="text-sm text-muted-foreground hover:text-primary"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            Forgot your password?
                          </Button>
                        </div>
                      )}
                    </form>
                  ) : (
                    <form onSubmit={handlePhoneOnlyLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-phone">Phone Number</Label>
                        <Input
                          id="signin-phone"
                          type="tel"
                          placeholder="+254712345678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter your phone number with country code (e.g., +254...)
                        </p>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending OTP...
                          </>
                        ) : (
                          'Send OTP Code'
                        )}
                      </Button>
                      {!isAdminPortal && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800 text-center">
                            📱 We'll send a 6-digit code to your phone number
                          </p>
                        </div>
                      )}
                    </form>
                  )}

                  {/* Forgot Password Dialog */}
                  {showForgotPassword && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <Card className="w-full max-w-md">
                        <CardHeader>
                          <CardTitle>Reset Password</CardTitle>
                          <CardDescription>
                            Enter your email address and we'll send you a link to reset your password.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleForgotPassword} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="reset-email">Email</Label>
                              <Input
                                id="reset-email"
                                type="email"
                                placeholder="Enter your email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                required
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  setShowForgotPassword(false);
                                  setResetEmail('');
                                }}
                                disabled={isLoading}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" className="flex-1" disabled={isLoading}>
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  'Send Reset Link'
                                )}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-6">
                  {/* OAuth Providers */}
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleOAuthSignIn('google')} 
                      variant="outline" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign up with Google
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-type">Account Type</Label>
                      <select
                        id="user-type"
                        value={userType}
                        onChange={(e) => setUserType(e.target.value as 'individual' | 'courier' | 'business')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="individual">👤 Individual - Personal addresses & deliveries</option>
                        <option value="business">🏢 Business - Company addresses & commercial deliveries</option>
                        <option value="courier">🚚 Courier - Delivery & taxi services</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {userType === 'courier' 
                          ? 'As a courier, you can use KIVRO addresses for pickups and deliveries'
                          : userType === 'business'
                          ? 'Create business addresses for your company locations and commercial operations'
                          : 'Create your personal KIVRO address for receiving mail and packages'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Phone Number *</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+254712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for OTP verification. Include country code (e.g., +254...)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignUpPassword ? "text" : "password"}
                          placeholder="Create a password (min. 6 characters)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                        >
                          {showSignUpPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* OTP Verification Modal */}
      {(() => {
        
        if (showOTPModal && pendingAuth) {
          return (
            <OTPVerificationModal
              isOpen={showOTPModal}
              onClose={handleCloseOTPModal}
              onVerify={handleVerifyOTP}
              phoneNumber={pendingAuth.phoneNumber}
              email={pendingAuth.email}
              onResendOTP={handleResendOTP}
            />
          );
        } else {
          return null;
        }
      })()}

      {/* Phone Number Prompt Modal for Existing Users */}
      {showPhonePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>📱 Phone Number Required</CardTitle>
              <CardDescription>
                To enhance security with OTP verification, please add your phone number to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone Number</Label>
                <Input
                  id="add-phone"
                  type="tel"
                  placeholder="+254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +254 for Kenya, +252 for Somalia)
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  🔐 Your phone number will be used for secure OTP verification during login.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    setShowPhonePrompt(false);
                    await supabase.auth.signOut();
                    toast({
                      title: "Sign In Cancelled",
                      description: "Please sign in again when ready to add your phone number.",
                    });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleAddPhoneNumber}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Auth;