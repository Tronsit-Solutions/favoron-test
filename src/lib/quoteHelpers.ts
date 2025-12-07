import { getPriceBreakdown, getDeliveryFee } from './pricing';

export interface NormalizedQuote {
  price: number;
  serviceFee: number;
  deliveryFee: number;
  totalPrice: number;
  completePrice: number;
  message?: string;
  adminAssignedTipAccepted?: boolean;
}

/**
 * Normalize a quote object to ensure consistent numeric values
 * Recalculates deliveryFee based on cityArea to fix any incorrect values
 * 
 * @param quote - the quote object to normalize
 * @param deliveryMethod - 'pickup' or 'delivery'
 * @param shopperTrustLevel - the shopper's trust level
 * @param cityArea - the cityArea from confirmed_delivery_address (e.g., 'Guatemala', 'Mixco')
 */
export const normalizeQuote = (
  quote: any,
  deliveryMethod: string = 'pickup',
  shopperTrustLevel?: string,
  cityArea?: string
): NormalizedQuote => {
  if (!quote) {
    return {
      price: 0,
      serviceFee: 0,
      deliveryFee: 0,
      totalPrice: 0,
      completePrice: 0
    };
  }

  // Get the stored values (always numeric)
  const price = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price || 0);
  const serviceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0);
  
  // Recalculate deliveryFee based on cityArea to ensure correctness
  const correctDeliveryFee = getDeliveryFee(deliveryMethod, shopperTrustLevel, cityArea);
  const storedDeliveryFee = typeof quote.deliveryFee === 'string' ? parseFloat(quote.deliveryFee) : Number(quote.deliveryFee || 0);
  
  // Use the correct delivery fee and log if there's a discrepancy
  if (Math.abs(correctDeliveryFee - storedDeliveryFee) > 0.01) {
    console.warn(`🔧 DeliveryFee corrected: Q${storedDeliveryFee} → Q${correctDeliveryFee} for cityArea: ${cityArea}`);
  }
  
  const deliveryFee = correctDeliveryFee;
  
  // Calculate totalPrice with corrected deliveryFee
  const totalPrice = price + serviceFee + deliveryFee;
  const completePrice = price + serviceFee + deliveryFee;

  return {
    price,
    serviceFee,
    deliveryFee,
    totalPrice,
    completePrice,
    message: quote.message,
    adminAssignedTipAccepted: quote.adminAssignedTipAccepted
  };
};

/**
 * Create a quote object with proper calculations
 * 
 * @param basePrice - the base price (traveler tip)
 * @param deliveryMethod - 'pickup' or 'delivery'
 * @param shopperTrustLevel - the shopper's trust level
 * @param message - optional message from traveler
 * @param adminAssignedTipAccepted - whether the admin-assigned tip was accepted
 * @param cityArea - the cityArea from confirmed_delivery_address (e.g., 'Guatemala', 'Mixco')
 */
export const createNormalizedQuote = (
  basePrice: number,
  deliveryMethod: string = 'pickup',
  shopperTrustLevel?: string,
  message?: string,
  adminAssignedTipAccepted?: boolean,
  cityArea?: string
): NormalizedQuote => {
  const breakdown = getPriceBreakdown(basePrice, deliveryMethod, shopperTrustLevel, cityArea);

  return {
    price: breakdown.basePrice,
    serviceFee: breakdown.serviceFee,
    deliveryFee: breakdown.deliveryFee,
    totalPrice: breakdown.totalPrice,
    completePrice: breakdown.totalPrice,
    message,
    adminAssignedTipAccepted
  };
};

/**
 * Validate if a quote needs recalculation by comparing stored vs computed values
 * 
 * @param quote - the quote object to validate
 * @param deliveryMethod - 'pickup' or 'delivery'
 * @param shopperTrustLevel - the shopper's trust level
 * @param cityArea - the cityArea from confirmed_delivery_address
 * @param tolerance - the tolerance for comparison (default 0.01)
 */
export const shouldRecalculateQuote = (
  quote: any,
  deliveryMethod: string = 'pickup',
  shopperTrustLevel?: string,
  cityArea?: string,
  tolerance: number = 0.01
): boolean => {
  if (!quote) return false;

  const normalized = normalizeQuote(quote, deliveryMethod, shopperTrustLevel, cityArea);
  const storedTotal = typeof quote.totalPrice === 'string' ? parseFloat(quote.totalPrice) : Number(quote.totalPrice || 0);
  const storedServiceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0);

  // Check if there's a significant difference
  const totalDiff = Math.abs(normalized.totalPrice - storedTotal);
  const serviceDiff = Math.abs(normalized.serviceFee - storedServiceFee);

  return totalDiff > tolerance || serviceDiff > tolerance;
};

/**
 * Get display total for UI - uses stored values with simple sum
 * 
 * @param quote - the quote object
 * @param deliveryMethod - 'pickup' or 'delivery'
 * @param shopperTrustLevel - the shopper's trust level
 * @param cityArea - the cityArea from confirmed_delivery_address
 */
export const getDisplayTotal = (
  quote: any,
  deliveryMethod: string = 'pickup',
  shopperTrustLevel?: string,
  cityArea?: string
): number => {
  if (!quote) return 0;
  
  const normalized = normalizeQuote(quote, deliveryMethod, shopperTrustLevel, cityArea);
  return normalized.totalPrice;
};