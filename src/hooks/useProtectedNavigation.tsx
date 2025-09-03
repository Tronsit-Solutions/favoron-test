import { useCallback } from 'react';
import { useProfileCompletion } from './useProfileCompletion';
import { useUrlState } from './useUrlState';

export const useProtectedNavigation = () => {
  const { isComplete } = useProfileCompletion();
  const { navigateToForm: originalNavigateToForm } = useUrlState();

  const navigateToFormWithProfileCheck = useCallback((formType: 'package' | 'trip', onProfileIncomplete?: () => void) => {
    if (isComplete) {
      originalNavigateToForm(formType);
    } else if (onProfileIncomplete) {
      onProfileIncomplete();
    }
  }, [isComplete, originalNavigateToForm]);

  return {
    navigateToFormWithProfileCheck,
    isProfileComplete: isComplete
  };
};