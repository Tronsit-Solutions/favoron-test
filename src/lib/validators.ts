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
export const validatePhoneNumber = (phone: string, countryCode?: string): boolean => {
  if (!phone) return false;
  
  // Remove all non-digit characters except + for initial validation
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Must have at least 8 digits (excluding country code symbols)
  const digitsOnly = cleanPhone.replace(/[^\d]/g, '');
  
  if (digitsOnly.length < 8) return false;
  
  // If phone starts with +, it should have at least 10 digits total
  if (cleanPhone.startsWith('+') && digitsOnly.length < 10) return false;
  
  return true;
};

// WhatsApp specific validation - stricter than general phone
export const validateWhatsAppNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Número de WhatsApp requerido' };
  }

  const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
  const digitsOnly = cleanPhone.replace(/[^\d]/g, '');
  
  // Must include country code (+ or direct digits)
  if (!cleanPhone.startsWith('+') && digitsOnly.length < 10) {
    return { isValid: false, error: 'Incluye el código de país (ej: +502)' };
  }
  
  // Must have sufficient digits
  if (digitsOnly.length < 8) {
    return { isValid: false, error: 'Número muy corto (mínimo 8 dígitos)' };
  }
  
  if (digitsOnly.length > 15) {
    return { isValid: false, error: 'Número muy largo (máximo 15 dígitos)' };
  }
  
  return { isValid: true };
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