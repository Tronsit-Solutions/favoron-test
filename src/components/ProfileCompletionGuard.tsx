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
  const { isComplete } = useProfileCompletion();
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (!isComplete) {
      setShowModal(true);
    } else {
      onAction();
    }
  };

  const handleComplete = () => {
    setShowModal(false);
    // Small delay to ensure profile state is updated
    setTimeout(() => {
      onAction();
    }, 100);
  };

  const handleClose = () => {
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