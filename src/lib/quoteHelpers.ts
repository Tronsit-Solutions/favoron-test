import { getPriceBreakdown } from './pricing';

export interface NormalizedQuote {
  price: number;
  serviceFee: number;
  deliveryFee: number;
  totalPrice: number;
  message?: string;
  adminAssignedTipAccepted?: boolean;
}

/**
 * Normalize a quote object to ensure consistent numeric values
 * Uses stored values and calculates totalPrice as simple sum
 */
export const normalizeQuote = (
  quote: any,
  deliveryMethod: string = 'pickup',
  shopperTrustLevel?: string
): NormalizedQuote => {
  if (!quote) {
  return {
    price: 0,
    serviceFee: 0,
    deliveryFee: 0,
    totalPrice: 0
  };
  }

  // Get the stored values (always numeric)
  const price = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price || 0);
  const serviceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0);
  const deliveryFee = typeof quote.deliveryFee === 'string' ? parseFloat(quote.deliveryFee) : Number(quote.deliveryFee || 0);
  
  // Calculate totalPrice as simple sum of stored components
  const totalPrice = price + serviceFee + deliveryFee;

  return {
    price,
    serviceFee,
    deliveryFee,
    totalPrice,
    message: quote.message,
    adminAssignedTipAccepted: quote.adminAssignedTipAccepted
  };
};

/**
 * Create a quote object with proper calculations
 */
export const createNormalizedQuote = (
  basePrice: number,
  deliveryMethod: string = 'pickup',
  shopperTrustLevel?: string,
  message?: string,
  adminAssignedTipAccepted?: boolean
): NormalizedQuote => {
  const breakdown = getPriceBreakdown(basePrice, deliveryMethod, shopperTrustLevel);

  return {
    price: breakdown.basePrice,
    serviceFee: breakdown.serviceFee,
    deliveryFee: breakdown.deliveryFee,
    totalPrice: breakdown.totalPrice,
    message,
    adminAssignedTipAccepted
  };
};

/**
 * Validate if a quote needs recalculation by comparing stored vs computed values
 */
export const shouldRecalculateQuote = (
  quote: any,
  deliveryMethod: string = 'pickup',
  shopperTrustLevel?: string,
  tolerance: number = 0.01
): boolean => {
  if (!quote) return false;

  const normalized = normalizeQuote(quote, deliveryMethod, shopperTrustLevel);
  const storedTotal = typeof quote.totalPrice === 'string' ? parseFloat(quote.totalPrice) : Number(quote.totalPrice || 0);
  const storedServiceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0);

  // Check if there's a significant difference
  const totalDiff = Math.abs(normalized.totalPrice - storedTotal);
  const serviceDiff = Math.abs(normalized.serviceFee - storedServiceFee);

  return totalDiff > tolerance || serviceDiff > tolerance;
};

/**
 * Get display total for UI - uses stored values with simple sum
 */
export const getDisplayTotal = (
  quote: any,
  deliveryMethod: string = 'pickup',
  shopperTrustLevel?: string
): number => {
  if (!quote) return 0;
  
  const normalized = normalizeQuote(quote, deliveryMethod, shopperTrustLevel);
  return normalized.totalPrice;
};