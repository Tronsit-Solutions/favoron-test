/**
 * Refund calculation utilities for product cancellations
 */

export const DEFAULT_CANCELLATION_PENALTY = 5;

interface ProductData {
  itemDescription?: string;
  estimatedPrice?: string | number;
  quantity?: string | number;
  adminAssignedTip?: number;
  cancelled?: boolean;
}

interface QuoteData {
  price?: number;
  serviceFee?: number;
  deliveryFee?: number;
  totalPrice?: number;
  discountAmount?: number;
}

interface RefundOptions {
  penaltyAmount?: number;
  isPrimeUser?: boolean;
}

/**
 * Calculate the refund amount for a cancelled product
 * The refund includes:
 * 1. The tip assigned to the product (adminAssignedTip)
 * 2. A proportional share of the Favoron service fee
 * 3. Minus cancellation penalty (unless Prime user)
 */
export const calculateProductRefund = (
  product: ProductData,
  quote: QuoteData,
  allProducts: ProductData[],
  options?: RefundOptions
): number => {
  const penaltyAmount = options?.penaltyAmount ?? DEFAULT_CANCELLATION_PENALTY;
  const isPrimeUser = options?.isPrimeUser ?? false;

  // Get the product's tip (what the shopper paid for this product to the traveler)
  const productTip = product.adminAssignedTip || 0;
  
  // Calculate total tips from all active (non-cancelled) products
  const totalActiveTips = allProducts
    .filter(p => !p.cancelled)
    .reduce((sum, p) => sum + (p.adminAssignedTip || 0), 0);
  
  if (totalActiveTips === 0) {
    const grossRefund = productTip;
    const penalty = isPrimeUser ? 0 : penaltyAmount;
    return Math.max(0, Math.round((grossRefund - penalty) * 100) / 100);
  }
  
  // Calculate the product's proportion of the total
  const productProportion = productTip / totalActiveTips;
  
  // Get the service fee and calculate proportional share
  const serviceFee = quote.serviceFee || 0;
  const proportionalServiceFee = serviceFee * productProportion;
  
  // Gross refund = product tip + proportional service fee
  const grossRefund = productTip + proportionalServiceFee;
  
  // Apply penalty (only if NOT Prime user)
  const penalty = isPrimeUser ? 0 : penaltyAmount;
  const netRefund = Math.max(0, grossRefund - penalty);
  
  // Round to 2 decimal places
  return Math.round(netRefund * 100) / 100;
};

/**
 * Get breakdown of refund calculation for display
 */
export const getRefundBreakdown = (
  product: ProductData,
  quote: QuoteData,
  allProducts: ProductData[],
  options?: RefundOptions
): {
  productTip: number;
  proportionalServiceFee: number;
  grossRefund: number;
  cancellationPenalty: number;
  isPrimeExempt: boolean;
  totalRefund: number;
} => {
  const penaltyAmount = options?.penaltyAmount ?? DEFAULT_CANCELLATION_PENALTY;
  const isPrimeUser = options?.isPrimeUser ?? false;

  const productTip = product.adminAssignedTip || 0;
  
  const totalActiveTips = allProducts
    .filter(p => !p.cancelled)
    .reduce((sum, p) => sum + (p.adminAssignedTip || 0), 0);
  
  const productProportion = totalActiveTips > 0 ? productTip / totalActiveTips : 0;
  const serviceFee = quote.serviceFee || 0;
  const proportionalServiceFee = Math.round((serviceFee * productProportion) * 100) / 100;
  
  const grossRefund = Math.round((productTip + proportionalServiceFee) * 100) / 100;
  const cancellationPenalty = isPrimeUser ? 0 : penaltyAmount;
  const totalRefund = Math.max(0, Math.round((grossRefund - cancellationPenalty) * 100) / 100);
  
  return {
    productTip,
    proportionalServiceFee,
    grossRefund,
    cancellationPenalty,
    isPrimeExempt: isPrimeUser,
    totalRefund
  };
};

/**
 * Check if a product can be cancelled
 */
export const canCancelProduct = (
  product: ProductData,
  packageStatus: string,
  activeProductCount: number
): { canCancel: boolean; reason?: string } => {
  // Status check - only certain statuses allow cancellation
  const CANCELLABLE_STATUSES = [
    'pending_purchase',
    'payment_confirmed',
    'in_transit',
    'purchased'
  ];
  
  if (!CANCELLABLE_STATUSES.includes(packageStatus)) {
    return { 
      canCancel: false, 
      reason: 'El paquete no está en un estado que permita cancelaciones' 
    };
  }
  
  // Already cancelled check
  if (product.cancelled) {
    return { 
      canCancel: false, 
      reason: 'Este producto ya fue cancelado' 
    };
  }
  
  // Received by traveler check
  if ((product as any).receivedByTraveler) {
    return { 
      canCancel: false, 
      reason: 'Este producto ya fue recibido por el viajero' 
    };
  }
  
  // Last product check
  if (activeProductCount <= 1) {
    return { 
      canCancel: false, 
      reason: 'No puedes cancelar el último producto. Si deseas cancelar todo el pedido, contacta a soporte.' 
    };
  }
  
  return { canCancel: true };
};

/**
 * Cancellation reasons for dropdown
 */
export const CANCELLATION_REASONS = [
  { value: 'product_unavailable', label: 'Producto agotado' },
  { value: 'price_changed', label: 'El precio cambió' },
  { value: 'no_longer_needed', label: 'Ya no lo necesito' },
  { value: 'found_alternative', label: 'Encontré una alternativa' },
  { value: 'other', label: 'Otro' }
] as const;

export type CancellationReason = typeof CANCELLATION_REASONS[number]['value'];
