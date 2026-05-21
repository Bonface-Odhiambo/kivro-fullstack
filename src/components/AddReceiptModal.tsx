import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Camera,
  Upload,
  FileText,
  X,
  RefreshCw,
  Save,
  Loader2,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

interface AddReceiptModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ReceiptFormData {
  store_name: string;
  store_address: string;
  category_name: string;
  transaction_date: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  tip_amount: string;
  total_amount: string;
  currency: string;
  payment_method: string;
  card_last_four: string;
  notes: string;
}

const CATEGORIES = [
  'Grocery',
  'Restaurant',
  'Pharmacy',
  'Electronics',
  'Clothing',
  'Gas Station',
  'Healthcare',
  'Entertainment',
  'Travel',
  'Home & Garden',
  'Beauty',
  'Sports',
  'Books',
  'Other'
];

const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Mobile Payment',
  'Bank Transfer',
  'Check',
  'Other'
];

export default function AddReceiptModal({ open, onClose, onSuccess }: AddReceiptModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'scan' | 'upload' | 'manual'>('manual');
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState<ReceiptFormData>({
    store_name: '',
    store_address: '',
    category_name: 'Grocery',
    transaction_date: new Date().toISOString().split('T')[0],
    subtotal: '',
    tax_amount: '0',
    discount_amount: '0',
    tip_amount: '0',
    total_amount: '',
    currency: 'USD',
    payment_method: 'Cash',
    card_last_four: '',
    notes: ''
  });

  const handleInputChange = (field: keyof ReceiptFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate total when amounts change
    if (['subtotal', 'tax_amount', 'discount_amount', 'tip_amount'].includes(field)) {
      setTimeout(() => calculateTotal(), 0);
    }
  };

  const calculateTotal = () => {
    const subtotal = parseFloat(formData.subtotal) || 0;
    const tax = parseFloat(formData.tax_amount) || 0;
    const discount = parseFloat(formData.discount_amount) || 0;
    const tip = parseFloat(formData.tip_amount) || 0;
    
    const total = subtotal + tax - discount + tip;
    setFormData(prev => ({ ...prev, total_amount: total.toFixed(2) }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Image Uploaded",
        description: "You can now fill in the receipt details manually or let us scan it."
      });
    }
  };

  const startCamera = async () => {
    try {
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan receipts",
        variant: "destructive"
      });
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setScanning(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
            setUploadedImage(file);
            setImagePreview(canvas.toDataURL());
            stopCamera();
            setActiveTab('upload');
            
            toast({
              title: "Receipt Captured",
              description: "Fill in the details below to save your receipt"
            });
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('receipt-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipt-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      return null;
    }
  };

  const validateForm = (): boolean => {
    if (!formData.store_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Store name is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Total amount must be greater than 0",
        variant: "destructive"
      });
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

      // Upload image if exists
      let imageUrl = null;
      if (uploadedImage) {
        imageUrl = await uploadImageToStorage(uploadedImage);
      }

      // Generate receipt number
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Insert receipt
      const { error } = await supabase
        .from('receipts')
        .insert({
          user_id: session.user.id,
          receipt_number: receiptNumber,
          store_name: formData.store_name,
          store_address: formData.store_address || null,
          category_name: formData.category_name,
          transaction_date: formData.transaction_date,
          subtotal: parseFloat(formData.subtotal) || 0,
          tax_amount: parseFloat(formData.tax_amount) || 0,
          discount_amount: parseFloat(formData.discount_amount) || 0,
          tip_amount: parseFloat(formData.tip_amount) || 0,
          total_amount: parseFloat(formData.total_amount),
          currency: formData.currency,
          payment_method: formData.payment_method || null,
          card_last_four: formData.card_last_four || null,
          image_url: imageUrl,
          notes: formData.notes || null,
          status: 'active',
          is_favorite: false
        });

      if (error) throw error;

      toast({
        title: "✅ Receipt Added",
        description: `Receipt #${receiptNumber} has been saved successfully`
      });

      onSuccess();
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setFormData({
      store_name: '',
      store_address: '',
      category_name: 'Grocery',
      transaction_date: new Date().toISOString().split('T')[0],
      subtotal: '',
      tax_amount: '0',
      discount_amount: '0',
      tip_amount: '0',
      total_amount: '',
      currency: 'USD',
      payment_method: 'Cash',
      card_last_four: '',
      notes: ''
    });
    setUploadedImage(null);
    setImagePreview('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6 text-green-600" />
            Add New Receipt
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="manual" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Manual Entry</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Upload Image</span>
              <span className="sm:hidden">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Scan Receipt</span>
              <span className="sm:hidden">Scan</span>
            </TabsTrigger>
          </TabsList>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Store Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Store Information</h3>
                
                <div>
                  <Label htmlFor="store_name">Store Name *</Label>
                  <Input
                    id="store_name"
                    placeholder="e.g., Walmart, Target, Starbucks"
                    value={formData.store_name}
                    onChange={(e) => handleInputChange('store_name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="store_address">Store Address (Optional)</Label>
                  <Input
                    id="store_address"
                    placeholder="123 Main St, City, State"
                    value={formData.store_address}
                    onChange={(e) => handleInputChange('store_address', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category_name}
                    onChange={(e) => handleInputChange('category_name', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="transaction_date">Transaction Date</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => handleInputChange('transaction_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Amount Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Amount Details</h3>
                
                <div>
                  <Label htmlFor="subtotal">Subtotal *</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.subtotal}
                    onChange={(e) => handleInputChange('subtotal', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="tax_amount">Tax</Label>
                    <Input
                      id="tax_amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.tax_amount}
                      onChange={(e) => handleInputChange('tax_amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tip_amount">Tip</Label>
                    <Input
                      id="tip_amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.tip_amount}
                      onChange={(e) => handleInputChange('tip_amount', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="discount_amount">Discount</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.discount_amount}
                    onChange={(e) => handleInputChange('discount_amount', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="total_amount">Total Amount *</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.total_amount}
                    onChange={(e) => handleInputChange('total_amount', e.target.value)}
                    className="font-bold text-lg text-green-600"
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="SOS">SOS (Sh.So.)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment & Notes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Payment & Additional Info</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <select
                    id="payment_method"
                    value={formData.payment_method}
                    onChange={(e) => handleInputChange('payment_method', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="card_last_four">Card Last 4 Digits (Optional)</Label>
                  <Input
                    id="card_last_four"
                    placeholder="1234"
                    maxLength={4}
                    value={formData.card_last_four}
                    onChange={(e) => handleInputChange('card_last_four', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this receipt..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Upload Image Tab */}
          <TabsContent value="upload" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-12 text-center cursor-pointer hover:border-green-500 transition-colors"
                  >
                    <ImageIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700 mb-2">
                      Click to upload receipt image
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports JPG, PNG, PDF (Max 10MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Receipt preview"
                        className="w-full max-h-64 sm:max-h-96 object-contain rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setUploadedImage(null);
                          setImagePreview('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900">Image uploaded successfully!</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Switch to "Manual Entry" tab to fill in the receipt details and save.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setActiveTab('manual')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Continue to Fill Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scan Receipt Tab */}
          <TabsContent value="scan" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                {!scanning ? (
                  <div className="text-center py-6 sm:py-12">
                    <Camera className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Scan Receipt with Camera
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Use your device camera to capture a receipt image
                    </p>
                    <Button
                      onClick={startCamera}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Start Camera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg border"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        onClick={captureImage}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Capture Image
                      </Button>
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-yellow-900">Tips for best results:</p>
                          <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
                            <li>Ensure good lighting</li>
                            <li>Hold camera steady</li>
                            <li>Keep receipt flat and visible</li>
                            <li>Avoid shadows and glare</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.store_name || !formData.total_amount}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Receipt
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
