import { APP_CONFIG, STATUS_LABELS, PRIORITY_LABELS, ROLE_LABELS } from './constants';

// Date formatting utilities
export const formatDate = (date: string | Date, locale: string = APP_CONFIG.DEFAULT_LOCALE): string => {
  return new Date(date).toLocaleDateString(locale);
};

export const formatDateTime = (date: string | Date, locale: string = APP_CONFIG.DEFAULT_LOCALE): string => {
  return new Date(date).toLocaleString(locale);
};

export const isDatePast = (date: string | Date): boolean => {
  return new Date(date) < new Date();
};

export const getDaysUntil = (date: string | Date): number => {
  const targetDate = new Date(date);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Price formatting utilities
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${APP_CONFIG.PRICE_CURRENCY}${numPrice.toFixed(2)}`;
};

export const formatPriceRange = (min: number, max: number): string => {
  return `${formatPrice(min)} - ${formatPrice(max)}`;
};

export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${APP_CONFIG.PRICE_CURRENCY}${numAmount.toFixed(2)}`;
};

export const calculateProductsTotal = (products: Array<{ estimatedPrice: string }>): number => {
  return products.reduce((sum, product) => sum + parseFloat(product.estimatedPrice || '0'), 0);
};

// Status formatting utilities
export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
};

export const getPriorityLabel = (priority: 'high' | 'medium' | 'low'): string => {
  return PRIORITY_LABELS[priority];
};

export const getRoleLabel = (role: 'shopper' | 'traveler' | 'admin'): string => {
  return ROLE_LABELS[role];
};

// Phone formatting utilities
export const formatPhoneDisplay = (countryCode?: string, phoneNumber?: string): string => {
  if (!phoneNumber) return 'No registrado';
  if (!countryCode) return phoneNumber;
  return `${countryCode} ${phoneNumber}`;
};

export const formatFullName = (firstName?: string, lastName?: string): string => {
  if (!firstName && !lastName) return 'Usuario';
  return [firstName, lastName].filter(Boolean).join(' ');
};