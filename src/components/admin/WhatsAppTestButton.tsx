import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2, Shield } from 'lucide-react';

export const WhatsAppTestButton = () => {
  const [isSending, setIsSending] = useState(false);
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
      
      // Send directly to the test phone number using the welcome template
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleTestWhatsApp}
          disabled={isSending || isSendingSafe}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          {isSending ? 'Enviando...' : 'Probar WhatsApp (Welcome)'}
        </Button>

        <Button
          onClick={handleTestSafeWhatsApp}
          disabled={isSending || isSendingSafe}
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
        💡 Solo está activo el template "welcome" de Twilio.<br/>
        🔒 El endpoint seguro usa Content Templates y solo envía a números allowlisted.
      </p>
    </div>
  );
};
