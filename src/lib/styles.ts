import { DELIVERY_PRIORITIES } from './constants';
import { getDaysUntil } from './formatters';

// Status color utilities
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    admin_review: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    quote_generated: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
    quote_accepted: 'bg-green-500/10 text-green-700 border-green-500/20',
    awaiting_payment: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    payment_confirmed: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    pending_purchase: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    purchase_confirmed: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
    shipped: 'bg-blue-600/10 text-blue-800 border-blue-600/20',
    in_transit: 'bg-violet-500/10 text-violet-700 border-violet-500/20',
    delivered: 'bg-green-600/10 text-green-800 border-green-600/20',
    cancelled: 'bg-red-500/10 text-red-700 border-red-500/20',
    active: 'bg-green-500/10 text-green-700 border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    planning: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
  };
  
  return statusColors[status] || 'bg-gray-500/10 text-gray-700 border-gray-500/20';
};

// Priority utilities
export const getPackagePriority = (deliveryDeadline: string): 'high' | 'medium' | 'low' => {
  const daysUntil = getDaysUntil(deliveryDeadline);
  
  if (daysUntil <= DELIVERY_PRIORITIES.HIGH_THRESHOLD_DAYS) {
    return 'high';
  } else if (daysUntil <= DELIVERY_PRIORITIES.MEDIUM_THRESHOLD_DAYS) {
    return 'medium';
  } else {
    return 'low';
  }
};

export const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
  const priorityColors = {
    high: 'bg-red-500/10 text-red-700 border-red-500/20',
    medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-700 border-green-500/20'
  };
  
  return priorityColors[priority];
};

// Role styling utilities
export const getRoleStyles = (role: 'shopper' | 'traveler' | 'admin') => {
  const roleStyles = {
    shopper: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      message: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
      avatar: 'bg-blue-500/10 text-blue-700'
    },
    traveler: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      badge: 'bg-green-500/10 text-green-700 border-green-500/20',
      message: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
      avatar: 'bg-green-500/10 text-green-700'
    },
    admin: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      badge: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      message: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
      avatar: 'bg-purple-500/10 text-purple-700'
    }
  };
  
  return roleStyles[role] || roleStyles.shopper;
};