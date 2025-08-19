import type { Package } from '@/types';

// Package permission utilities
export const canEditPackage = (pkg: Package, userId: string): boolean => {
  // Only the shopper can edit, and only if package is pending or in admin review
  return pkg.user_id === userId && 
         ['pending', 'admin_review'].includes(pkg.status);
};

export const canCancelPackage = (pkg: Package, userId: string): boolean => {
  // Only the shopper can cancel, and only if not in advanced stages
  if (pkg.user_id !== userId) return false;
  
  // Cannot cancel if already cancelled or delivered
  if (['cancelled', 'delivered'].includes(pkg.status)) return false;
  
  // Cannot cancel if payment has been processed or package is in transit
  const restrictedStates = [
    'payment_confirmed', 
    'pending_purchase', 
    'in_transit', 
    'received_by_traveler',
    'office_delivery_confirmed'
  ];
  
  return !restrictedStates.includes(pkg.status);
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

export const canHidePackage = (pkg: Package, userId: string): boolean => {
  // Users can hide their own packages if they're cancelled or completed
  return pkg.user_id === userId && 
         ['cancelled', 'delivered', 'rejected'].includes(pkg.status);
};

export const getPackageCancellationRisk = (pkg: Package): 'low' | 'medium' | 'high' => {
  const riskLevels: Record<string, 'low' | 'medium' | 'high'> = {
    'pending_approval': 'low',
    'approved': 'low', 
    'matched': 'medium',
    'quote_sent': 'medium',
    'quote_accepted': 'high',
    'address_confirmed': 'high'
  };
  
  return riskLevels[pkg.status] || 'low';
};