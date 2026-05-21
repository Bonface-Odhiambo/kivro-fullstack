import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, Building2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditBusinessAddressModalProps {
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

const EditBusinessAddressModal: React.FC<EditBusinessAddressModalProps> = ({ isOpen, onClose, address, onUpdate }) => {
  const [companyName, setCompanyName] = useState('');
  const [buildingNumber, setBuildingNumber] = useState(address.house_number || '');
  const [landmark, setLandmark] = useState(address.landmark || '');
  const [region, setRegion] = useState(address.region || '');
  const [street, setStreet] = useState(address.district || '');
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [buildingImageFile, setBuildingImageFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState(address.company_logo_url || '');
  const [buildingImagePreview, setBuildingImagePreview] = useState(address.house_image_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setBuildingNumber(address.house_number || '');
      setLandmark(address.landmark || '');
      setRegion(address.region || '');
      setStreet(address.district || '');
      setCompanyLogoPreview(address.company_logo_url || '');
      setBuildingImagePreview(address.house_image_url || '');
      setCompanyLogoFile(null);
      setBuildingImageFile(null);
      
      // Extract company name from display_address if possible
      const addressParts = address.display_address.split(',');
      setCompanyName(addressParts[0] || '');
    }
  }, [isOpen, address]);

  const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Company logo must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setCompanyLogoFile(file);
      setCompanyLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBuildingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Building image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setBuildingImageFile(file);
      setBuildingImagePreview(URL.createObjectURL(file));
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


      // Try uploading with explicit content type
      let { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: fileType
        });
      
      // If mime type error, try without explicit contentType (let Supabase detect)
      if (uploadError && uploadError.message?.includes('mime type')) {
        const retryResult = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
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

      let buildingImageUrl = address.house_image_url;
      let companyLogoUrl = address.company_logo_url;

      // Upload building image if changed
      if (buildingImageFile) {
        setUploadProgress('Uploading building image...');
        const uploadedUrl = await uploadImage(buildingImageFile, 'house-images', 'buildings');
        if (uploadedUrl) {
          buildingImageUrl = uploadedUrl;
        } else {
          throw new Error('Failed to upload building image');
        }
      }

      // Upload company logo if changed
      if (companyLogoFile) {
        setUploadProgress('Uploading company logo...');
        const uploadedUrl = await uploadImage(companyLogoFile, 'company-logos', 'logos');
        if (uploadedUrl) {
          companyLogoUrl = uploadedUrl;
        } else {
          throw new Error('Failed to upload company logo');
        }
      }

      // Update address in database
      setUploadProgress('Updating business address...');
      const { error: updateError } = await supabase
        .from('kivro_addresses')
        .update({
          house_number: buildingNumber || null,
          landmark: landmark || null,
          region: region || null,
          district: street || null,
          house_image_url: buildingImageUrl,
          company_logo_url: companyLogoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', address.id)
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

      toast({
        title: "✅ Business Address Updated",
        description: "Your business address details have been successfully updated.",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update business address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress('');
    }
  };

  const removeCompanyLogo = () => {
    setCompanyLogoFile(null);
    setCompanyLogoPreview('');
  };

  const removeBuildingImage = () => {
    setBuildingImageFile(null);
    setBuildingImagePreview('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Edit Business Address
          </DialogTitle>
          <DialogDescription>
            Update your business details, location, and branding for {address.kivro_code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Address Display */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <Label className="text-xs font-medium text-purple-600">KIVRO Business Address</Label>
            <p className="text-sm font-semibold text-purple-800">{address.display_address}</p>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Company/Business Name</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="e.g., ABC Trading Company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your registered business or company name
            </p>
          </div>

          {/* Region and Street */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region/City</Label>
              <Input
                id="region"
                type="text"
                placeholder="e.g., Mogadishu, Hargeisa"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Street/District</Label>
              <Input
                id="street"
                type="text"
                placeholder="e.g., Hamar Weyne, Wadada Maka"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
          </div>

          {/* Building Number */}
          <div className="space-y-2">
            <Label htmlFor="buildingNumber">Building/Office Number</Label>
            <Input
              id="buildingNumber"
              type="text"
              placeholder="e.g., Building 5, Suite 201, Floor 3"
              value={buildingNumber}
              onChange={(e) => setBuildingNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Building number, suite, or floor information
            </p>
          </div>

          {/* Landmark */}
          <div className="space-y-2">
            <Label htmlFor="landmark">Location Description & Landmarks</Label>
            <Textarea
              id="landmark"
              placeholder="e.g., Next to Central Bank, opposite the main market, near the blue building"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Describe your business location and nearby landmarks for easy identification
            </p>
          </div>

          {/* Company Logo Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              Company Logo
            </Label>
            
            {companyLogoPreview ? (
              <div className="relative">
                <img
                  src={companyLogoPreview}
                  alt="Company Logo"
                  className="w-full h-24 sm:h-32 object-contain rounded-lg border bg-white p-2 sm:p-4"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeCompanyLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center bg-purple-50">
                <Building2 className="h-12 w-12 mx-auto text-purple-400 mb-2" />
                <p className="text-sm text-purple-600 mb-2">Upload your company logo</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCompanyLogoChange}
                  className="hidden"
                  id="companyLogoInput"
                />
                <Label htmlFor="companyLogoInput" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild className="border-purple-300">
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Logo
                    </span>
                  </Button>
                </Label>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Max file size: 5MB. Recommended: Square logo with transparent background
            </p>
          </div>

          {/* Building Image Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Building/Office Image (Optional)
            </Label>
            
            {buildingImagePreview ? (
              <div className="relative">
                <img
                  src={buildingImagePreview}
                  alt="Building"
                  className="w-full h-40 sm:h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeBuildingImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload a photo of your building or office</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleBuildingImageChange}
                  className="hidden"
                  id="buildingImageInput"
                />
                <Label htmlFor="buildingImageInput" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </span>
                  </Button>
                </Label>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Max file size: 5MB. Helps customers identify your business location
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Save Business Details
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBusinessAddressModal;
