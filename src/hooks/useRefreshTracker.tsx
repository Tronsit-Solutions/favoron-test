import { useCallback } from 'react';

/**
 * EMERGENCY DEBUG: Add this to any component to track what's causing refreshes
 */
export const useRefreshTracker = (componentName: string) => {
  const trackRender = useCallback(() => {
    console.log(`🔍 REFRESH TRACKER: ${componentName} rendered at ${new Date().toISOString()}`);
    console.trace(`Stack trace for ${componentName} render`);
  }, [componentName]);

  // Track every render
  trackRender();

  return { trackRender };
};