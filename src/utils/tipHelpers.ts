// Utilities for tip calculation and eligibility

export const getPackageTipFromQuote = (pkg: any): number => {
  const raw = pkg?.quote?.price ?? pkg?.quote?.totalPrice ?? 0;
  const num = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  return Number.isFinite(num) ? num : 0;
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
