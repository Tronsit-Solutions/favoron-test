import { getPriceBreakdown, getDeliveryFee } from './pricing';

export interface NormalizedQuote {
  price: number;
  serviceFee: number;
  deliveryFee: number;
  totalPrice: number;
  message?: string;
  adminAssignedTipAccepted?: boolean;
  manually_edited?: boolean;
  edited_at?: string;
  edited_by?: string;
}

/**
 * UNIFIED QUOTE VALUES READER
 * 
 * This is THE SINGLE SOURCE OF TRUTH for reading quote values.
 * All components must use this function instead of extracting values manually.
 * 
 * When admin edits a quote, the values are saved in the quote object.
 * This function reads those saved values WITHOUT recalculating.
 */
export interface QuoteValues {
  price: number;        // Traveler tip / base price
  serviceFee: number;   // Service fee
  deliveryFee: number;  // Delivery fee
  totalPrice: number;   // Total before discount
  discountAmount: number;
  discountCode?: string;
  finalTotalPrice: number; // Total after discount (what shopper actually pays)
  message?: string;
  manuallyEdited?: boolean;
  editedAt?: string;
  editedBy?: string;
}

/**
 * Extract quote values from a saved quote object WITHOUT recalculating.
 * Use this everywhere you need to display quote information.
 */
export const getQuoteValues = (quote: any): QuoteValues => {
  if (!quote) {
    return {
      price: 0,
      serviceFee: 0,
      deliveryFee: 0,
      totalPrice: 0,
      discountAmount: 0,
      finalTotalPrice: 0
    };
  }

  const price = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price || 0);
  const serviceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0);
  const deliveryFee = typeof quote.deliveryFee === 'string' ? parseFloat(quote.deliveryFee) : Number(quote.deliveryFee || 0);
  const totalPrice = typeof quote.totalPrice === 'string' ? parseFloat(quote.totalPrice) : Number(quote.totalPrice || 0);
  const discountAmount = typeof quote.discountAmount === 'string' ? parseFloat(quote.discountAmount) : Number(quote.discountAmount || 0);
  
  // finalTotalPrice is what the shopper actually pays (total minus discount)
  const finalTotalPrice = quote.finalTotalPrice 
    ? (typeof quote.finalTotalPrice === 'string' ? parseFloat(quote.finalTotalPrice) : Number(quote.finalTotalPrice))
    : totalPrice - discountAmount;

  return {
    price,
    serviceFee,
    deliveryFee,
    totalPrice,
    discountAmount,
    discountCode: quote.discountCode,
    finalTotalPrice,
    message: quote.message,
    manuallyEdited: quote.manually_edited || quote.manuallyEdited,
    editedAt: quote.edited_at || quote.editedAt,
    editedBy: quote.edited_by || quote.editedBy
  };
};

/**
 * Calculate the service fee percentage from saved quote values
 */
export const getServiceFeePercentage = (quote: any): number => {
  const { price, serviceFee } = getQuoteValues(quote);
  return price > 0 ? Math.round((serviceFee / price) * 100) : 0;
};

/**
 * Get Favorón's total revenue from a quote (price + serviceFee)
 */
export const getFavoronTotal = (quote: any): number => {
  const { price, serviceFee } = getQuoteValues(quote);
  return price + serviceFee;
};

/**
 * Normalize a quote object to ensure consistent numeric values
 * Recalculates deliveryFee based on cityArea to fix any incorrect values
 * Validates serviceFee against current rates if provided
 * 
 * @param quote - the quote object to normalize
 * @param deliveryMethod - 'pickup' or 'delivery'
 * @param shopperTrustLevel - the shopper's trust level
 * @param cityArea - the cityArea from confirmed_delivery_address (e.g., 'Guatemala', 'Mixco')
 * @param rates - optional dynamic rates from DB (standard/prime) for validation
 */
export const normalizeQuote = (
  quote: any,
  deliveryMethod: string = 'pickup',
  shopperTrustLevel?: string,
  cityArea?: string,
  rates?: { standard: number; prime: number },
  fees?: {
    delivery_fee_guatemala_city: number;
    delivery_fee_guatemala_department: number;
    delivery_fee_outside_city: number;
    prime_delivery_discount: number;
  }
): NormalizedQuote => {
  if (!quote) {
    return {
      price: 0,
      serviceFee: 0,
      deliveryFee: 0,
      totalPrice: 0
    };
  }

  // Check if quote was manually edited by admin
  const wasManuallyEdited = quote.manually_edited === true;

  // Get the stored values (always numeric)
  const price = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price || 0);
  const storedServiceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0);
  const storedDeliveryFee = typeof quote.deliveryFee === 'string' ? parseFloat(quote.deliveryFee) : Number(quote.deliveryFee || 0);
  
  let serviceFee = storedServiceFee;
  let deliveryFee: number;
  
  if (wasManuallyEdited) {
    // Preserve manually edited values
    deliveryFee = storedDeliveryFee;
    console.log(`✅ Preserving manually edited quote values: serviceFee=Q${serviceFee}, deliveryFee=Q${deliveryFee}`);
  } else {
    // Recalculate deliveryFee based on cityArea to ensure correctness
    const correctDeliveryFee = getDeliveryFee(deliveryMethod, shopperTrustLevel, cityArea, fees);
    
    // Use the correct delivery fee and log if there's a discrepancy
    if (Math.abs(correctDeliveryFee - storedDeliveryFee) > 0.01) {
      console.warn(`🔧 DeliveryFee corrected: Q${storedDeliveryFee} → Q${correctDeliveryFee} for cityArea: ${cityArea}`);
    }
    
    deliveryFee = correctDeliveryFee;
    
    // Validate serviceFee against current rates if provided
    if (rates && price > 0) {
      const applicableRate = shopperTrustLevel === 'prime' ? rates.prime : rates.standard;
      const expectedServiceFee = price * applicableRate;
      
      if (Math.abs(expectedServiceFee - storedServiceFee) > 0.01) {
        console.warn(`🔧 ServiceFee corrected: Q${storedServiceFee.toFixed(2)} → Q${expectedServiceFee.toFixed(2)} (rate: ${(applicableRate * 100).toFixed(0)}%)`);
        serviceFee = expectedServiceFee;
      }
    }
  }
  
  // Calculate totalPrice
  const totalPrice = price + serviceFee + deliveryFee;

  return {
    price,
    serviceFee,
    deliveryFee,
    totalPrice,
    message: quote.message,
    adminAssignedTipAccepted: quote.adminAssignedTipAccepted,
    // Preserve manual edit metadata
    manually_edited: quote.manually_edited,
    edited_at: quote.edited_at,
    edited_by: quote.edited_by
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
 * @param rates - optional dynamic rates from DB (standard/prime)
 */
export const createNormalizedQuote = (
  basePrice: number,
  deliveryMethod: string = 'pickup',
  shopperTrustLevel?: string,
  message?: string,
  adminAssignedTipAccepted?: boolean,
  cityArea?: string,
  rates?: { standard: number; prime: number },
  fees?: {
    delivery_fee_guatemala_city: number;
    delivery_fee_guatemala_department: number;
    delivery_fee_outside_city: number;
    prime_delivery_discount: number;
  }
): NormalizedQuote => {
  const breakdown = getPriceBreakdown(basePrice, deliveryMethod, shopperTrustLevel, cityArea, rates, fees);

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

  // NEVER recalculate quotes that were manually edited by admin
  if (quote.manually_edited === true) {
    console.log('✅ Quote was manually edited, skipping recalculation check');
    return false;
  }

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