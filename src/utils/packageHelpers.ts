import { Package } from '@/types';

/**
 * Gets the status color for a package status
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending_approval':
      return 'bg-warning text-warning-foreground';
    case 'approved':
      return 'bg-info text-info-foreground';
    case 'payment_confirmed':
      return 'bg-success text-success-foreground';
    case 'in_transit':
      return 'bg-info text-info-foreground';
    case 'delivered':
      return 'bg-success text-success-foreground';
    case 'received_by_traveler':
      return 'bg-success text-success-foreground';
    case 'rejected':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

/**
 * Gets the localized status label for a package
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending_approval':
      return 'Pendiente de aprobación';
    case 'approved':
      return 'Aprobado';
    case 'payment_confirmed':
      return 'Pago confirmado';
    case 'in_transit':
      return 'En tránsito';
    case 'delivered':
      return 'Entregado';
    case 'received_by_traveler':
      return 'Recibido por viajero';
    case 'rejected':
      return 'Rechazado';
    default:
      return status;
  }
};

/**
 * Checks if a package can be edited by the current user
 */
export const canEditPackage = (pkg: Package, userId: string): boolean => {
  return pkg.user_id === userId && ['pending_approval', 'approved'].includes(pkg.status);
};

/**
 * Checks if a package can be cancelled by the current user
 */
export const canCancelPackage = (pkg: Package, userId: string): boolean => {
  return pkg.user_id === userId && !['delivered', 'received_by_traveler', 'rejected'].includes(pkg.status);
};

/**
 * Gets the priority level of a package based on delivery deadline
 */
export const getPackagePriority = (deliveryDeadline: string): 'high' | 'medium' | 'low' => {
  const deadline = new Date(deliveryDeadline);
  const now = new Date();
  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDeadline <= 3) return 'high';
  if (daysUntilDeadline <= 7) return 'medium';
  return 'low';
};

/**
 * Gets the color class for package priority
 */
export const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
  switch (priority) {
    case 'high':
      return 'text-destructive';
    case 'medium':
      return 'text-warning';
    case 'low':
      return 'text-success';
    default:
      return 'text-muted-foreground';
  }
};