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

/**
 * Formatea una fecha en UTC sin conversión de timezone local
 * Útil para fechas que deben mostrarse igual independientemente de la zona horaria del usuario
 */
export const formatDateUTC = (dateString: string | Date, locale: string = APP_CONFIG.DEFAULT_LOCALE): string => {
  const date = new Date(dateString);
  return new Date(
    date.getUTCFullYear(), 
    date.getUTCMonth(), 
    date.getUTCDate()
  ).toLocaleDateString(locale);
};

// Price formatting utilities
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${APP_CONFIG.PRICE_CURRENCY}${numPrice.toFixed(2)}`;
};

export const formatPriceRange = (min: number, max: number): string => {
  return `${formatPrice(min)} - ${formatPrice(max)}`;
};

export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return `${APP_CONFIG.PRICE_CURRENCY}0.00`;
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return `${APP_CONFIG.PRICE_CURRENCY}0.00`;
  return `${APP_CONFIG.PRICE_CURRENCY}${numAmount.toFixed(2)}`;
};

export const formatDollarPrice = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `$${numAmount.toFixed(2)}`;
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

/**
 * Normaliza una fecha a mediodía UTC del día seleccionado por el usuario
 * Esto asegura que las fechas se muestren correctamente sin importar la zona horaria
 */
export const normalizeToMiddayUTC = (date: Date | string): Date => {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
};