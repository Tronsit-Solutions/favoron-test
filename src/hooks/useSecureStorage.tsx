import { useState, useEffect, useCallback } from 'react';
import { StorageEncryption } from '@/lib/encryption';

interface UseSecureStorageOptions<T> {
  key: string;
  initialState: T;
  ttl?: number; // Time to live in milliseconds
  storage?: 'localStorage' | 'sessionStorage';
  encrypt?: boolean; // Whether to encrypt sensitive data
}

export function useSecureStorage<T>(
  options: UseSecureStorageOptions<T>
) {
  const { 
    ttl = 60 * 60 * 1000, // 1 hour default
    key, 
    initialState, 
    storage = 'sessionStorage',
    encrypt = false
  } = options;
  
  const storageAPI = storage === 'localStorage' ? localStorage : sessionStorage;
  
  const [state, setState] = useState<T>(() => {
    try {
      const item = storageAPI.getItem(key);
      if (!item) return initialState;
      
      let dataString = item;
      
      // Decrypt if encryption is enabled and data appears encrypted
      if (encrypt && StorageEncryption.isEncrypted(item)) {
        // Note: decryption is async, so we'll handle this in useEffect
        return initialState;
      }
      
      const parsed = JSON.parse(dataString);
      
      // Check if data has expired
      if (parsed.timestamp && Date.now() - parsed.timestamp > ttl) {
        storageAPI.removeItem(key);
        return initialState;
      }
      
      return parsed.data || initialState;
    } catch (error) {
      console.warn(`Failed to load ${storage} state:`, error);
      return initialState;
    }
  });

  // Handle async decryption on mount
  useEffect(() => {
    if (!encrypt) return;
    
    const loadEncryptedData = async () => {
      try {
        const item = storageAPI.getItem(key);
        if (!item || !StorageEncryption.isEncrypted(item)) return;
        
        const decryptedData = await StorageEncryption.decrypt(item);
        const parsed = JSON.parse(decryptedData);
        
        // Check if data has expired
        if (parsed.timestamp && Date.now() - parsed.timestamp > ttl) {
          storageAPI.removeItem(key);
          return;
        }
        
        setState(parsed.data || initialState);
      } catch (error) {
        console.warn('Failed to decrypt storage data:', error);
        // Clear potentially corrupted data
        storageAPI.removeItem(key);
      }
    };
    
    loadEncryptedData();
  }, [key, ttl, initialState, encrypt, storageAPI]);

  // Persist state whenever it changes
  useEffect(() => {
    const persistData = async () => {
      try {
        const dataToStore = {
          data: state,
          timestamp: Date.now()
        };
        
        let dataString = JSON.stringify(dataToStore);
        
        // Encrypt if encryption is enabled
        if (encrypt) {
          dataString = await StorageEncryption.encrypt(dataString);
        }
        
        storageAPI.setItem(key, dataString);
      } catch (error) {
        console.warn(`Failed to persist ${storage} state:`, error);
      }
    };
    
    persistData();
  }, [state, key, storage, encrypt, storageAPI]);

  const clearState = useCallback(() => {
    try {
      storageAPI.removeItem(key);
      setState(initialState);
    } catch (error) {
      console.warn(`Failed to clear ${storage} state:`, error);
    }
  }, [key, initialState, storage, storageAPI]);

  const hasData = useCallback(() => {
    try {
      const item = storageAPI.getItem(key);
      if (!item) return false;
      
      // For encrypted data, we assume it's valid if it exists
      // (full validation would require async decryption)
      if (encrypt && StorageEncryption.isEncrypted(item)) {
        return true;
      }
      
      const parsed = JSON.parse(item);
      return parsed.timestamp && Date.now() - parsed.timestamp <= ttl;
    } catch {
      return false;
    }
  }, [key, ttl, encrypt, storageAPI]);

  return {
    state,
    setState,
    clearState,
    hasData
  };
}