import { useState, useCallback } from 'react';
import { useProfileCompletion } from './useProfileCompletion';

interface ProfileBlockingState {
  hasSeenModal: boolean;
  hasClosedWithoutCompleting: boolean;
  isBlocked: boolean;
}

export const useProfileBlockingState = () => {
  const { isComplete } = useProfileCompletion();
  
  const [blockingState, setBlockingState] = useState<ProfileBlockingState>({
    hasSeenModal: false,
    hasClosedWithoutCompleting: false,
    isBlocked: false
  });

  const markModalSeen = useCallback(() => {
    setBlockingState(prev => ({
      ...prev,
      hasSeenModal: true
    }));
  }, []);

  const markClosedWithoutCompleting = useCallback(() => {
    if (!isComplete) {
      setBlockingState(prev => ({
        ...prev,
        hasClosedWithoutCompleting: true,
        isBlocked: true
      }));
    }
  }, [isComplete]);

  const clearBlockingState = useCallback(() => {
    setBlockingState({
      hasSeenModal: false,
      hasClosedWithoutCompleting: false,
      isBlocked: false
    });
  }, []);

  const shouldShowModal = useCallback(() => {
    return !isComplete && !blockingState.hasClosedWithoutCompleting;
  }, [isComplete, blockingState.hasClosedWithoutCompleting]);

  const shouldShowToast = useCallback(() => {
    return !isComplete && blockingState.hasClosedWithoutCompleting;
  }, [isComplete, blockingState.hasClosedWithoutCompleting]);

  return {
    blockingState,
    markModalSeen,
    markClosedWithoutCompleting,
    clearBlockingState,
    shouldShowModal,
    shouldShowToast,
    isProfileComplete: isComplete,
    isBlocked: !isComplete
  };
};