import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2, Send } from 'lucide-react';

export const WhatsAppTestButton = () => {
  const [isSending, setIsSending] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const { toast } = useToast();

  // Test all active templates sequentially
  const handleTestAllTemplates = async () => {
    setIsSendingAll(true);
    const testPhone = '+34699591457';
    const results: Array<{template: string, success: boolean, error?: string}> = [];
    
    const templates = [
      { 
        id: 'welcome_v2', 
        name: 'Bienvenida', 
        variables: { "1": "Usuario de Prueba" } 
      },
      { 
        id: 'quote_received_v2', 
        name: 'Cotización', 
        variables: { "1": "Usuario de Prueba", "2": "1,250.00", "3": "iPhone 15 Pro Max" } 
      },
      { 
        id: 'package_assigned', 
        name: 'Paquete Asignado', 
        variables: { "1": "Viajero de Prueba", "2": "Miami, Estados Unidos", "3": "Q 150.00" } 
      },
    ];
    
    try {
      console.log('🧪 Testing ALL WhatsApp templates...');
      
      for (const template of templates) {
        console.log(`📤 Sending ${template.id}...`);
        const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
          body: {
            phone_number: testPhone,
            template_id: template.id,
            variables: template.variables
          }
        });
        
        results.push({
          template: template.name,
          success: !error && data?.success,
          error: error?.message || data?.error
        });
        
        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log('📊 Results:', results);
      
      toast({
        title: `📊 Resultados: ${successCount}/${templates.length} enviados`,
        description: results.map(r => `${r.success ? '✅' : '❌'} ${r.template}`).join(' | '),
        variant: successCount === templates.length ? 'default' : 'destructive'
      });
    } catch (error: any) {
      console.error('❌ Error testing all templates:', error);
      toast({
        title: '❌ Error al enviar templates',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSendingAll(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setIsSending(true);
    try {
      console.log('🧪 Testing WhatsApp notification with Content Template...');
      
      // Send directly to the test phone number using the welcome_v2 template
      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          phone_number: '+34699591457', // Direct to test number
          template_id: 'welcome_v2',
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
          {isSending ? 'Enviando...' : 'Probar WhatsApp (Welcome v2)'}
        </Button>

        <Button
          onClick={handleTestAllTemplates}
          disabled={isSending || isSendingAll}
          variant="default"
          size="sm"
          className="gap-2 bg-purple-600 hover:bg-purple-700"
        >
          {isSendingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isSendingAll ? 'Enviando 3 templates...' : '🧪 Probar Todos (3)'}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        💡 El botón individual envía "welcome_v2".<br/>
        🧪 "Probar Todos" envía: welcome_v2, quote_received_v2, package_assigned
      </p>
    </div>
  );
};
