import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ProfileCompletionModal from "./ProfileCompletionModal";
import { useStrictProfileValidation } from "@/hooks/useStrictProfileValidation";

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
  const { validateProfileStrict } = useStrictProfileValidation();
  const [showModal, setShowModal] = useState(false);
  const [hasClosedModal, setHasClosedModal] = useState(false);

  const isProfileComplete = () => {
    const validation = validateProfileStrict();
    return validation.isValid;
  };

  const handleClick = () => {
    console.log('🖱️ ProfileCompletionGuard clicked');
    
    if (!isProfileComplete()) {
      console.log('❌ Profile incomplete - showing modal');
      
      if (hasClosedModal) {
        // User already closed modal before, show toast
        const validation = validateProfileStrict();
        const missingFieldsText = validation.missingFields?.join(', ') || 'información requerida';
        toast({
          title: "Perfil incompleto",
          description: `Necesitas completar: ${missingFieldsText}. Ve a tu perfil para completar la información.`,
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