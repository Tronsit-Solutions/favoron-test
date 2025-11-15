import { supabase } from '@/integrations/supabase/client';

interface SendWhatsAppNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'package' | 'trip' | 'payment' | 'general';
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export const sendWhatsAppNotification = async ({
  userId,
  title,
  message,
  type,
  priority = 'medium',
  actionUrl
}: SendWhatsAppNotificationParams) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
      body: {
        user_id: userId,
        title,
        message,
        type,
        priority,
        action_url: actionUrl || 'https://favoron.app/dashboard'
      }
    });

    if (error) throw error;
    console.log('✅ WhatsApp notification sent:', { userId, title });
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending WhatsApp notification:', error);
    return { success: false, error };
  }
};

// Templates específicos para cada evento
export const WhatsAppTemplates = {
  // Para shoppers
  quoteReceived: (amount: string, packageDescription: string) => ({
    title: '💰 Nueva cotización recibida',
    message: `Has recibido una cotización de ${amount} para tu pedido "${packageDescription}".\n\n⏰ Tienes 48 horas para aceptar o rechazar esta cotización.\n\nRevisa los detalles en tu dashboard.`,
    type: 'package' as const,
    priority: 'high' as const
  }),
  
  packageReceivedByTraveler: (packageDescription: string, travelerName?: string) => ({
    title: '✅ Paquete recibido por viajero',
    message: `El viajero${travelerName ? ` ${travelerName}` : ''} ha confirmado la recepción de tu paquete "${packageDescription}".`,
    type: 'package' as const,
    priority: 'high' as const
  }),
  
  packageReadyAtOffice: (packageDescription: string, deliveryMethod: string) => ({
    title: '📦 Paquete listo en oficina Favorón',
    message: `Tu paquete "${packageDescription}" está listo ${deliveryMethod === 'delivery' ? 'para entrega a domicilio' : 'para recoger en nuestra oficina'}. ¡Ya puedes pasar por él!`,
    type: 'package' as const,
    priority: 'high' as const
  }),
  
  // Para viajeros
  newPackageRequest: (packageDescription: string, from: string, to: string) => ({
    title: '📦 Nuevo pedido disponible',
    message: `Hay un nuevo pedido "${packageDescription}" para tu viaje de ${from} a ${to}.\n\n⏰ Tienes 24 horas para aceptar este pedido.\n\nRevisa los detalles en tu dashboard.`,
    type: 'trip' as const,
    priority: 'high' as const
  }),
  
  quoteAcceptedByShopper: (amount: string, packageDescription: string) => ({
    title: '💳 Cotización aceptada',
    message: `El shopper ha aceptado y pagado ${amount} por el paquete "${packageDescription}".\n\nPronto compartirá el comprobante de compra del producto y el tracking para que puedas estar atento a la llegada del paquete.`,
    type: 'payment' as const,
    priority: 'high' as const
  }),
  
  purchaseConfirmationUploaded: (packageDescription: string) => ({
    title: '📄 Comprobante de compra subido',
    message: `El shopper subió el comprobante de compra para "${packageDescription}". Revísalo en el chat del paquete.`,
    type: 'package' as const,
    priority: 'medium' as const
  }),
  
  trackingInfoUploaded: (packageDescription: string) => ({
    title: '📦 Información de seguimiento actualizada',
    message: `El shopper actualizó la información de seguimiento para "${packageDescription}". Revisa los detalles en tu dashboard.`,
    type: 'package' as const,
    priority: 'medium' as const
  }),
  
  tipPaymentReceiptUploaded: (amount: string) => ({
    title: '💵 Comprobante de pago de tips subido',
    message: `Se ha subido el comprobante de pago por ${amount}. Verifica en tu perfil.`,
    type: 'payment' as const,
    priority: 'high' as const
  }),
  
  // Para mensajes del chat
  newChatMessageFromShopper: (shopperName: string, packageDescription: string) => ({
    title: '💬 Nuevo mensaje del comprador',
    message: `${shopperName} te envió un mensaje sobre el paquete "${packageDescription}".\n\nResponde en el chat del paquete.`,
    type: 'package' as const,
    priority: 'medium' as const
  }),

  newChatMessageFromTraveler: (travelerName: string, packageDescription: string) => ({
    title: '💬 Nuevo mensaje del viajero',
    message: `${travelerName} te envió un mensaje sobre tu paquete "${packageDescription}".\n\nResponde en el chat del paquete.`,
    type: 'package' as const,
    priority: 'medium' as const
  }),

  newFileFromShopper: (shopperName: string, packageDescription: string) => ({
    title: '📎 Nuevo archivo del comprador',
    message: `${shopperName} subió un archivo sobre el paquete "${packageDescription}".\n\nRevísalo en el chat del paquete.`,
    type: 'package' as const,
    priority: 'medium' as const
  }),

  newFileFromTraveler: (travelerName: string, packageDescription: string) => ({
    title: '📎 Nuevo archivo del viajero',
    message: `${travelerName} subió un archivo sobre tu paquete "${packageDescription}".\n\nRevísalo en el chat del paquete.`,
    type: 'package' as const,
    priority: 'medium' as const
  })
};
