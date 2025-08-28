import { useEffect, useRef, useCallback } from 'react';

interface UseTabAwareDataOptions {
  onTabActive?: () => void;
  onTabInactive?: () => void;
  refreshOnReturn?: boolean;
  refreshThreshold?: number; // milliseconds
}

export const useTabAwareData = ({
  onTabActive,
  onTabInactive,
  refreshOnReturn = false,
  refreshThreshold = 60000 // 1 minute
}: UseTabAwareDataOptions = {}) => {
  const lastActiveTimeRef = useRef(Date.now());
  const isTabActiveRef = useRef(true);

  const handleVisibilityChange = useCallback(() => {
    const isNowVisible = !document.hidden;
    
    if (isNowVisible && !isTabActiveRef.current) {
      // Tab became active
      const timeAway = Date.now() - lastActiveTimeRef.current;
      
      if (refreshOnReturn && timeAway > refreshThreshold) {
        onTabActive?.();
      }
      
      isTabActiveRef.current = true;
    } else if (!isNowVisible && isTabActiveRef.current) {
      // Tab became inactive
      lastActiveTimeRef.current = Date.now();
      isTabActiveRef.current = false;
      onTabInactive?.();
    }
  }, [onTabActive, onTabInactive, refreshOnReturn, refreshThreshold]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    isTabActive: isTabActiveRef.current,
    getTimeAway: () => Date.now() - lastActiveTimeRef.current
  };
};