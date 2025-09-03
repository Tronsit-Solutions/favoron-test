import { useState, useEffect, useCallback } from 'react';

interface UseStickyStateOptions<T> {
  key: string;
  initialState: T;
  ttl?: number; // Time to live in milliseconds (default: 1 hour)
}

export function useStickyState<T>(
  options: UseStickyStateOptions<T>
) {
  const { ttl = 60 * 60 * 1000, key, initialState } = options; // 1 hour
  
  const [state, setState] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return initialState;
      
      const parsed = JSON.parse(item);
      
      // Check if data has expired
      if (parsed.timestamp && Date.now() - parsed.timestamp > ttl) {
        sessionStorage.removeItem(key);
        return initialState;
      }
      
      return parsed.data || initialState;
    } catch (error) {
      console.warn('Failed to load sticky state:', error);
      return initialState;
    }
  });

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      const dataToStore = {
        data: state,
        timestamp: Date.now()
      };
      sessionStorage.setItem(key, JSON.stringify(dataToStore));
    } catch (error) {
      console.warn('Failed to persist sticky state:', error);
    }
  }, [state, key]);

  const clearStickyState = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
      setState(initialState);
    } catch (error) {
      console.warn('Failed to clear sticky state:', error);
    }
  }, [key, initialState]);

  const hasStickyData = useCallback(() => {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return false;
      
      const parsed = JSON.parse(item);
      return parsed.timestamp && Date.now() - parsed.timestamp <= ttl;
    } catch {
      return false;
    }
  }, [key, ttl]);

  return {
    state,
    setState,
    clearStickyState,
    hasStickyData
  };
}