import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const useNavigationTracker = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const prevLocationRef = useRef(location);

  useEffect(() => {
    const prevLocation = prevLocationRef.current;
    
    // Track navigation changes
    if (prevLocation.pathname !== location.pathname) {
      console.log('🧭 Navigation detected:', {
        from: prevLocation.pathname,
        to: location.pathname,
        type: navigationType,
        timestamp: new Date().toISOString()
      });
    }
    
    // Track state changes on same route
    if (prevLocation.pathname === location.pathname && prevLocation.search !== location.search) {
      console.log('🔄 Search params changed:', {
        route: location.pathname,
        oldSearch: prevLocation.search,
        newSearch: location.search,
        timestamp: new Date().toISOString()
      });
    }

    prevLocationRef.current = location;
  }, [location, navigationType]);

  // Track tab visibility changes that might cause navigation
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('👁️ Tab visibility changed:', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        currentRoute: location.pathname,
        timestamp: new Date().toISOString()
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [location.pathname]);

  return {
    currentLocation: location,
    navigationType
  };
};