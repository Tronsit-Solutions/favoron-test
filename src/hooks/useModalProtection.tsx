import { useCallback } from 'react';
import { useModalState } from '@/contexts/ModalStateContext';

export const useModalProtection = () => {
  const { hasOpenModals } = useModalState();

  const shouldPreventRefresh = useCallback(() => {
    return hasOpenModals();
  }, [hasOpenModals]);

  const canRefresh = useCallback(() => {
    return !hasOpenModals();
  }, [hasOpenModals]);

  return {
    shouldPreventRefresh,
    canRefresh,
    hasOpenModals
  };
};