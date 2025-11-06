// Application constants
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://favoron.app';

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
    // Centroamérica
    { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
    { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
    { code: '+504', name: 'Honduras', flag: '🇭🇳' },
    { code: '+505', name: 'Nicaragua', flag: '🇳🇮' },
    { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
    { code: '+507', name: 'Panamá', flag: '🇵🇦' },
    { code: '+501', name: 'Belice', flag: '🇧🇿' },
    
    // Norteamérica
    { code: '+1', name: 'Estados Unidos/Canadá', flag: '🇺🇸' },
    { code: '+52', name: 'México', flag: '🇲🇽' },
    
    // Sudamérica
    { code: '+54', name: 'Argentina', flag: '🇦🇷' },
    { code: '+55', name: 'Brasil', flag: '🇧🇷' },
    { code: '+56', name: 'Chile', flag: '🇨🇱' },
    { code: '+57', name: 'Colombia', flag: '🇨🇴' },
    { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
    { code: '+51', name: 'Perú', flag: '🇵🇪' },
    { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
    { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
    { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
    { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
    { code: '+592', name: 'Guyana', flag: '🇬🇾' },
    { code: '+597', name: 'Surinam', flag: '🇸🇷' },
    { code: '+594', name: 'Guayana Francesa', flag: '🇬🇫' },
    
    // Caribe
    { code: '+53', name: 'Cuba', flag: '🇨🇺' },
    { code: '+1-809', name: 'República Dominicana', flag: '🇩🇴' },
    { code: '+1-787', name: 'Puerto Rico', flag: '🇵🇷' },
    { code: '+1-876', name: 'Jamaica', flag: '🇯🇲' },
    { code: '+509', name: 'Haití', flag: '🇭🇹' },
    { code: '+1-242', name: 'Bahamas', flag: '🇧🇸' },
    { code: '+1-246', name: 'Barbados', flag: '🇧🇧' },
    { code: '+1-868', name: 'Trinidad y Tobago', flag: '🇹🇹' },
    
    // Europa
    { code: '+34', name: 'España', flag: '🇪🇸' },
    { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
    { code: '+33', name: 'Francia', flag: '🇫🇷' },
    { code: '+49', name: 'Alemania', flag: '🇩🇪' },
    { code: '+39', name: 'Italia', flag: '🇮🇹' },
    { code: '+351', name: 'Portugal', flag: '🇵🇹' },
    { code: '+31', name: 'Países Bajos', flag: '🇳🇱' },
    { code: '+32', name: 'Bélgica', flag: '🇧🇪' },
    { code: '+41', name: 'Suiza', flag: '🇨🇭' },
    { code: '+43', name: 'Austria', flag: '🇦🇹' },
    { code: '+45', name: 'Dinamarca', flag: '🇩🇰' },
    { code: '+46', name: 'Suecia', flag: '🇸🇪' },
    { code: '+47', name: 'Noruega', flag: '🇳🇴' },
    { code: '+358', name: 'Finlandia', flag: '🇫🇮' },
    { code: '+353', name: 'Irlanda', flag: '🇮🇪' },
    { code: '+48', name: 'Polonia', flag: '🇵🇱' },
    { code: '+7', name: 'Rusia', flag: '🇷🇺' },
    { code: '+380', name: 'Ucrania', flag: '🇺🇦' },
    { code: '+30', name: 'Grecia', flag: '🇬🇷' },
    
    // Asia
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+81', name: 'Japón', flag: '🇯🇵' },
    { code: '+82', name: 'Corea del Sur', flag: '🇰🇷' },
    { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
    { code: '+63', name: 'Filipinas', flag: '🇵🇭' },
    { code: '+66', name: 'Tailandia', flag: '🇹🇭' },
    { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
    { code: '+60', name: 'Malasia', flag: '🇲🇾' },
    { code: '+65', name: 'Singapur', flag: '🇸🇬' },
    { code: '+852', name: 'Hong Kong', flag: '🇭🇰' },
    { code: '+886', name: 'Taiwán', flag: '🇹🇼' },
    { code: '+90', name: 'Turquía', flag: '🇹🇷' },
    { code: '+972', name: 'Israel', flag: '🇮🇱' },
    { code: '+971', name: 'Emiratos Árabes', flag: '🇦🇪' },
    { code: '+966', name: 'Arabia Saudita', flag: '🇸🇦' },
    { code: '+92', name: 'Pakistán', flag: '🇵🇰' },
    { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
    
    // Oceanía
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+64', name: 'Nueva Zelanda', flag: '🇳🇿' },
    
    // África
    { code: '+27', name: 'Sudáfrica', flag: '🇿🇦' },
    { code: '+20', name: 'Egipto', flag: '🇪🇬' },
    { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', name: 'Kenia', flag: '🇰🇪' },
    { code: '+212', name: 'Marruecos', flag: '🇲🇦' }
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