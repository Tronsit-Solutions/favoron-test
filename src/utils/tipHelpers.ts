// Utilities for tip calculation and eligibility
import { getQuoteValues } from '@/lib/quoteHelpers';

/**
 * Get the traveler tip amount from a package's quote
 * Uses the centralized getQuoteValues function for consistency
 */
export const getPackageTipFromQuote = (pkg: any): number => {
  const { price } = getQuoteValues(pkg?.quote);
  return Number.isFinite(price) ? price : 0;
};

export const isPackageEligibleForTripPayment = (pkg: any): boolean => {
  if (!pkg) return false;
  if (pkg.status === 'completed') return true;
  
  // Paquetes que ya están en oficina (confirmados por admin)
  if (
    pkg.status === 'delivered_to_office' &&
    pkg.office_delivery &&
    (pkg.office_delivery as any).admin_confirmation
  ) {
    return true;
  }
  
  // Estados post-entrega en oficina (listos para cliente)
  if (pkg.status === 'ready_for_pickup' || pkg.status === 'ready_for_delivery') {
    return true;
  }
  
  return false;
};
