import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2, Mail } from 'lucide-react';
import { WhatsAppTemplates } from '@/lib/whatsappNotifications';

export const WhatsAppTestButton = () => {
  const [isSending, setIsSending] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const { toast } = useToast();

  const handleTestWhatsApp = async () => {
    setIsSending(true);
    try {
      console.log('🧪 Testing WhatsApp notification...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      // Call the WhatsApp notification edge function
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          user_id: user.id,
          title: '🧪 Prueba WhatsApp Favorón',
          message: 'Este es un mensaje de prueba del sistema de notificaciones. Si recibes este mensaje, significa que todo está funcionando correctamente. ✅',
          type: 'general',
          priority: 'high',
          action_url: 'https://favoron.app/dashboard'
        }
      });

      if (error) throw error;

      console.log('✅ WhatsApp test result:', data);

      if (data?.skipped) {
        toast({
          title: '⏭️ Notificación omitida',
          description: data.reason || 'El usuario no está en la whitelist de testing',
          variant: 'default'
        });
      } else if (data?.success) {
        toast({
          title: '✅ WhatsApp enviado',
          description: `Mensaje enviado correctamente. SID: ${data.message_sid || 'N/A'}`,
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('❌ Error testing WhatsApp:', error);
      toast({
        title: '❌ Error al enviar WhatsApp',
        description: error.message || 'Ocurrió un error al enviar la notificación',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestAllNotifications = async () => {
    setIsSendingAll(true);
    try {
      console.log('🧪 Testing ALL WhatsApp notifications...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      // Define all test notifications with representative data
      const testNotifications = [
        {
          name: "Cotización recibida (Shopper)",
          ...WhatsAppTemplates.quoteReceived("Q450.00", "iPhone 15 Pro Max")
        },
        {
          name: "Paquete recibido por viajero (Shopper)", 
          ...WhatsAppTemplates.packageReceivedByTraveler("iPhone 15 Pro Max", "Juan Pérez")
        },
        {
          name: "Paquete listo en oficina - Delivery (Shopper)",
          ...WhatsAppTemplates.packageReadyAtOffice("iPhone 15 Pro Max", "delivery")
        },
        {
          name: "Paquete listo en oficina - Pickup (Shopper)",
          ...WhatsAppTemplates.packageReadyAtOffice("MacBook Pro", "pickup")
        },
        {
          name: "Nuevo pedido disponible (Viajero)",
          ...WhatsAppTemplates.newPackageRequest("iPhone 15 Pro Max", "Miami", "Guatemala")
        },
        {
          name: "Pago confirmado (Viajero)",
          ...WhatsAppTemplates.paymentConfirmed("Q450.00", "iPhone 15 Pro Max")
        },
        {
          name: "Comprobante de compra subido (Viajero)",
          ...WhatsAppTemplates.purchaseConfirmationUploaded("iPhone 15 Pro Max")
        },
        {
          name: "Tracking actualizado (Viajero)",
          ...WhatsAppTemplates.trackingInfoUploaded("iPhone 15 Pro Max")
        },
        {
          name: "Comprobante de tips subido (Viajero)",
          ...WhatsAppTemplates.tipPaymentReceiptUploaded("Q150.00")
        }
      ];

      const results = {
        success: [] as string[],
        failed: [] as { name: string; error: string }[]
      };

      // Send each notification with a delay
      for (let i = 0; i < testNotifications.length; i++) {
        const notification = testNotifications[i];
        
        console.log(`📤 Enviando notificación ${i + 1}/${testNotifications.length}: ${notification.name}`);
        console.log('📝 Template:', notification);

        toast({
          title: `⏳ Enviando ${i + 1}/${testNotifications.length}`,
          description: notification.name,
        });

        try {
          const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
            body: {
              user_id: user.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              priority: notification.priority,
              action_url: 'https://favoron.app/dashboard'
            }
          });

          if (error) throw error;

          if (data?.success) {
            results.success.push(notification.name);
            console.log(`✅ ${notification.name} - Enviado`);
          } else if (data?.skipped) {
            results.failed.push({ name: notification.name, error: data.reason || 'Skipped' });
            console.log(`⏭️ ${notification.name} - Omitido: ${data.reason}`);
          }

          // Wait 500ms between messages to avoid rate limiting
          if (i < testNotifications.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error: any) {
          results.failed.push({ name: notification.name, error: error.message });
          console.error(`❌ ${notification.name} - Error:`, error);
        }
      }

      // Show summary
      console.log('📊 Resumen:', results);
      
      if (results.success.length === testNotifications.length) {
        toast({
          title: '✅ Todas las notificaciones enviadas',
          description: `${results.success.length} notificaciones enviadas exitosamente a tu WhatsApp`,
        });
      } else if (results.success.length > 0) {
        toast({
          title: '⚠️ Algunas notificaciones fallaron',
          description: `✅ ${results.success.length} exitosas | ❌ ${results.failed.length} fallidas`,
          variant: 'default'
        });
      } else {
        toast({
          title: '❌ Error al enviar notificaciones',
          description: 'Ninguna notificación pudo ser enviada',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('❌ Error testing all notifications:', error);
      toast({
        title: '❌ Error general',
        description: error.message || 'Ocurrió un error al enviar las notificaciones',
        variant: 'destructive'
      });
    } finally {
      setIsSendingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          onClick={handleTestWhatsApp}
          disabled={isSending || isSendingAll}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          {isSending ? 'Enviando...' : 'Probar WhatsApp'}
        </Button>
        
        <Button
          onClick={handleTestAllNotifications}
          disabled={isSending || isSendingAll}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isSendingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {isSendingAll ? 'Enviando...' : 'Probar Todas (9 notificaciones)'}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        💡 Modo testing: Solo recibirás notificaciones tú.
      </p>
    </div>
  );
};
