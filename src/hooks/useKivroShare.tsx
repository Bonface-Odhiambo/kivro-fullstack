import { useState, useEffect } from 'react';
import KivroShareModal from '@/components/KivroShareModal';

interface UseKivroShareProps {
  url?: string;
  title?: string;
  description?: string;
  addressId?: string;
  addressData?: any;
}

export const useKivroShare = ({ 
  url = window.location.href, 
  title = "Share KIVRO Address",
  description = "Share your KIVRO address with others",
  addressId,
  addressData
}: UseKivroShareProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentDescription, setCurrentDescription] = useState(description);
  const [currentAddressId, setCurrentAddressId] = useState(addressId);
  const [currentAddressData, setCurrentAddressData] = useState(addressData);

  // Update internal state when props change
  useEffect(() => {
    setCurrentUrl(url);
  }, [url]);

  useEffect(() => {
    setCurrentTitle(title);
  }, [title]);

  useEffect(() => {
    setCurrentDescription(description);
  }, [description]);

  useEffect(() => {
    setCurrentAddressId(addressId);
  }, [addressId]);

  useEffect(() => {
    if (addressData) {
      setCurrentAddressData(addressData);
    }
  }, [addressData]);

  const openShare = (newUrl?: string, newTitle?: string, newDescription?: string) => {
    if (newUrl) setCurrentUrl(newUrl);
    if (newTitle) setCurrentTitle(newTitle);
    if (newDescription) setCurrentDescription(newDescription);
    setIsOpen(true);
  };
  
  const closeShare = () => setIsOpen(false);

  const ShareModal = () => (
    <KivroShareModal
      isOpen={isOpen}
      onClose={closeShare}
      shareUrl={currentUrl}
      title={currentTitle}
      description={currentDescription}
      addressId={currentAddressId}
      addressData={currentAddressData}
    />
  );

  return {
    openShare,
    closeShare,
    ShareModal,
    isOpen,
    updateShareData: (newUrl: string, newTitle?: string, newDescription?: string, newAddressData?: any) => {
      setCurrentUrl(newUrl);
      if (newTitle) setCurrentTitle(newTitle);
      if (newDescription) setCurrentDescription(newDescription);
      if (newAddressData) setCurrentAddressData(newAddressData);
    }
  };
};
