import { useCallback } from 'react';
import { useProfileCompletion } from './useProfileCompletion';
import { useUrlState } from './useUrlState';

export const useProtectedNavigation = () => {
  const { isComplete } = useProfileCompletion();
  const { navigateToForm: originalNavigateToForm } = useUrlState();

  const navigateToFormWithProfileCheck = useCallback((formType: 'package' | 'trip', onProfileIncomplete?: () => void) => {
    // Always navigate to the form (no longer blocking)
    originalNavigateToForm(formType);
    
    // Optionally show a reminder if profile is incomplete
    if (!isComplete && onProfileIncomplete) {
      onProfileIncomplete();
    }
  }, [isComplete, originalNavigateToForm]);

  return {
    navigateToFormWithProfileCheck,
    isProfileComplete: isComplete
  };
};