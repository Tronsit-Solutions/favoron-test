// Utilities for tip calculation and eligibility
import { getQuoteValues } from '@/lib/quoteHelpers';

/**
 * Calculate the tip for active (non-cancelled) products in a package.
 * If the package has products_data, sums only adminAssignedTip of non-cancelled products.
 * Otherwise falls back to admin_assigned_tip or quote.price.
 */
export const getActiveTipFromPackage = (pkg: any): number => {
  if (!pkg) return 0;

  // If products_data exists, sum only active products' tips
  let productsArray: any[] = [];
  try {
    if (pkg.products_data) {
      if (typeof pkg.products_data === 'string') {
        productsArray = JSON.parse(pkg.products_data);
      } else if (Array.isArray(pkg.products_data)) {
        productsArray = pkg.products_data;
      }
    }
  } catch {
    productsArray = [];
  }

  if (productsArray.length > 0) {
    const activeProducts = productsArray.filter((p: any) => !p.cancelled);
    const sum = activeProducts.reduce((acc: number, p: any) => acc + (Number(p.adminAssignedTip) || 0), 0);
    if (sum > 0) return sum;
  }

  // Fallback: admin_assigned_tip > quote.price
  if (Number(pkg.admin_assigned_tip) > 0) return Number(pkg.admin_assigned_tip);
  const { price } = getQuoteValues(pkg?.quote);
  return Number.isFinite(price) ? price : 0;
};

/**
 * Get the traveler tip amount from a package's quote
 * Uses the centralized getQuoteValues function for consistency
 */
export const getPackageTipFromQuote = (pkg: any): number => {
  // Use the new active-products-aware calculation
  return getActiveTipFromPackage(pkg);
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
