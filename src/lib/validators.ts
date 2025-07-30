import { APP_CONFIG } from './constants';

// File validation utilities
export const isImageFile = (fileType?: string): boolean => {
  if (!fileType) return false;
  return APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(fileType as any);
};

export const validateFile = (file: File) => {
  if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
    return { 
      valid: false, 
      isValid: false, 
      error: `El archivo es demasiado grande. Máximo ${APP_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  const isValidType = [
    ...APP_CONFIG.ALLOWED_IMAGE_TYPES,
    ...APP_CONFIG.ALLOWED_DOCUMENT_TYPES
  ].includes(file.type as any);

  if (!isValidType) {
    return { 
      valid: false,
      isValid: false, 
      error: 'Tipo de archivo no permitido' 
    };
  }

  return { valid: true, isValid: true };
};

// Phone validation
export const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
  if (!phone || !countryCode) return false;
  
  // Basic validation - at least 8 digits
  const phoneWithoutSpaces = phone.replace(/\s/g, '');
  return phoneWithoutSpaces.length >= 8 && /^\d+$/.test(phoneWithoutSpaces);
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Username validation
export const validateUsername = (username: string): boolean => {
  if (!username || username.length < 3) return false;
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username);
};