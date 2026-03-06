import { PRICING_CONFIG } from './constants';

export type TrustLevel = 'basic' | 'confiable' | 'prime';
export type DeliveryZone = 'guatemala_city' | 'guatemala_department' | 'outside';

/**
 * List of municipalities in the Department of Guatemala that are NOT Guatemala City.
 * These get the "guatemala_department" zone (middle tier).
 */
const GUATEMALA_DEPT_MUNICIPALITIES = [
  'mixco',
  'villa nueva',
  'villanueva',
  'villa canales',
  'villacanales',
  'san miguel petapa',
  'petapa',
  'amatitlan',
  'amatitlán',
  'fraijanes',
  'santa catarina pinula',
  'chinautla',
  'san jose pinula',
  'san josé pinula',
  'palencia',
  'san pedro ayampuc',
  'san juan sacatepequez',
  'san juan sacatepéquez',
  'condado naranjo',
  'san cristobal',
  'san cristóbal',
  'carretera a el salvador',
  'carretera el salvador',
];

/**
 * Patterns that match Guatemala City (municipio de Guatemala).
 */
const GUATEMALA_CITY_PATTERNS = [
  /^guatemala$/,
  /^guatemala\s*city$/i,
  /^ciudad\s*de\s*guatemala$/i,
  /^ciudad\s+de\s+guatemala/i,
  /^ciudad\s*guatemala$/i,
  /^guatemala\s*,?\s*guatemala$/i,
  /^guatemala\s+zona\s*\d+/i,
  /zona\s*\d+.*ciudad\s*de\s*guatemala/i,
  /^zona\s*\d+.*guatemala$/i,
  /^guate$/i,
];

/**
 * Classify a cityArea into one of three delivery zones:
 * - guatemala_city: Municipio de Guatemala (Q25)
 * - guatemala_department: Other municipalities in Dept. Guatemala like Mixco, Villa Nueva (Q45)
 * - outside: Outside Department of Guatemala (Q60)
 */
export const getDeliveryZone = (cityArea?: string, destinationCountry?: string): DeliveryZone => {
  if (!cityArea && !destinationCountry) return 'outside';
  const normalized = (cityArea || '').toLowerCase().trim();

  // Check department municipalities first (Mixco, Villa Nueva, etc.)
  if (normalized && GUATEMALA_DEPT_MUNICIPALITIES.some(m => normalized.includes(m))) {
    return 'guatemala_department';
  }

  // Check Guatemala City patterns
  if (normalized && GUATEMALA_CITY_PATTERNS.some(p => p.test(normalized))) {
    return 'guatemala_city';
  }

  // If destination country is Guatemala but cityArea didn't match any specific pattern,
  // classify as guatemala_department (Q45) instead of outside (Q60)
  if (destinationCountry && destinationCountry.toLowerCase().trim() === 'guatemala') {
    return 'guatemala_department';
  }

  return 'outside';
};

/** @deprecated Use getDeliveryZone instead */
export const isGuatemalaCityArea = (cityArea?: string): boolean => {
  return getDeliveryZone(cityArea) === 'guatemala_city';
};

/**
 * Get the commission rate for Favoron based on user's trust level
 */
export const getFavoronCommissionRate = (trustLevel?: TrustLevel | string): number => {
  if (trustLevel === 'prime') {
    return PRICING_CONFIG.PRIME_COMMISSION_RATE;
  }
  return PRICING_CONFIG.STANDARD_COMMISSION_RATE;
};

/**
 * Get the delivery fee based on delivery method, user's trust level, and cityArea.
 * Three-tier system:
 * - Guatemala City: Q25 standard, Q0 prime
 * - Guatemala Dept (Mixco, etc.): Q45 standard, Q45-discount prime
 * - Outside: Q60 standard, Q60-discount prime
 */
