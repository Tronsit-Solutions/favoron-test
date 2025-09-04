import { PHONE_CONFIG } from './constants';

export interface ParsedPhone {
  countryCode: string;
  phoneNumber: string;
}

/**
 * Parse a full phone number into country code and phone number
 */
export const parsePhoneNumber = (fullPhone: string): ParsedPhone => {
  if (!fullPhone) {
    return {
      countryCode: PHONE_CONFIG.DEFAULT_COUNTRY_CODE,
      phoneNumber: ''
    };
  }

  // Remove any spaces, dashes, or parentheses
  const cleanPhone = fullPhone.replace(/[\s\-\(\)]/g, '');
  
  // Find matching country code
  const supportedCountry = PHONE_CONFIG.SUPPORTED_COUNTRIES.find(country => 
    cleanPhone.startsWith(country.code)
  );

  if (supportedCountry) {
    return {
      countryCode: supportedCountry.code,
      phoneNumber: cleanPhone.substring(supportedCountry.code.length)
    };
  }

  // If no country code found, assume it's just the number with default country code
  return {
    countryCode: PHONE_CONFIG.DEFAULT_COUNTRY_CODE,
    phoneNumber: cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone
  };
};

/**
 * Combine country code and phone number into a full phone number
 */
export const combinePhoneNumber = (countryCode: string, phoneNumber: string): string => {
  if (!phoneNumber) return '';
  return `${countryCode} ${phoneNumber}`;
};

/**
 * Format phone number for display
 */
export const formatPhoneDisplay = (countryCode: string, phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  const country = PHONE_CONFIG.SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
  const flag = country?.flag || '';
  
  return `${flag} ${countryCode} ${phoneNumber}`;
};