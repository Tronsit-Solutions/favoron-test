import { useEffect, useCallback } from 'react';
import { useModalState } from '@/contexts/ModalStateContext';

interface UseTabVisibilityProtectionOptions {
  onTabHidden?: () => void;
  onTabVisible?: () => void;
  preventNavigationWithModals?: boolean;
}

export const useTabVisibilityProtection = (options: UseTabVisibilityProtectionOptions = {}) => {
  const { hasOpenModals } = useModalState();
  const { 
    onTabHidden, 
    onTabVisible, 
    preventNavigationWithModals = true 
  } = options;

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      console.log('🔒 Tab hidden - preserving modal state');
      onTabHidden?.();
    } else {
      console.log('👁️ Tab visible - restoring context');
      onTabVisible?.();
    }
  }, [onTabHidden, onTabVisible]);

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (preventNavigationWithModals && hasOpenModals()) {
      e.preventDefault();
      e.returnValue = 'Tienes un modal abierto. ¿Estás seguro que quieres salir?';
      return e.returnValue;
    }
  }, [hasOpenModals, preventNavigationWithModals]);

  const handlePopState = useCallback((e: PopStateEvent) => {
    if (preventNavigationWithModals && hasOpenModals()) {
      // Prevent navigation if modals are open
      e.preventDefault();
      history.pushState(null, '', window.location.href);
      console.log('🛡️ Navigation prevented - modals are open');
    }
  }, [hasOpenModals, preventNavigationWithModals]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleVisibilityChange, handleBeforeUnload, handlePopState]);

  return {
    isTabHidden: document.hidden,
    hasOpenModals: hasOpenModals()
  };
};