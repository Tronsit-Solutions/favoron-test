import { useState, useEffect } from "react";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import ProfileCompletionModal from "./ProfileCompletionModal";

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
  const { isComplete, missingFields } = useProfileCompletion();
  const [showModal, setShowModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const strictValidation = () => {
    setIsValidating(true);
    
    // Double-check completion status with debug logging
    console.log('🛡️ ProfileCompletionGuard strict validation:', {
      isComplete,
      missingFields,
      requirePhoneNumber,
      timestamp: new Date().toISOString()
    });
    
    const isReallyComplete = isComplete && missingFields.length === 0;
    
    if (!isReallyComplete) {
      console.log('❌ Strict validation failed - profile incomplete:', {
        isComplete,
        missingFields,
        requirePhoneNumber
      });
    } else {
      console.log('✅ Strict validation passed - profile complete');
    }
    
    setIsValidating(false);
    return isReallyComplete;
  };

  const handleClick = () => {
    console.log('🖱️ ProfileCompletionGuard clicked:', {
      isComplete,
      missingFields,
      actionName: onAction.name || 'anonymous'
    });
    
    // Perform strict validation on click
    if (!strictValidation()) {
      console.log('🚫 Showing completion modal due to failed validation');
      setShowModal(true);
    } else {
      console.log('✅ Allowing action to proceed');
      onAction();
    }
  };

  const handleComplete = () => {
    console.log('✅ Profile completion modal completed');
    setShowModal(false);
    // Small delay to ensure profile state is updated
    setTimeout(() => {
      // Re-validate before proceeding
      if (strictValidation()) {
        console.log('✅ Profile validated after completion - executing action');
        onAction();
      } else {
        console.log('❌ Profile still incomplete after modal - keeping modal closed but not executing action');
      }
    }, 100);
  };

  const handleClose = () => {
    console.log('❌ Profile completion modal closed without completion');
    setShowModal(false);
  };

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