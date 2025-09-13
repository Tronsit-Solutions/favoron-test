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
 * Get the delivery fee based on delivery method and user's trust level
 */
export const getDeliveryFee = (
  deliveryMethod: string = 'pickup', 
  trustLevel?: TrustLevel | string
): number => {
  // No delivery fee for messenger pickup regardless of trust level
  if (deliveryMethod === 'messenger') {
    return 0;
  }
  
  if (trustLevel === 'prime') {
    return PRICING_CONFIG.PRIME_DELIVERY_FEE;
  }
  return PRICING_CONFIG.STANDARD_DELIVERY_FEE;
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
  trustLevel?: TrustLevel | string
): number => {
  const serviceFee = calculateServiceFee(basePrice, trustLevel);
  const deliveryFee = getDeliveryFee(deliveryMethod, trustLevel);
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
  trustLevel?: TrustLevel | string
) => {
  const serviceFee = calculateServiceFee(basePrice, trustLevel);
  const deliveryFee = getDeliveryFee(deliveryMethod, trustLevel);
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