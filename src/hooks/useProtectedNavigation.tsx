import { useCallback } from 'react';
import { useProfileCompletion } from './useProfileCompletion';
import { useUrlState } from './useUrlState';

export const useProtectedNavigation = () => {
  const { isComplete } = useProfileCompletion();
  const { navigateToForm: originalNavigateToForm } = useUrlState();

  const navigateToFormWithProfileCheck = useCallback((formType: 'package' | 'trip', onProfileIncomplete?: () => void) => {
    // Block navigation if profile is incomplete
    if (!isComplete) {
      if (onProfileIncomplete) {
        onProfileIncomplete();
      }
      return; // Don't navigate
    }
    
    // Profile is complete, proceed with navigation
    originalNavigateToForm(formType);
  }, [isComplete, originalNavigateToForm]);

  return {
    navigateToFormWithProfileCheck,
    isProfileComplete: isComplete
  };
};