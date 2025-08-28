import { useEffect, useRef, useCallback } from 'react';
import { useModalProtection } from './useModalProtection';

interface UseImprovedTabAwareDataOptions {
  onTabActive?: () => void;
  onTabInactive?: () => void;
  refreshThreshold?: number; // milliseconds
  enableAutoRefresh?: boolean;
}

export const useImprovedTabAwareData = ({
  onTabActive,
  onTabInactive,
  refreshThreshold = 5 * 60 * 1000, // 5 minutes default
  enableAutoRefresh = false
}: UseImprovedTabAwareDataOptions = {}) => {
  const lastActiveTimeRef = useRef(Date.now());
  const isTabActiveRef = useRef(!document.hidden);
  const timeAwayRef = useRef(0);
  const { canRefresh } = useModalProtection();

  const handleVisibilityChange = useCallback(() => {
    const isNowVisible = document.visibilityState === 'visible';
    
    if (isNowVisible && !isTabActiveRef.current) {
      // Tab became active - calculate real time away
      const currentTime = Date.now();
      timeAwayRef.current = currentTime - lastActiveTimeRef.current;
      
      // Only refresh if auto refresh is enabled, enough time has passed, and no modals are open
      if (enableAutoRefresh && timeAwayRef.current > refreshThreshold && canRefresh()) {
        onTabActive?.();
      }
      
      isTabActiveRef.current = true;
    } else if (!isNowVisible && isTabActiveRef.current) {
      // Tab became inactive - record the time
      lastActiveTimeRef.current = Date.now();
      isTabActiveRef.current = false;
      onTabInactive?.();
    }
  }, [onTabActive, onTabInactive, refreshThreshold, enableAutoRefresh, canRefresh]);

  useEffect(() => {
    // Set initial state based on current visibility
    isTabActiveRef.current = document.visibilityState === 'visible';
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  const getTimeAway = useCallback(() => {
    if (isTabActiveRef.current) {
      return 0; // Currently active
    }
    return Date.now() - lastActiveTimeRef.current;
  }, []);

  const forceRefresh = useCallback(() => {
    if (canRefresh()) {
      onTabActive?.();
    }
  }, [onTabActive, canRefresh]);

  return {
    isTabActive: isTabActiveRef.current,
    getTimeAway,
    getRealTimeAway: () => timeAwayRef.current,
    forceRefresh,
    canRefresh: canRefresh()
  };
};