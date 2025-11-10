import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2 } from 'lucide-react';

export const WhatsAppTestButton = () => {
  const [isSending, setIsSending] = useState(false);
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

  return (
    <Button
      onClick={handleTestWhatsApp}
      disabled={isSending}
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
  );
};
