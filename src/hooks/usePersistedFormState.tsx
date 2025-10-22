import { useState, useEffect, useCallback } from 'react';
import { StorageEncryption } from '@/lib/encryption';

interface UsePersistedFormStateOptions<T> {
  key: string;
  initialState: T;
  ttl?: number; // Time to live in milliseconds (default: 24 hours)
  encrypt?: boolean; // Encrypt sensitive form data
}

export function usePersistedFormState<T>(
  options: UsePersistedFormStateOptions<T>
) {
  const { ttl = 24 * 60 * 60 * 1000, key, initialState, encrypt = true } = options; // 24 hours, encrypt by default
  
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return initialState;
      
      // For encrypted data, we'll load it async in useEffect
      if (encrypt && StorageEncryption.isEncrypted(item)) {
        return initialState;
      }
      
      const parsed = JSON.parse(item);
      
      // Check if data has expired
      if (parsed.timestamp && Date.now() - parsed.timestamp > ttl) {
        localStorage.removeItem(key);
        return initialState;
      }
      
      // Deserialize dates from strings
      const deserializedData = deserializeDates(parsed.data || initialState);
      return deserializedData;
    } catch (error) {
      console.warn('Failed to load persisted form state:', error);
      return initialState;
    }
  });

  // Helper function to recursively convert date strings back to Date objects
  const deserializeDates = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    
    // If it's a date string in ISO format, convert to Date
    if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      return new Date(obj);
    }
    
    // If it's an object, recursively process its properties
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      const result: any = {};
      for (const key in obj) {
        if (key === 'deliveryDeadline' && obj[key]) {
          // Specifically handle deliveryDeadline field
          result[key] = typeof obj[key] === 'string' ? new Date(obj[key]) : obj[key];
        } else {
          result[key] = deserializeDates(obj[key]);
        }
      }
      return result;
    }
    
    // If it's an array, recursively process its items
    if (Array.isArray(obj)) {
      return obj.map(item => deserializeDates(item));
    }
    
    return obj;
  };

  // Handle async decryption on mount
  useEffect(() => {
    if (!encrypt) return;
    
    const loadEncryptedData = async () => {
      try {
        const item = localStorage.getItem(key);
        if (!item || !StorageEncryption.isEncrypted(item)) return;
        
        const decryptedData = await StorageEncryption.decrypt(item);
        const parsed = JSON.parse(decryptedData);
        
        // Check if data has expired
        if (parsed.timestamp && Date.now() - parsed.timestamp > ttl) {
          localStorage.removeItem(key);
          return;
        }
        
        // Deserialize dates from strings
        const deserializedData = deserializeDates(parsed.data || initialState);
        setState(deserializedData);
      } catch (error) {
        console.warn('Failed to decrypt form data:', error);
        localStorage.removeItem(key);
      }
    };
    
    loadEncryptedData();
  }, [key, ttl, encrypt]);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    const persistData = async () => {
      try {
        const dataToStore = {
          data: state,
          timestamp: Date.now()
        };
        
        let dataString = JSON.stringify(dataToStore);
        
        // Encrypt sensitive form data
        if (encrypt) {
          dataString = await StorageEncryption.encrypt(dataString);
        }
        
        localStorage.setItem(key, dataString);
      } catch (error) {
        console.warn('Failed to persist form state:', error);
      }
    };
    
    persistData();
  }, [state, key, encrypt]);

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
      
      // For encrypted data, assume it's valid if it exists
      if (encrypt && StorageEncryption.isEncrypted(item)) {
        return true;
      }
      
      const parsed = JSON.parse(item);
      return parsed.timestamp && Date.now() - parsed.timestamp <= ttl;
    } catch {
      return false;
    }
  }, [key, ttl, encrypt]);

  return {
    state,
    setState,
    clearPersistedState,
    hasPersistedData
  };
}