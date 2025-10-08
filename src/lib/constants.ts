// Application constants
export const APP_CONFIG = {
  DEFAULT_LOCALE: 'es-GT',
  PRICE_CURRENCY: 'Q',
  FAVARON_FEE_PERCENTAGE: 0.40, // 40% - corrected from 15%
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png']
} as const;

export const PRICING_CONFIG = {
  // Commission rates by trust level
  STANDARD_COMMISSION_RATE: 0.40, // 40% for standard users
  PRIME_COMMISSION_RATE: 0.20, // 20% for Prime users
  
  // Delivery fees by trust level and location
  STANDARD_DELIVERY_FEE: 25,        // Q25 for Guatemala City
  OUTSIDE_CITY_DELIVERY_FEE: 60,    // Q60 for other cities
  PRIME_DISCOUNT: 25,                // Q25 discount for Prime users outside Guatemala City
  
  // Service fee calculation by trust level
  SERVICE_FEE_RATE_STANDARD: 0.40, // 40% for standard users
  SERVICE_FEE_RATE_PRIME: 0.20 // 20% for Prime users
} as const;

export const DELIVERY_PRIORITIES = {
  HIGH_THRESHOLD_DAYS: 3,
  MEDIUM_THRESHOLD_DAYS: 7
} as const;

export const PHONE_CONFIG = {
  DEFAULT_COUNTRY_CODE: '+502',
  SUPPORTED_COUNTRIES: [
    { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
    { code: '+1', name: 'Estados Unidos', flag: '🇺🇸' },
    { code: '+52', name: 'México', flag: '🇲🇽' },
    { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
    { code: '+504', name: 'Honduras', flag: '🇭🇳' },
    { code: '+505', name: 'Nicaragua', flag: '🇳🇮' },
    { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
    { code: '+507', name: 'Panamá', flag: '🇵🇦' }
  ]
} as const;

export const STATUS_LABELS = {
  // Package statuses
  pending: 'Pendiente',
  admin_review: 'En revisión',
  quote_generated: 'Cotización generada',
  quote_sent: 'Cotización enviada',
  quote_expired: 'Cotización expirada',
  quote_accepted: 'Cotización aceptada',
  awaiting_payment: 'Cotización Aceptada - Pendiente Pago',
  payment_confirmed: 'Pago confirmado',
  pending_purchase: 'Compra pendiente',
  purchase_confirmed: 'Compra confirmada',
  shipped: 'Enviado',
  in_transit: 'En tránsito',
  received_by_traveler: 'Recibido por viajero',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  
  // Trip statuses
  active: 'Activo',
  completed: 'Completado',
  planning: 'Planificando'
} as const;

export const PRIORITY_LABELS = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja'
} as const;

export const ROLE_LABELS = {
  shopper: 'Comprador',
  traveler: 'Viajero',
  admin: 'Equipo Favorón'
} as const;

export const REJECTION_REASONS = {
  no_longer_want: 'Ya no quiero el paquete',
  too_expensive: 'La cotización fue muy cara',
  wrong_delivery_time: 'El tiempo de entrega no es el que quería',
  other: 'Otra razón'
} as const;

export const PAID_STATUSES = [
  'payment_confirmed',
  'pending_purchase', 
  'purchase_confirmed',
  'paid',
  'shipped',
  'in_transit',
  'received_by_traveler',
  'delivered',
  'delivered_to_office'
] as const;

export const isPaidStatus = (status: string): boolean => {
  return PAID_STATUSES.includes(status as any);
};