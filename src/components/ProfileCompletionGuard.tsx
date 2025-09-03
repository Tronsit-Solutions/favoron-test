import { useState, useEffect } from "react";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useStrictProfileValidation } from "@/hooks/useStrictProfileValidation";
import { useProfileBlockingState } from "@/hooks/useProfileBlockingState";
import { useToast } from "@/hooks/use-toast";
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
  const { 
    shouldShowModal, 
    shouldShowToast, 
    markModalSeen, 
    markClosedWithoutCompleting,
    clearBlockingState,
    isBlocked 
  } = useProfileBlockingState();
  const { toast } = useToast();
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
      if (shouldShowToast()) {
        // User already saw and closed the modal, show toast instead
        toast({
          title: "Perfil incompleto",
          description: "Completa tu perfil para solicitar paquetes o registrar viajes. Ve a tu perfil para completar la información.",
          variant: "destructive"
        });
      } else if (shouldShowModal()) {
        // First time or haven't closed modal yet, show modal
        console.log('🚫 Showing completion modal due to failed validation');
        markModalSeen();
        setShowModal(true);
      }
    } else {
      console.log('✅ Allowing action to proceed');
      clearBlockingState(); // Clear any blocking state when profile is complete
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
    markClosedWithoutCompleting();
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