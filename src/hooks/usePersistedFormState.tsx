import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePersistedFormStateOptions<T> {
  key: string;
  initialState: T;
  ttl?: number; // Time to live in milliseconds (default: 24 hours)
}

export function usePersistedFormState<T>(
  options: UsePersistedFormStateOptions<T>
) {
  const { ttl = 24 * 60 * 60 * 1000, key, initialState } = options; // 24 hours
  
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return initialState;
      
      const parsed = JSON.parse(item);
      
      // Check if data has expired
      if (parsed.timestamp && Date.now() - parsed.timestamp > ttl) {
        localStorage.removeItem(key);
        return initialState;
      }
      
      return parsed.data || initialState;
    } catch (error) {
      console.warn('Failed to load persisted form state:', error);
      return initialState;
    }
  });

  // Debounced persistence to prevent excessive writes
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip persistence on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce persistence by 500ms
    timeoutRef.current = setTimeout(() => {
      try {
        const dataToStore = {
          data: state,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(dataToStore));
      } catch (error) {
        console.warn('Failed to persist form state:', error);
      }
    }, 500);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, key]);

  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setState(initialState);
    } catch (error) {
      console.warn('Failed to clear persisted form state:', error);
    }
  }, [key, initialState]);

  const hasPersistedData = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return false;
      
      const parsed = JSON.parse(item);
      return parsed.timestamp && Date.now() - parsed.timestamp <= ttl;
    } catch {
      return false;
    }
  }, [key, ttl]);

  // Stable setState wrapper
  const stableSetState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(newState);
  }, []);

  return {
    state,
    setState: stableSetState,
    clearPersistedState,
    hasPersistedData
  };
}