// Simple encryption utility for localStorage/sessionStorage data
// Uses Web Crypto API for browser-based encryption

class StorageEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM

  // Generate a key from a password using PBKDF2
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Get a consistent key for the current session
  private static getSessionKey(): string {
    // Use session storage to get/create a persistent session key
    const sessionKey = 'favoron_session_key';
    let key = sessionStorage.getItem(sessionKey);
    
    if (!key) {
      // Create a new session key using crypto random values
      const randomBytes = crypto.getRandomValues(new Uint8Array(16));
      key = `favoron_${window.location.hostname}_${btoa(String.fromCharCode(...randomBytes))}`;
      sessionStorage.setItem(sessionKey, key);
    }
    
    return key;
  }

  // Encrypt data for storage
  static async encrypt(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const password = this.getSessionKey();
      
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Derive key
      const key = await this.deriveKey(password, salt);
      
      // Encrypt
      const encodedData = encoder.encode(data);
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv
        },
        key,
        encodedData
      );
      
      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.warn('Encryption failed, storing data unencrypted:', error);
      return data; // Fallback to unencrypted
    }
  }

  // Decrypt data from storage
  static async decrypt(encryptedData: string): Promise<string> {
    try {
      const password = this.getSessionKey();
      
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 16 + this.IV_LENGTH);
      const encrypted = combined.slice(16 + this.IV_LENGTH);
      
      // Derive key
      const key = await this.deriveKey(password, salt);
      
      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv
        },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.warn('Decryption failed, treating as unencrypted data:', error);
      return encryptedData; // Fallback - might be unencrypted legacy data
    }
  }

  // Check if data appears to be encrypted (base64 with sufficient length)
  static isEncrypted(data: string): boolean {
    // Simple heuristic: encrypted data will be base64 and longer than original
    // Base64 pattern and minimum length check
    const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
    return base64Pattern.test(data) && data.length > 50;
  }
}

export { StorageEncryption };