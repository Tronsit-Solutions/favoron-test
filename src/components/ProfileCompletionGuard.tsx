import { useState, useEffect } from "react";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useStrictProfileValidation } from "@/hooks/useStrictProfileValidation";
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
  const { validateProfileStrict } = useStrictProfileValidation();
  const [showModal, setShowModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const strictValidation = () => {
    setIsValidating(true);
    
    // Use the strict validation hook as primary validation
    const strictResult = validateProfileStrict();
    
    // Double-check with original hook for consistency
    const hookResult = { isComplete, missingFields };
    
    console.log('🛡️ ProfileCompletionGuard validation comparison:', {
      strictResult,
      hookResult,
      agreementOnCompletion: strictResult.isValid === isComplete,
      timestamp: new Date().toISOString()
    });
    
    // Use the most restrictive result (if either says incomplete, treat as incomplete)
    const finalIsComplete = strictResult.isValid && isComplete;
    
    if (!finalIsComplete) {
      console.log('❌ Final validation failed:', {
        strictResult,
        hookResult,
        finalIsComplete
      });
    } else {
      console.log('✅ Final validation passed - profile complete');
    }
    
    setIsValidating(false);
    return finalIsComplete;
  };

  const handleClick = () => {
    // Prevent rapid clicking during validation
    if (isValidating) {
      console.log('🚫 Click ignored - validation in progress');
      return;
    }

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
      <div 
        onClick={handleClick} 
        className={`cursor-pointer ${isValidating ? 'opacity-50 pointer-events-none' : ''}`}
      >
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