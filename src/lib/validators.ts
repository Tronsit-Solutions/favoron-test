import { APP_CONFIG } from './constants';

// Enhanced security validation utilities with input sanitization

// Input sanitization utility
export const sanitizeInput = (input: string, maxLength = 500): string => {
  if (!input) return '';
  
  // Remove potentially dangerous characters and limit length
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
};

// Enhanced text validation with stricter rules
export const validateText = (text: string, minLength = 1, maxLength = 500): { isValid: boolean; error?: string } => {
  if (!text || !text.trim()) {
    return { isValid: false, error: 'Campo requerido' };
  }

  const sanitized = sanitizeInput(text, maxLength);
  
  if (sanitized.length < minLength) {
    return { isValid: false, error: `Mínimo ${minLength} caracteres` };
  }

  if (sanitized.length > maxLength) {
    return { isValid: false, error: `Máximo ${maxLength} caracteres` };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /onclick/i,
    /onload/i,
    /onerror/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(text))) {
    return { isValid: false, error: 'Contenido no permitido' };
  }

  return { isValid: true };
};

// Enhanced URL validation
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL requerida' };
  }

  try {
    const urlObj = new URL(url);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Solo se permiten URLs HTTP/HTTPS' };
    }

    // Prevent localhost and private IP ranges in production
    if (urlObj.hostname === 'localhost' || 
        urlObj.hostname.startsWith('127.') ||
        urlObj.hostname.startsWith('192.168.') ||
        urlObj.hostname.startsWith('10.') ||
        urlObj.hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return { isValid: false, error: 'URLs privadas no permitidas' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'URL inválida' };
  }
};

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
  if (!cleanPhone.startsWith('+') && digitsOnly.length < 8) {
    return { isValid: false, error: 'Incluye el código de país (ej: +502 o 502)' };
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

// Enhanced email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email requerido' };
  }

  const sanitizedEmail = sanitizeInput(email.trim(), 254); // RFC 5321 limit
  
  // More comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(sanitizedEmail)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }

  // Check for suspicious patterns
  if (sanitizedEmail.includes('..') || sanitizedEmail.startsWith('.') || sanitizedEmail.endsWith('.')) {
    return { isValid: false, error: 'Email contiene caracteres inválidos' };
  }

  return { isValid: true };
};

// Enhanced username validation
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username || !username.trim()) {
    return { isValid: false, error: 'Nombre de usuario requerido' };
  }

  const sanitized = sanitizeInput(username.trim(), 30);
  
  if (sanitized.length < 3) {
    return { isValid: false, error: 'Mínimo 3 caracteres' };
  }

  if (sanitized.length > 30) {
    return { isValid: false, error: 'Máximo 30 caracteres' };
  }

  // Only allow alphanumeric characters, hyphens, and underscores
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(sanitized)) {
    return { isValid: false, error: 'Solo letras, números, guiones y guiones bajos' };
  }

  // Prevent reserved usernames
  const reservedUsernames = ['admin', 'root', 'system', 'api', 'www', 'mail', 'support'];
  if (reservedUsernames.includes(sanitized.toLowerCase())) {
    return { isValid: false, error: 'Nombre de usuario no disponible' };
  }

  return { isValid: true };
};

// Enhanced banking information validation
export const validateBankAccountNumber = (accountNumber: string): { isValid: boolean; error?: string } => {
  if (!accountNumber || !accountNumber.trim()) {
    return { isValid: false, error: 'Número de cuenta requerido' };
  }

  const sanitized = sanitizeInput(accountNumber.trim(), 50);
  
  // Allow only numbers, spaces, and hyphens
  const accountRegex = /^[0-9\s-]+$/;
  if (!accountRegex.test(sanitized)) {
    return { isValid: false, error: 'Solo números, espacios y guiones permitidos' };
  }

  // Remove spaces and hyphens for length validation
  const digitsOnly = sanitized.replace(/[\s-]/g, '');
  
  if (digitsOnly.length < 8) {
    return { isValid: false, error: 'Número de cuenta muy corto' };
  }

  if (digitsOnly.length > 34) { // IBAN max length
    return { isValid: false, error: 'Número de cuenta muy largo' };
  }

  return { isValid: true };
};

// Enhanced name validation
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Nombre requerido' };
  }

  const sanitized = sanitizeInput(name.trim(), 100);
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Mínimo 2 caracteres' };
  }

  // Allow letters, spaces, hyphens, apostrophes, and common international characters
  const nameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\s'-]+$/;
  if (!nameRegex.test(sanitized)) {
    return { isValid: false, error: 'Solo letras, espacios, guiones y apostrofes' };
  }

  return { isValid: true };
};

/**
 * Normalize product URLs to ensure they have proper protocol
 * Handles common cases like missing https:// and removes accidental Lovable preview prefixes
 */
export const normalizeProductUrl = (url: string | undefined | null): string | null => {
  if (!url || !url.trim()) return null;
  
  let cleanUrl = url.trim();
  
  // Remove any accidental Lovable preview domain prefix
  const lovablePreviewPattern = /^https?:\/\/[^\/]*lovable\.app\//i;
  if (lovablePreviewPattern.test(cleanUrl)) {
    // Extract the part after the Lovable domain
    cleanUrl = cleanUrl.replace(lovablePreviewPattern, '');
  }
  
  // If it looks like a product name/description (contains spaces and no dots), return null
  if (cleanUrl.includes(' ') && !cleanUrl.includes('.')) {
    console.warn('Invalid product URL (looks like description):', cleanUrl.substring(0, 50));
    return null;
  }
  
  // Add https:// if missing
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    // Check if it looks like a valid domain (has a dot)
    if (cleanUrl.includes('.')) {
      cleanUrl = 'https://' + cleanUrl;
    } else {
      // Doesn't look like a URL, return null
      return null;
    }
  }
  
  // Validate the final URL
  try {
    const urlObj = new URL(cleanUrl);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    return cleanUrl;
  } catch {
    return null;
  }
};