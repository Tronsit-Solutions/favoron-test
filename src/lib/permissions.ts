import type { Package } from '@/types';

// Package permission utilities
export const canEditPackage = (pkg: Package, userId: string): boolean => {
  // Shopper can edit only in early stages: pending_approval or approved
  return pkg.user_id === userId && 
         ['pending_approval', 'approved'].includes(pkg.status);
};

export interface CancelPackageOptions {
  withRefund?: boolean;
}

export const canCancelPackage = (pkg: Package, userId: string, userRole?: string, options?: CancelPackageOptions): boolean => {
  // Admins pueden cancelar cualquier paquete
  if (userRole === 'admin') return true;
  
  // Solo el shopper puede cancelar
  if (pkg.user_id !== userId) return false;
  
  // Estados ya finalizados - nunca se pueden cancelar
  const finalStatuses = [
    'pending_office_confirmation', // Esperando oficina
    'delivered_to_office',       // En oficina
    'completed',                 // Completado
    'cancelled',                 // Ya cancelado
    'delivered'                  // Ya entregado
  ];
  
  if (finalStatuses.includes(pkg.status)) return false;
  
  // Estados que permiten cancelación CON reembolso
  const refundableStatuses = [
    'payment_pending_approval',  // Pago subido
    'pending_purchase',          // Pago aprobado
    'in_transit',                // En tránsito
    'received_by_traveler'       // Viajero tiene el producto
  ];
  
  // Si está en estado post-pago, solo se puede cancelar con reembolso
  if (refundableStatuses.includes(pkg.status)) {
    return options?.withRefund === true;
  }
  
  // Estados pre-pago: cancelación simple sin reembolso
  return true;
};

// Helper para saber si la cancelación requiere reembolso
export const requiresRefundForCancellation = (pkg: Package): boolean => {
  const refundableStatuses = [
    'payment_pending_approval',
    'pending_purchase',
    'in_transit',
    'received_by_traveler'
  ];
  return refundableStatuses.includes(pkg.status);
};

export const canViewPackageDetails = (pkg: Package, userId: string, userRole?: string): boolean => {
  // Admins can view all packages
  if (userRole === 'admin') return true;
  
  // Users can view packages they created
  return pkg.user_id === userId;
};

export const canModifyPackageStatus = (pkg: Package, userId: string, userRole?: string): boolean => {
  // Only admins and package owners can modify status
  if (userRole === 'admin') return true;
  
  return pkg.user_id === userId;
};

export const canUploadDocuments = (pkg: Package, userId: string): boolean => {
  // Only the shopper can upload documents for their packages
  return pkg.user_id === userId;
};

export const canViewFinancialInfo = (userId: string, userRole?: string): boolean => {
  // Only admins can view financial information
  return userRole === 'admin';
};