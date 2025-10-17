import { PRICING_CONFIG } from './constants';

export type TrustLevel = 'basic' | 'earned' | 'verified' | 'prime';

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
 * Get the delivery fee based on delivery method, user's trust level, and destination
 * - Guatemala City: Q25 for standard users, Q0 for Prime users
 * - Other cities: Q60 for standard users, Q35 for Prime users (Q60 - Q25 discount)
 * - Pickup: Q0 for everyone
 */
export const getDeliveryFee = (
  deliveryMethod: string = 'pickup', 
  trustLevel?: TrustLevel | string,
  destination?: string
): number => {
  // No delivery fee for pickup regardless of trust level or destination
  if (deliveryMethod === 'pickup') {
    return 0;
  }
  
  // Check if destination is Guatemala City (detects multiple variations)
  const isGuatemalaCity = destination?.toLowerCase().match(
    /guatemala\s*city|ciudad\s*de\s*guatemala|^guatemala$|^guate$|ciudad\s*guatemala/
  );
  
  // Prime users in Guatemala City get free delivery
  if (trustLevel === 'prime' && isGuatemalaCity) {
    return 0;
  }
  
  // Prime users outside Guatemala City get Q25 discount (Q60 - Q25 = Q35)
  if (trustLevel === 'prime' && !isGuatemalaCity) {
    return PRICING_CONFIG.OUTSIDE_CITY_DELIVERY_FEE - PRICING_CONFIG.PRIME_DISCOUNT; // Q35
  }
  
  // Standard users: Q25 for Guatemala City, Q60 for other cities
  return isGuatemalaCity 
    ? PRICING_CONFIG.STANDARD_DELIVERY_FEE // Q25
    : PRICING_CONFIG.OUTSIDE_CITY_DELIVERY_FEE; // Q60
};

/**
 * Calculate the service fee based on trust level
 */
export const calculateServiceFee = (basePrice: number, trustLevel?: TrustLevel | string): number => {
  if (trustLevel === 'prime') {
    return basePrice * PRICING_CONFIG.SERVICE_FEE_RATE_PRIME;
  }
  return basePrice * PRICING_CONFIG.SERVICE_FEE_RATE_STANDARD;
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
 * This is the commission rate applied to (base price + service fee)
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
 * Calculate traveler's tip (what they earn from the quote)
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
  destination?: string
) => {
  const serviceFee = calculateServiceFee(basePrice, trustLevel);
  const deliveryFee = getDeliveryFee(deliveryMethod, trustLevel, destination);
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