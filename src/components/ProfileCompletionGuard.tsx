import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ProfileCompletionModal from "./ProfileCompletionModal";
import { validateWhatsAppNumber } from "@/lib/validators";

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
  onAction: () => void;
  title?: string;
  description?: string;
  requirePhoneNumber?: boolean;
}

const ProfileCompletionGuard = ({ 
  children, 
  onAction, 
  title,
  description,
  requirePhoneNumber = true 
}: ProfileCompletionGuardProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [hasClosedModal, setHasClosedModal] = useState(false);

  const isProfileComplete = () => {
    if (!profile) {
      console.log('❌ No profile found');
      return false;
    }

    // Check required fields
    const requiredFields = ['first_name', 'last_name', 'phone_number'];
    const missingFields = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return !value || value.toString().trim() === '';
    });

    // Special WhatsApp validation
    if (profile.phone_number) {
      const phoneValidation = validateWhatsAppNumber(profile.phone_number);
      if (!phoneValidation.isValid) {
        console.log('❌ WhatsApp validation failed:', phoneValidation.error);
        return false;
      }
    } else {
      console.log('❌ No phone number provided');
      return false;
    }

    const isComplete = missingFields.length === 0;
    console.log('🔍 Profile completion check:', {
      isComplete,
      missingFields,
      phone: profile.phone_number,
      firstName: profile.first_name,
      lastName: profile.last_name
    });

    return isComplete;
  };

  const handleClick = () => {
    console.log('🖱️ ProfileCompletionGuard clicked');
    
    if (!isProfileComplete()) {
      console.log('❌ Profile incomplete - showing modal');
      
      if (hasClosedModal) {
        // User already closed modal before, show toast
        toast({
          title: "WhatsApp obligatorio",
          description: "Necesitas un número de WhatsApp válido para usar esta función. Ve a tu perfil para agregarlo.",
          variant: "destructive"
        });
      } else {
        // Show modal
        setShowModal(true);
      }
    } else {
      console.log('✅ Profile complete - executing action');
      setHasClosedModal(false); // Reset modal state
      onAction();
    }
  };

  const handleComplete = () => {
    console.log('✅ Profile completion modal completed');
    setShowModal(false);
    setHasClosedModal(false); // Reset since user completed profile
    
    // Small delay to ensure profile state is updated
    setTimeout(() => {
      if (isProfileComplete()) {
        console.log('✅ Profile validated after completion - executing action');
        onAction();
      } else {
        console.log('❌ Profile still incomplete after modal');
      }
    }, 100);
  };

  const handleClose = () => {
    console.log('❌ Profile completion modal closed without completion');
    setHasClosedModal(true); // Mark that user has closed modal
    setShowModal(false);
  };

  // Reset modal state when profile changes
  useEffect(() => {
    if (isProfileComplete()) {
      setHasClosedModal(false);
    }
  }, [profile]);

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>
      
      <ProfileCompletionModal
        isOpen={showModal}
        onClose={handleClose}
        onComplete={handleComplete}
        title={title}
        description={description}
      />
    </>
  );
};

export default ProfileCompletionGuard;