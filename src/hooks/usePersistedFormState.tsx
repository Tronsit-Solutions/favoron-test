import { useRef, useCallback } from 'react';

interface UsePersistedFormStateOptions<T> {
  key: string;
  initialState: T;
  ttl?: number; // Time to live in milliseconds (default: 24 hours)
}

export function usePersistedFormState<T>(
  options: UsePersistedFormStateOptions<T>
) {
  const { ttl = 24 * 60 * 60 * 1000, key, initialState } = options; // 24 hours
  
  // Initialize state from localStorage once
  const getInitialState = (): T => {
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
  };

  // Use ref to store current state without causing re-renders
  const currentState = useRef<T>(getInitialState());

  // Debounced persistence using timeout ref
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  // Direct persistence function that doesn't cause re-renders
  const persistState = useCallback((newState: T) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce persistence by 300ms
    timeoutRef.current = setTimeout(() => {
      try {
        const dataToStore = {
          data: newState,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(dataToStore));
      } catch (error) {
        console.warn('Failed to persist form state:', error);
      }
    }, 300);
  }, [key]);

  // Stable setState that updates ref and persists
  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    const updatedState = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(currentState.current)
      : newState;
    
    currentState.current = updatedState;
    persistState(updatedState);
    
    return updatedState;
  }, [persistState]);

  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(key);
      currentState.current = initialState;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
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

  // Get current state without triggering re-renders
  const getState = useCallback(() => currentState.current, []);

  return {
    state: currentState.current,
    setState,
    getState,
    clearPersistedState,
    hasPersistedData
  };
}