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
    message: `Has recibido una cotización de ${amount} para tu pedido "${packageDescription}". Revisa los detalles en tu dashboard.`,
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
    message: `Hay un nuevo pedido "${packageDescription}" para tu viaje de ${from} a ${to}. Revisa y acepta si te interesa.`,
    type: 'trip' as const,
    priority: 'high' as const
  }),
  
  paymentConfirmed: (amount: string, packageDescription: string) => ({
    title: '💳 Pago confirmado',
    message: `El shopper ha pagado ${amount} por el paquete "${packageDescription}". Ya puedes proceder con la compra.`,
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
  })
};
