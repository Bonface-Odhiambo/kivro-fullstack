import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { validateAfricanPhone, autoFormatAfricanPhoneInput } from '@/lib/africanPhoneValidation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  User,
  MapPin,
  QrCode,
  Weight,
  DollarSign,
  Loader2,
  Save,
  X,
  AlertCircle,
  Truck
} from 'lucide-react';

interface CreatePackageModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PackageFormData {
  // Sender Information
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_kivro_address: string;
  
  // Recipient Information
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_kivro_address: string;
  
  // Package Details
  package_type: string;
  description: string;
  weight: string;
  dimensions: string;
  declared_value: string;
  
  // Delivery Information
  pickup_date: string;
  delivery_date: string;
  special_instructions: string;
  
  // Tracking
  qr_code: string;
  tracking_number: string;
  
  // Status
  status: string;
  payment_status: string;
  delivery_fee: string;
}

const PACKAGE_TYPES = [
  'Document',
  'Electronics',
  'Clothing',
  'Food',
  'Fragile',
  'Perishable',
  'Valuable',
  'General'
];

const PACKAGE_STATUSES = [
  'pending',
  'processing',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'cod', // Cash on Delivery
  'refunded'
];

export default function CreatePackageModal({ open, onClose, onSuccess }: CreatePackageModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sender' | 'recipient' | 'package'>('sender');

  const [formData, setFormData] = useState<PackageFormData>({
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    sender_kivro_address: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    recipient_kivro_address: '',
    package_type: 'General',
    description: '',
    weight: '',
    dimensions: '',
    declared_value: '',
    pickup_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    special_instructions: '',
    qr_code: '',
    tracking_number: '',
    status: 'pending',
    payment_status: 'pending',
    delivery_fee: ''
  });

  const handleInputChange = (field: keyof PackageFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateQRCode = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const qrCode = `PKG-${timestamp}-${random}`;
    setFormData(prev => ({ ...prev, qr_code: qrCode }));
    toast({
      title: "QR Code Generated",
      description: `QR Code: ${qrCode}`
    });
  };

  const generateTrackingNumber = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const trackingNumber = `TRK${timestamp}${random}`;
    setFormData(prev => ({ ...prev, tracking_number: trackingNumber }));
    toast({
      title: "Tracking Number Generated",
      description: `Tracking: ${trackingNumber}`
    });
  };

  const generatePackageID = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PKG-${timestamp}-${random}`;
  };

  const validateForm = (): boolean => {
    // Sender validation
    if (!formData.sender_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Sender name is required",
        variant: "destructive"
      });
      setActiveTab('sender');
      return false;
    }

    if (!formData.sender_phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Sender phone is required",
        variant: "destructive"
      });
      setActiveTab('sender');
      return false;
    }

    // Validate sender phone format
    const senderPhoneValidation = validateAfricanPhone(formData.sender_phone);
    if (!senderPhoneValidation.isValid) {
      toast({
        title: "Invalid Sender Phone",
        description: senderPhoneValidation.error || "Please enter a valid African phone number with country code",
        variant: "destructive"
      });
      setActiveTab('sender');
      return false;
    }

    if (!formData.sender_address.trim()) {
      toast({
        title: "Validation Error",
        description: "Sender address is required",
        variant: "destructive"
      });
      setActiveTab('sender');
      return false;
    }

    // Recipient validation
    if (!formData.recipient_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Recipient name is required",
        variant: "destructive"
      });
      setActiveTab('recipient');
      return false;
    }

    if (!formData.recipient_phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Recipient phone is required",
        variant: "destructive"
      });
      setActiveTab('recipient');
      return false;
    }

    // Validate recipient phone format
    const recipientPhoneValidation = validateAfricanPhone(formData.recipient_phone);
    if (!recipientPhoneValidation.isValid) {
      toast({
        title: "Invalid Recipient Phone",
        description: recipientPhoneValidation.error || "Please enter a valid African phone number with country code",
        variant: "destructive"
      });
      setActiveTab('recipient');
      return false;
    }

    if (!formData.recipient_address.trim()) {
      toast({
        title: "Validation Error",
        description: "Recipient address is required",
        variant: "destructive"
      });
      setActiveTab('recipient');
      return false;
    }

    // Package validation
    if (!formData.qr_code.trim()) {
      toast({
        title: "Validation Error",
        description: "QR code is required. Click 'Generate QR Code' button.",
        variant: "destructive"
      });
      setActiveTab('package');
      return false;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Package description is required",
        variant: "destructive"
      });
      setActiveTab('package');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in to continue",
          variant: "destructive"
        });
        return;
      }

      const packageID = generatePackageID();

      // Clean phone numbers before submitting
      const senderPhoneValidation = validateAfricanPhone(formData.sender_phone);
      const recipientPhoneValidation = validateAfricanPhone(formData.recipient_phone);

      const packageData = {
        package_id: packageID,
        qr_code: formData.qr_code,
        tracking_number: formData.tracking_number || packageID,
        
        // Sender
        sender_name: formData.sender_name,
        sender_phone: senderPhoneValidation.cleanedPhone || formData.sender_phone,
        sender_address: formData.sender_address,
        sender_kivro_address: formData.sender_kivro_address || null,
        
        // Recipient
        recipient_name: formData.recipient_name,
        recipient_phone: recipientPhoneValidation.cleanedPhone || formData.recipient_phone,
        recipient_address: formData.recipient_address,
        recipient_kivro_address: formData.recipient_kivro_address || null,
        
        // Package details
        package_type: formData.package_type,
        description: formData.description,
        weight: parseFloat(formData.weight) || 0,
        dimensions: formData.dimensions || null,
        declared_value: parseFloat(formData.declared_value) || 0,
        
        // Delivery
        pickup_date: formData.pickup_date || null,
        estimated_delivery_date: formData.delivery_date || null,
        special_instructions: formData.special_instructions || null,
        
        // Status
        status: formData.status,
        payment_status: formData.payment_status,
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        
        // Metadata
        created_by: session.user.id
      };

      const response = await fetch(API_ENDPOINTS.PACKAGES.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(packageData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "✅ Package Created",
          description: `Package ${packageID} has been created successfully`
        });
        onSuccess();
        handleClose();
      } else {
        throw new Error(data.message || 'Failed to create package');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create package. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      sender_name: '',
      sender_phone: '',
      sender_address: '',
      sender_kivro_address: '',
      recipient_name: '',
      recipient_phone: '',
      recipient_address: '',
      recipient_kivro_address: '',
      package_type: 'General',
      description: '',
      weight: '',
      dimensions: '',
      declared_value: '',
      pickup_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      special_instructions: '',
      qr_code: '',
      tracking_number: '',
      status: 'pending',
      payment_status: 'pending',
      delivery_fee: ''
    });
    setActiveTab('sender');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Package className="h-6 w-6 text-green-600" />
            Create New Package
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sender" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Sender Info
            </TabsTrigger>
            <TabsTrigger value="recipient" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Recipient Info
            </TabsTrigger>
            <TabsTrigger value="package" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Package Details
            </TabsTrigger>
          </TabsList>

          {/* Sender Information Tab */}
          <TabsContent value="sender" className="space-y-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Sender Information</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Enter the details of the person or business sending the package
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sender_name">Sender Name *</Label>
                <Input
                  id="sender_name"
                  placeholder="John Doe"
                  value={formData.sender_name}
                  onChange={(e) => handleInputChange('sender_name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="sender_phone">Sender Phone *</Label>
                <Input
                  id="sender_phone"
                  placeholder="+252 61 234 5678"
                  value={formData.sender_phone}
                  onChange={(e) => handleInputChange('sender_phone', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="sender_address">Sender Address *</Label>
                <Textarea
                  id="sender_address"
                  placeholder="Street address, city, region"
                  rows={2}
                  value={formData.sender_address}
                  onChange={(e) => handleInputChange('sender_address', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="sender_kivro_address">Sender KIVRO Address (Optional)</Label>
                <Input
                  id="sender_kivro_address"
                  placeholder="KV-ABC123 or full KIVRO address"
                  value={formData.sender_kivro_address}
                  onChange={(e) => handleInputChange('sender_kivro_address', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  If sender has a KIVRO digital address, enter it here for precise pickup
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Recipient Information Tab */}
          <TabsContent value="recipient" className="space-y-4 mt-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Recipient Information</p>
                  <p className="text-sm text-green-700 mt-1">
                    Enter the details of the person receiving the package
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipient_name">Recipient Name *</Label>
                <Input
                  id="recipient_name"
                  placeholder="Jane Smith"
                  value={formData.recipient_name}
                  onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="recipient_phone">Recipient Phone *</Label>
                <Input
                  id="recipient_phone"
                  placeholder="+252 61 987 6543"
                  value={formData.recipient_phone}
                  onChange={(e) => handleInputChange('recipient_phone', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="recipient_address">Recipient Address *</Label>
                <Textarea
                  id="recipient_address"
                  placeholder="Delivery address, city, region"
                  rows={2}
                  value={formData.recipient_address}
                  onChange={(e) => handleInputChange('recipient_address', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="recipient_kivro_address">Recipient KIVRO Address (Optional)</Label>
                <Input
                  id="recipient_kivro_address"
                  placeholder="KV-XYZ789 or full KIVRO address"
                  value={formData.recipient_kivro_address}
                  onChange={(e) => handleInputChange('recipient_kivro_address', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  If recipient has a KIVRO digital address, enter it here for precise delivery
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Package Details Tab */}
          <TabsContent value="package" className="space-y-4 mt-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-purple-900">Package Details</p>
                  <p className="text-sm text-purple-700 mt-1">
                    Provide information about the package contents and delivery
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code and Tracking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qr_code">QR Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="qr_code"
                    placeholder="PKG-1234567890-ABC"
                    value={formData.qr_code}
                    onChange={(e) => handleInputChange('qr_code', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateQRCode}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="tracking_number">Tracking Number (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tracking_number"
                    placeholder="TRK1234567890ABC"
                    value={formData.tracking_number}
                    onChange={(e) => handleInputChange('tracking_number', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateTrackingNumber}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            {/* Package Type and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="package_type">Package Type</Label>
                <select
                  id="package_type"
                  value={formData.package_type}
                  onChange={(e) => handleInputChange('package_type', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {PACKAGE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dimensions">Dimensions (L x W x H cm)</Label>
                <Input
                  id="dimensions"
                  placeholder="30 x 20 x 10"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="declared_value">Declared Value ($)</Label>
                <Input
                  id="declared_value"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.declared_value}
                  onChange={(e) => handleInputChange('declared_value', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Package Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the package contents..."
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            {/* Delivery Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickup_date">Pickup Date</Label>
                <Input
                  id="pickup_date"
                  type="date"
                  value={formData.pickup_date}
                  onChange={(e) => handleInputChange('pickup_date', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="delivery_date">Estimated Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                />
              </div>
            </div>

            {/* Status and Payment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {PACKAGE_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="payment_status">Payment Status</Label>
                <select
                  id="payment_status"
                  value={formData.payment_status}
                  onChange={(e) => handleInputChange('payment_status', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {PAYMENT_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="delivery_fee">Delivery Fee ($)</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.delivery_fee}
                  onChange={(e) => handleInputChange('delivery_fee', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="special_instructions">Special Instructions (Optional)</Label>
              <Textarea
                id="special_instructions"
                placeholder="Any special handling or delivery instructions..."
                rows={2}
                value={formData.special_instructions}
                onChange={(e) => handleInputChange('special_instructions', e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {activeTab === 'sender' && 'Step 1 of 3: Sender Information'}
            {activeTab === 'recipient' && 'Step 2 of 3: Recipient Information'}
            {activeTab === 'package' && 'Step 3 of 3: Package Details'}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Package
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
