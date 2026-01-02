import { PRICING_CONFIG } from './constants';

export type TrustLevel = 'basic' | 'confiable' | 'prime';

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
 * Check if a cityArea is "Guatemala" (capital city only)
 * Only "Guatemala" qualifies for reduced delivery fee (Q25)
 * Mixco, Villa Nueva, Petapa, etc. are Q60
 */
export const isGuatemalaCityArea = (cityArea?: string): boolean => {
  if (!cityArea) return false;
  const normalized = cityArea.toLowerCase().trim();
  
  // Lista de municipios/ciudades que NO son Guatemala Ciudad (Q60)
  const excludedAreas = [
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
  
  // Si contiene algún área excluida, NO es Guatemala Ciudad
  if (excludedAreas.some(excluded => normalized.includes(excluded))) {
    return false;
  }
  
  // Patrones que SÍ son Guatemala Ciudad
  const guatemalaCityPatterns = [
    /^guatemala$/,                           // "guatemala" exacto
    /^guatemala\s*city$/i,                   // "guatemala city"
    /^ciudad\s*de\s*guatemala/i,             // "ciudad de guatemala..."
    /^guatemala\s*,?\s*guatemala$/i,         // "guatemala, guatemala"
    /^guatemala\s+zona\s*\d+/i,              // "guatemala zona 10"
    /zona\s*\d+.*ciudad\s*de\s*guatemala/i,  // "zona 2 de la Ciudad de Guatemala"
    /^zona\s*\d+.*guatemala$/i,              // "zona 10 guatemala"
    /^guate$/i,                              // "guate" exacto
  ];
  
  return guatemalaCityPatterns.some(pattern => pattern.test(normalized));
};

/**
 * Get the delivery fee based on delivery method, user's trust level, and cityArea
 * - Guatemala (city): Q25 for standard users, Q0 for Prime users
 * - Other cities (Mixco, Villa Nueva, etc.): Q60 for standard users, Q35 for Prime users
 * - Pickup: Q0 for everyone
 * 
 * @param deliveryMethod - 'pickup' or 'delivery'
 * @param trustLevel - user's trust level
 * @param cityArea - the cityArea field from confirmed_delivery_address (e.g., 'Guatemala', 'Mixco', 'Villa Nueva')
 */
export const getDeliveryFee = (
  deliveryMethod: string = 'pickup', 
  trustLevel?: TrustLevel | string,
  cityArea?: string
): number => {
  // No delivery fee for pickup regardless of trust level or cityArea
  if (deliveryMethod === 'pickup') {
    return 0;
  }
  
  // Check if cityArea is Guatemala city (only "Guatemala" qualifies)
  const isGuatemala = isGuatemalaCityArea(cityArea);
  
  // Prime users in Guatemala city get free delivery
  if (trustLevel === 'prime' && isGuatemala) {
    return 0;
  }
  
  // Prime users outside Guatemala city get Q25 discount (Q60 - Q25 = Q35)
  if (trustLevel === 'prime' && !isGuatemala) {
    return PRICING_CONFIG.OUTSIDE_CITY_DELIVERY_FEE - PRICING_CONFIG.PRIME_DISCOUNT; // Q35
  }
  
  // Standard users: Q25 for Guatemala city, Q60 for other cities
  return isGuatemala 
    ? PRICING_CONFIG.STANDARD_DELIVERY_FEE // Q25
    : PRICING_CONFIG.OUTSIDE_CITY_DELIVERY_FEE; // Q60
};

/**
 * Calculate the service fee based on trust level
 * 
 * @param basePrice - the base price to calculate fee from
 * @param trustLevel - user's trust level
 * @param rates - optional dynamic rates from DB (standard/prime). If not provided, uses PRICING_CONFIG fallback.
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
 * 
 * @param basePrice - the base price (traveler tip)
 * @param deliveryMethod - 'pickup' or 'delivery'
 * @param trustLevel - user's trust level
 * @param destination - cityArea for delivery fee calculation
 * @param rates - optional dynamic rates from DB
 */
export const getPriceBreakdown = (
  basePrice: number,
  deliveryMethod: string = 'pickup',
  trustLevel?: TrustLevel | string,
  destination?: string,
  rates?: { standard: number; prime: number }
) => {
  const serviceFee = calculateServiceFee(basePrice, trustLevel, rates);
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