import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, Image as ImageIcon, MapPin, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: {
    id: string;
    kivro_code: string;
    display_address: string;
    house_number?: string;
    house_image_url?: string;
    company_logo_url?: string;
    landmark?: string;
    region: string;
    district?: string;
  };
  onUpdate: () => void;
}

const EditAddressModal: React.FC<EditAddressModalProps> = ({ isOpen, onClose, address, onUpdate }) => {
  const [houseNumber, setHouseNumber] = useState(address.house_number || '');
  const [landmark, setLandmark] = useState(address.landmark || '');
  const [region, setRegion] = useState(address.region || '');
  const [street, setStreet] = useState(address.district || '');
  const [houseImageFile, setHouseImageFile] = useState<File | null>(null);
  const [houseImagePreview, setHouseImagePreview] = useState(address.house_image_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setHouseNumber(address.house_number || '');
      setLandmark(address.landmark || '');
      setRegion(address.region || '');
      setStreet(address.district || '');
      setHouseImagePreview(address.house_image_url || '');
      setHouseImageFile(null);
    }
  }, [isOpen, address]);

  const handleHouseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "House image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setHouseImageFile(file);
      setHouseImagePreview(URL.createObjectURL(file));
    }
  };


  const uploadImage = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      // Ensure we have a valid file type
      const fileType = file.type || 'image/jpeg';
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${session.user.id}/${address.id}_${Date.now()}.${fileExt}`;


      // First, check if bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      // Check bucket details
      const houseBucket = buckets?.find(b => b.id === 'house-images');

      // Try uploading with minimal options first
      let { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: true
        });
      
      
      // If failed, try with contentType
      if (uploadError) {
        const retryResult = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: fileType
          });
        
        uploadError = retryResult.error;
        data = retryResult.data;
        
        
        if (!uploadError) {
        }
      }
      
      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      
      // Provide more specific error message
      if (error.message?.includes('mime type')) {
        toast({
          title: "Upload Failed",
          description: "Image format not supported. Please use JPG, PNG, or WebP.",
          variant: "destructive",
        });
      }
      
      return null;
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setUploadProgress('Saving changes...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      let houseImageUrl = address.house_image_url;

      // Upload house image if changed
      if (houseImageFile) {
        setUploadProgress('Uploading house image...');
        const uploadedUrl = await uploadImage(houseImageFile, 'house-images', 'houses');
        if (uploadedUrl) {
          houseImageUrl = uploadedUrl;
        } else {
          throw new Error('Failed to upload house image');
        }
      }

      // Update address in database
      setUploadProgress('Updating address...');
      const { error: updateError } = await supabase
        .from('kivro_addresses')
        .update({
          house_number: houseNumber || null,
          landmark: landmark || null,
          region: region || null,
          district: street || null,
          house_image_url: houseImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', address.id)
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

      toast({
        title: "✅ Personal Address Updated",
        description: "Your personal address details have been successfully updated.",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress('');
    }
  };

  const removeHouseImage = () => {
    setHouseImageFile(null);
    setHouseImagePreview('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Edit Personal Address
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Update your personal address details for {address.kivro_code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Region and Street - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="region" className="text-sm font-medium text-gray-900">Region/City</Label>
              <Input
                id="region"
                type="text"
                placeholder="Togdheer"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-10 border-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="street" className="text-sm font-medium text-gray-900">Street/District</Label>
              <Input
                id="street"
                type="text"
                placeholder="Burco"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="h-10 border-gray-300"
              />
            </div>
          </div>

          {/* House Number */}
          <div className="space-y-1.5">
            <Label htmlFor="houseNumber" className="text-sm font-medium text-gray-900">House/Building Number</Label>
            <Input
              id="houseNumber"
              type="text"
              placeholder="Add your physical house or building number, e.g 123 A-57, Villa 7"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              className="h-10 border-gray-300"
            />
          </div>

          {/* Landmark */}
          <div className="space-y-1.5">
            <Label htmlFor="landmark" className="text-sm font-medium text-gray-900">Landmark/Additional Details</Label>
            <p className="text-xs text-gray-500">
              Describe nearby landmarks or additional directions
            </p>
            <Input
              id="landmark"
              type="text"
              placeholder="Near Burco Central Area"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="h-10 border-gray-300"
            />
          </div>
          {/* House Image Upload */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-900">House Image</Label>
            
            {houseImagePreview ? (
              <div className="relative">
                <img
                  src={houseImagePreview}
                  alt="House"
                  className="w-full h-40 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeHouseImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-green-300 rounded-lg py-12 text-center hover:border-green-400 transition-colors cursor-pointer">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleHouseImageChange}
                  className="hidden"
                  id="houseImageInput"
                />
                <Label htmlFor="houseImageInput" className="cursor-pointer">
                  <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Upload a photo of your house</p>
                </Label>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Max file size: 5MB. Supported formats: JPG, PNG, WebP
            </p>
          </div>

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-800">{uploadProgress}</span>
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAddressModal;