export const getDeliveryFee = (
  deliveryMethod: string = 'pickup', 
  trustLevel?: TrustLevel | string,
  cityArea?: string,
  fees?: {
    delivery_fee_guatemala_city: number;
    delivery_fee_guatemala_department: number;
    delivery_fee_outside_city: number;
    prime_delivery_discount: number;
  },
  destinationCountry?: string
): number => {
  if (deliveryMethod === 'pickup' || 
      deliveryMethod === 'return_dropoff' || 
      deliveryMethod === 'return_pickup') {
    return 0;
  }
  
  const zone = getDeliveryZone(cityArea, destinationCountry);
  
  const feeCity = fees?.delivery_fee_guatemala_city ?? PRICING_CONFIG.STANDARD_DELIVERY_FEE;
  const feeDept = fees?.delivery_fee_guatemala_department ?? PRICING_CONFIG.GUATEMALA_DEPT_DELIVERY_FEE;
  const feeOutside = fees?.delivery_fee_outside_city ?? PRICING_CONFIG.OUTSIDE_CITY_DELIVERY_FEE;
  const discount = fees?.prime_delivery_discount ?? PRICING_CONFIG.PRIME_DISCOUNT;
  
  if (zone === 'guatemala_city') {
    return trustLevel === 'prime' ? 0 : feeCity;
  }
  
  if (zone === 'guatemala_department') {
    return trustLevel === 'prime' ? Math.max(0, feeDept - discount) : feeDept;
  }
  
  // outside
  return trustLevel === 'prime' ? Math.max(0, feeOutside - discount) : feeOutside;
};

/**
 * Calculate the service fee based on trust level
 */
export const calculateServiceFee = (
  basePrice: number, 
  trustLevel?: TrustLevel | string,
  rates?: { standard: number; prime: number }
): number => {
  const standardRate = rates?.standard ?? PRICING_CONFIG.SERVICE_FEE_RATE_STANDARD;
  const primeRate = rates?.prime ?? PRICING_CONFIG.SERVICE_FEE_RATE_PRIME;
  
  if (trustLevel === 'prime') {
    return basePrice * primeRate;
  }
  return basePrice * standardRate;
};

/**
 * Calculate the total quote price including service fee and delivery fee
 */
export const calculateQuoteTotal = (
  basePrice: number,
  deliveryMethod: string = 'pickup',
  trustLevel?: TrustLevel | string,
  destination?: string
): number => {
  const serviceFee = calculateServiceFee(basePrice, trustLevel);
  const deliveryFee = getDeliveryFee(deliveryMethod, trustLevel, destination);
  return basePrice + serviceFee + deliveryFee;
};

/**
 * Calculate Favoron's revenue from a package
 */
export const calculateFavoronRevenue = (
  basePrice: number,
  serviceFee: number,
  trustLevel?: TrustLevel | string
): number => {
  const commissionRate = getFavoronCommissionRate(trustLevel);
  return commissionRate * (basePrice + serviceFee);
};

/**
 * Calculate traveler's tip
 */
export const calculateTravelerTip = (
  totalPrice: number,
  basePrice: number,
  serviceFee: number,
  deliveryFee: number,
  trustLevel?: TrustLevel | string
): number => {
  const favoronRevenue = calculateFavoronRevenue(basePrice, serviceFee, trustLevel);
  return totalPrice - favoronRevenue - deliveryFee;
};

/**
 * Get a breakdown of price components for transparency
 */
export const getPriceBreakdown = (
  basePrice: number,
  deliveryMethod: string = 'pickup',
  trustLevel?: TrustLevel | string,
  destination?: string,
  rates?: { standard: number; prime: number },
  fees?: {
    delivery_fee_guatemala_city: number;
    delivery_fee_guatemala_department: number;
    delivery_fee_outside_city: number;
    prime_delivery_discount: number;
  },
  destinationCountry?: string
) => {
  const serviceFee = calculateServiceFee(basePrice, trustLevel, rates);
  const deliveryFee = getDeliveryFee(deliveryMethod, trustLevel, destination, fees, destinationCountry);
  const totalPrice = basePrice + serviceFee + deliveryFee;
  const favoronRevenue = calculateFavoronRevenue(basePrice, serviceFee, trustLevel);
  const travelerTip = calculateTravelerTip(totalPrice, basePrice, serviceFee, deliveryFee, trustLevel);
  
  return {
    basePrice,
    serviceFee,
    deliveryFee,
    totalPrice,
    favoronRevenue,
    travelerTip,
    commissionRate: getFavoronCommissionRate(trustLevel),
    isPrime: trustLevel === 'prime'
  };
};
