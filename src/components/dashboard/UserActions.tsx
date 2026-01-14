import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface UserActionsProps {
  onLoadTestData: () => void;
  onLoadTestPackage: () => void;
  onLoadTestTrip: () => void;
}

const UserActions = ({ onLoadTestData, onLoadTestPackage, onLoadTestTrip }: UserActionsProps) => {
  const { user } = useAuth();
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);

  const handleTestEmail = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "No se encontró email del usuario",
        variant: "destructive",
      });
      return;
    }

    setIsTestingEmail(true);
    try {
      console.log('🧪 Testing email for user:', user.email);
      
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { email: user.email }
      });

      if (error) {
        console.error('❌ Test email error:', error);
        toast({
          title: "Error al enviar email de prueba",
          description: error.message || "Error desconocido",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Test email response:', data);
      
      if (data.success) {
        toast({
          title: "✅ Email de prueba enviado",
          description: `Email enviado exitosamente a ${user.email}`,
        });
      } else {
        toast({
          title: "❌ Error en el email",
          description: data.error || "Error al enviar email",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Error inesperado",
        description: error.message || "Error al probar email",
        variant: "destructive",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "No se encontró usuario",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWhatsApp(true);
    try {
      console.log('🧪 Testing WhatsApp for user:', user.id);
      
      // First get the user's phone number from the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.phone_number) {
        toast({
          title: "Error",
          description: "No se encontró número de teléfono en tu perfil. Por favor actualiza tu perfil primero.",
          variant: "destructive",
        });
        setIsTestingWhatsApp(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: { 
          phone_number: profile.phone_number,
          template_id: 'welcome_v2',
          variables: { "1": "Usuario de Prueba" }
        }
      });

      if (error) {
        console.error('❌ Test WhatsApp error:', error);
        toast({
          title: "Error al enviar WhatsApp de prueba",
          description: error.message || "Error desconocido",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Test WhatsApp response:', data);
      
      if (data.success) {
        toast({
          title: "✅ WhatsApp de prueba enviado",
          description: `Mensaje enviado a ${profile.phone_number}`,
        });
      } else {
        toast({
          title: "❌ Error en WhatsApp",
          description: data.error || "Error al enviar mensaje",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Error inesperado",
        description: error.message || "Error al probar WhatsApp",
        variant: "destructive",
      });
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Acciones de Prueba</h3>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onLoadTestData} variant="outline" size="sm">
          Cargar Datos de Prueba
        </Button>
        <Button onClick={onLoadTestPackage} variant="outline" size="sm">
          Crear Paquete de Prueba
        </Button>
        <Button onClick={onLoadTestTrip} variant="outline" size="sm">
          Crear Viaje de Prueba
        </Button>
        <Button 
          onClick={handleTestEmail} 
          variant="secondary" 
          size="sm"
          disabled={isTestingEmail}
        >
          {isTestingEmail ? "🔄 Enviando..." : "📧 Test Email"}
        </Button>
        <Button 
          onClick={handleTestWhatsApp} 
          variant="secondary" 
          size="sm"
          disabled={isTestingWhatsApp}
        >
          {isTestingWhatsApp ? "🔄 Enviando..." : "💬 Test WhatsApp"}
        </Button>
      </div>
      <Separator className="my-4" />
      <p className="text-sm text-muted-foreground">
        Usa estas opciones para generar datos de prueba y probar la funcionalidad. 
        Los botones de test enviarán notificaciones de prueba a tu email y WhatsApp configurados en tu perfil.
      </p>
    </div>
  );
};

export default UserActions;