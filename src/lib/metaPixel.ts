// Meta Pixel tracking utilities
// Pixel ID: 25633562212963720

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

export const MetaPixel = {
  // Evento: Usuario completó registro
  trackCompleteRegistration: (userId?: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'CompleteRegistration', {
        content_name: 'User Registration',
        user_id: userId
      });
    }
  },

  // Evento: Usuario creó solicitud de paquete (Lead)
  trackPackageLead: (packageDetails?: { destination?: string; origin?: string }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: 'Package Request',
        content_category: 'package',
        ...packageDetails
      });
    }
  },

  // Evento: Usuario registró un viaje (Lead)
  trackTripLead: (tripDetails?: { from?: string; to?: string }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: 'Trip Registration',
        content_category: 'trip',
        ...tripDetails
      });
    }
  },

  // Evento: Pago completado exitosamente
  trackPurchase: (value: number, currency: string = 'GTQ', orderId?: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        value: value,
        currency: currency,
        content_type: 'product',
        order_id: orderId
      });
    }
  },

  // Evento personalizado
  trackCustom: (eventName: string, data?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, data);
    }
  }
};
