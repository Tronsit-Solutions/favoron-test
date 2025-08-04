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
      </div>
      <Separator className="my-4" />
      <p className="text-sm text-muted-foreground">
        Usa estas opciones para generar datos de prueba y probar la funcionalidad. 
        El botón "Test Email" enviará un email de prueba para verificar la configuración de Resend.
      </p>
    </div>
  );
};

export default UserActions;