import type { Package } from '@/types';

// Package permission utilities
export const canEditPackage = (pkg: Package, userId: string): boolean => {
  // Shopper can edit only in early stages: pending_approval or approved
  return pkg.user_id === userId && 
         ['pending_approval', 'approved'].includes(pkg.status);
};

export const canCancelPackage = (pkg: Package, userId: string): boolean => {
  // Only the shopper can cancel, and only if not delivered or cancelled
  return pkg.user_id === userId && 
         !['delivered', 'cancelled'].includes(pkg.status);
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