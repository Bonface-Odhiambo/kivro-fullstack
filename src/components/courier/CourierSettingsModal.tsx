import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  User, 
  Bell, 
  MapPin, 
  Truck,
  Save,
  Loader2,
  Phone,
  Mail,
  Camera,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';

interface CourierSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

interface CourierProfile {
  full_name: string;
  phone_number: string;
  email: string;
  bio: string;
  vehicle_type: string;
  license_plate: string;
  availability_status: 'available' | 'busy' | 'offline';
  working_hours_start: string;
  working_hours_end: string;
  delivery_radius: number;
  base_rate: number;
  profile_image_url?: string;
}

interface NotificationSettings {
  new_delivery_notifications: boolean;
  delivery_updates: boolean;
  payment_notifications: boolean;
  promotional_messages: boolean;
  sms_notifications: boolean;
  email_notifications: boolean;
}

export default function CourierSettingsModal({ open, onClose }: CourierSettingsModalProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<CourierProfile>({
    full_name: '',
    phone_number: '',
    email: '',
    bio: '',
    vehicle_type: 'motorcycle',
    license_plate: '',
    availability_status: 'available',
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    delivery_radius: 10,
    base_rate: 5.00
  });
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    new_delivery_notifications: true,
    delivery_updates: true,
    payment_notifications: true,
    promotional_messages: false,
    sms_notifications: true,
    email_notifications: true
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadCourierSettings();
    }
  }, [open]);

  const loadCourierSettings = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
      } else if (profileData) {
        setProfile({
          full_name: profileData.display_name || '',
          phone_number: profileData.phone_number || '',
          email: session.user.email || '',
          bio: profileData.bio || '',
          vehicle_type: profileData.vehicle_type || 'motorcycle',
          license_plate: profileData.license_plate || '',
          availability_status: profileData.availability_status || 'available',
          working_hours_start: profileData.working_hours_start || '08:00',
          working_hours_end: profileData.working_hours_end || '18:00',
          delivery_radius: profileData.delivery_radius || 10,
          base_rate: profileData.base_rate || 5.00,
          profile_image_url: profileData.profile_image_url
        });
      }

      // Load notification settings (mock for now)
      // In real implementation, fetch from user preferences table
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load courier settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.full_name,
          phone_number: profile.phone_number,
          bio: profile.bio,
          vehicle_type: profile.vehicle_type,
          license_plate: profile.license_plate,
          availability_status: profile.availability_status,
          working_hours_start: profile.working_hours_start,
          working_hours_end: profile.working_hours_end,
          delivery_radius: profile.delivery_radius,
          base_rate: profile.base_rate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Profile Updated! ✅",
        description: "Your courier profile has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save profile changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotifications = async () => {
    setIsSaving(true);
    try {
      // In real implementation, save to user preferences table
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notifications Updated! 🔔",
        description: "Your notification preferences have been saved",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save notification settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/profile.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('courier-profiles')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('courier-profiles')
        .getPublicUrl(fileName);

      // Update profile with image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: data.publicUrl })
        .eq('user_id', session.user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile(prev => ({ ...prev, profile_image_url: data.publicUrl }));
      
      toast({
        title: "Profile Photo Updated! 📸",
        description: "Your profile photo has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile photo",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-600" />
            Courier Settings
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading settings...</span>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Profile Photo */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {profile.profile_image_url ? (
                        <img 
                          src={profile.profile_image_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="profile-photo" className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Camera className="h-4 w-4 mr-2" />
                            Change Photo
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="profile-photo"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG up to 5MB
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={profile.phone_number}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed here. Contact support if needed.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio / Description</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell customers about yourself and your delivery service..."
                      rows={3}
                    />
                  </div>

                  <Button onClick={saveProfile} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Availability & Working Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="availability_status">Current Status</Label>
                    <select
                      id="availability_status"
                      value={profile.availability_status}
                      onChange={(e) => setProfile(prev => ({ ...prev, availability_status: e.target.value as any }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="available">🟢 Available</option>
                      <option value="busy">🟡 Busy</option>
                      <option value="offline">🔴 Offline</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="working_hours_start">Start Time</Label>
                      <Input
                        id="working_hours_start"
                        type="time"
                        value={profile.working_hours_start}
                        onChange={(e) => setProfile(prev => ({ ...prev, working_hours_start: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="working_hours_end">End Time</Label>
                      <Input
                        id="working_hours_end"
                        type="time"
                        value={profile.working_hours_end}
                        onChange={(e) => setProfile(prev => ({ ...prev, working_hours_end: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="delivery_radius">Delivery Radius (km)</Label>
                    <Input
                      id="delivery_radius"
                      type="number"
                      min="1"
                      max="50"
                      value={profile.delivery_radius}
                      onChange={(e) => setProfile(prev => ({ ...prev, delivery_radius: parseInt(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum distance you're willing to travel for deliveries
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="base_rate">Base Rate ($ per delivery)</Label>
                    <Input
                      id="base_rate"
                      type="number"
                      min="1"
                      step="0.50"
                      value={profile.base_rate}
                      onChange={(e) => setProfile(prev => ({ ...prev, base_rate: parseFloat(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your minimum charge per delivery (before distance/complexity adjustments)
                    </p>
                  </div>

                  <Button onClick={saveProfile} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Availability
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Delivery Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="new_delivery_notifications">New Delivery Requests</Label>
                          <p className="text-sm text-muted-foreground">Get notified when new deliveries are available</p>
                        </div>
                        <Switch
                          id="new_delivery_notifications"
                          checked={notifications.new_delivery_notifications}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, new_delivery_notifications: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="delivery_updates">Delivery Status Updates</Label>
                          <p className="text-sm text-muted-foreground">Updates about your ongoing deliveries</p>
                        </div>
                        <Switch
                          id="delivery_updates"
                          checked={notifications.delivery_updates}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, delivery_updates: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="payment_notifications">Payment Notifications</Label>
                          <p className="text-sm text-muted-foreground">Alerts when you receive payments</p>
                        </div>
                        <Switch
                          id="payment_notifications"
                          checked={notifications.payment_notifications}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, payment_notifications: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Communication Channels</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="sms_notifications">SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
                        </div>
                        <Switch
                          id="sms_notifications"
                          checked={notifications.sms_notifications}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms_notifications: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email_notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch
                          id="email_notifications"
                          checked={notifications.email_notifications}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_notifications: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Marketing</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="promotional_messages">Promotional Messages</Label>
                        <p className="text-sm text-muted-foreground">Receive updates about new features and promotions</p>
                      </div>
                      <Switch
                        id="promotional_messages"
                        checked={notifications.promotional_messages}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, promotional_messages: checked }))}
                      />
                    </div>
                  </div>

                  <Button onClick={saveNotifications} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Notifications
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vehicle" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="vehicle_type">Vehicle Type</Label>
                    <select
                      id="vehicle_type"
                      value={profile.vehicle_type}
                      onChange={(e) => setProfile(prev => ({ ...prev, vehicle_type: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="motorcycle">🏍️ Motorcycle</option>
                      <option value="bicycle">🚲 Bicycle</option>
                      <option value="car">🚗 Car</option>
                      <option value="van">🚐 Van</option>
                      <option value="truck">🚚 Truck</option>
                      <option value="walking">🚶 Walking</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="license_plate">License Plate Number</Label>
                    <Input
                      id="license_plate"
                      value={profile.license_plate}
                      onChange={(e) => setProfile(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                      placeholder="ABC-123"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Required for motorized vehicles
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Vehicle Verification</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          To ensure safety and compliance, please upload your vehicle registration 
                          and driver's license. Contact support for verification assistance.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Upload Documents
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button onClick={saveProfile} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Vehicle Info
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
