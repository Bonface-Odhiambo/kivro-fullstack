import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Mail, Truck, User, Building, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { validateSomaliPhoneNumber, autoFormatPhoneInput, PHONE_PLACEHOLDER, PHONE_HELPER_TEXT } from '@/lib/phoneValidation';
import { API_ENDPOINTS } from '@/config/api';

interface CourierSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CourierSignupModal: React.FC<CourierSignupModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [courierType, setCourierType] = useState('individual');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');
  const [phoneError, setPhoneError] = useState('');

  const handleSignUp = async () => {
    if (!email || !password || !fullName || !phoneNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate phone number
    const phoneValidation = validateSomaliPhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || 'Invalid phone number');
      toast.error(phoneValidation.error || 'Please enter a valid phone number');
      return;
    }
    setPhoneError('');

    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            user_type: 'courier',
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile with courier user type
        const { error: profileError } = await (supabase
          .from('profiles') as any)
          .insert({
            user_id: authData.user.id,
            display_name: fullName,
            full_name: fullName,
            phone_number: phoneNumber,
            user_type: 'courier',
            company_name: courierType === 'company' ? companyName : null,
          });

        if (profileError) {
        }

        // Send welcome email to courier
        try {
          const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.WELCOME, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: email,
              full_name: fullName,
              user_type: 'courier'
            })
          });

          if (response.ok) {
          } else {
          }
        } catch (emailError) {
        }

        toast.success('Courier account created successfully! Please check your email for welcome information.');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create courier account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is a courier
      if (data.user) {
        const { data: profile } = await (supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', data.user.id)
          .single() as unknown as Promise<{ data: { user_type: string } | null; error: any }>);

        if ((profile as any)?.user_type === 'courier') {
          toast.success('Welcome back, courier!');
          onClose();
          // Redirect to courier dashboard
          window.location.href = '/dashboard';
        } else {
          await supabase.auth.signOut();
          toast.error('This account is not registered as a courier');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Courier Portal
          </DialogTitle>
          <DialogDescription>
            Sign up or sign in as a delivery courier
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="courier@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSignIn} 
              className="w-full" 
              variant="default"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In as Courier'}
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courier-type">I am a</Label>
              <Select value={courierType} onValueChange={setCourierType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Individual Courier</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="company">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>Delivery Company</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name *</Label>
              <Input
                id="fullname"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {courierType === 'company' && (
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="ABC Delivery Services"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={PHONE_PLACEHOLDER}
                value={phoneNumber}
                onChange={(e) => {
                  const formatted = autoFormatPhoneInput(e.target.value);
                  setPhoneNumber(formatted);
                  if (phoneError) setPhoneError('');
                }}
                onBlur={() => {
                  if (phoneNumber.trim()) {
                    const validation = validateSomaliPhoneNumber(phoneNumber);
                    if (!validation.isValid) {
                      setPhoneError(validation.error || 'Invalid phone number');
                    } else {
                      setPhoneError('');
                      if (validation.formatted) {
                        setPhoneNumber(validation.formatted);
                      }
                    }
                  }
                }}
                className={phoneError ? 'border-red-500' : ''}
              />
              {phoneError ? (
                <div className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span>{phoneError}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {PHONE_HELPER_TEXT}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="courier@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
            </div>

            <Button 
              onClick={handleSignUp} 
              className="w-full" 
              variant="default"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Courier Account'}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CourierSignupModal;
