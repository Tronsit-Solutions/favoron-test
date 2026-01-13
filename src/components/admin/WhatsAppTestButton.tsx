import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2, Mail, Shield } from 'lucide-react';
import { WhatsAppTemplates } from '@/lib/whatsappNotifications';

export const WhatsAppTestButton = () => {
  const [isSending, setIsSending] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [isSendingSafe, setIsSendingSafe] = useState(false);
  const { toast } = useToast();

  // Test secure endpoint with allowlist validation
  const handleTestSafeWhatsApp = async () => {
    setIsSendingSafe(true);
    try {
      console.log('🔒 Testing SAFE WhatsApp endpoint...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp-test-safe', {
        body: {
          to: '+34699591457',
          contentVariables: { '1': 'Prueba desde Favoron Admin' }
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: '✅ WhatsApp Seguro Enviado',
          description: `SID: ${data.data?.sid || 'OK'}`,
        });
        console.log('🔒 Safe endpoint response:', data);
      } else {
        throw new Error(data?.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('🔒 Safe endpoint error:', error);
      toast({
        title: '❌ Error en endpoint seguro',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSendingSafe(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setIsSending(true);
    try {
      console.log('🧪 Testing WhatsApp notification with Content Template...');
      
      // Send directly to the test phone number using the new template format
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          phone_number: '+34699591457', // Direct to test number
          template_id: 'welcome',
          variables: { "1": "Usuario de Prueba" }
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
          description: `Mensaje enviado correctamente. SID: ${data.data?.sid || 'OK'}`,
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
          name: "Mensaje de viajero (Shopper)",
          ...WhatsAppTemplates.newChatMessageFromTraveler("María López", "iPhone 15 Pro Max")
        },
        {
          name: "Archivo de viajero (Shopper)",
          ...WhatsAppTemplates.newFileFromTraveler("María López", "iPhone 15 Pro Max")
        },
        {
          name: "Nuevo pedido disponible (Viajero)",
          ...WhatsAppTemplates.newPackageRequest("iPhone 15 Pro Max", "Miami", "Guatemala")
        },
        {
          name: "Cotización aceptada (Viajero)",
          ...WhatsAppTemplates.quoteAcceptedByShopper("iPhone 15 Pro Max")
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
        },
        {
          name: "Mensaje de comprador (Viajero)",
          ...WhatsAppTemplates.newChatMessageFromShopper("Pedro García", "iPhone 15 Pro Max")
        },
        {
          name: "Archivo de comprador (Viajero)",
          ...WhatsAppTemplates.newFileFromShopper("Pedro García", "iPhone 15 Pro Max")
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
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleTestWhatsApp}
          disabled={isSending || isSendingAll || isSendingSafe}
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
          disabled={isSending || isSendingAll || isSendingSafe}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isSendingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {isSendingAll ? 'Enviando...' : 'Probar Todas (13)'}
        </Button>

        <Button
          onClick={handleTestSafeWhatsApp}
          disabled={isSending || isSendingAll || isSendingSafe}
          variant="default"
          size="sm"
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          {isSendingSafe ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Shield className="h-4 w-4" />
          )}
          {isSendingSafe ? 'Enviando...' : '🔒 Endpoint Seguro'}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        💡 Modo testing: Solo recibirás notificaciones tú.<br/>
        🔒 El endpoint seguro usa Content Templates y solo envía a números allowlisted.
      </p>
    </div>
  );
};
