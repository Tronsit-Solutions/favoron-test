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
  const [isCreatingTestPackages, setIsCreatingTestPackages] = useState(false);

  const handleCreateTestPackagesForTrip = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "No se encontró usuario",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingTestPackages(true);
    try {
      console.log('🧪 Creating test packages for traveler trips...');
      
      // Get user's approved trips
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('id, from_city, to_city')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .limit(1);

      if (tripsError || !trips?.length) {
        toast({
          title: "Error",
          description: "No tienes viajes aprobados. Primero crea y aprueba un viaje.",
          variant: "destructive",
        });
        setIsCreatingTestPackages(false);
        return;
      }

      const tripId = trips[0].id;
      console.log('📦 Using trip:', tripId);

      // Get some other users to use as shoppers
      const { data: shoppers, error: shoppersError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id)
        .limit(5);

      if (shoppersError || !shoppers?.length) {
        toast({
          title: "Error",
          description: "No hay otros usuarios para usar como shoppers",
          variant: "destructive",
        });
        setIsCreatingTestPackages(false);
        return;
      }

      const shopperIds = shoppers.map(s => s.id);
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const past2Days = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const past3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const future12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);

      const testPackages = [
        // 1. matched (recién asignado, sin cotización)
        {
          user_id: shopperIds[0],
          item_description: 'iPhone 15 Pro Max 256GB - MATCHED',
          estimated_price: 1199,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'matched',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'pickup',
          quote: null,
          quote_expires_at: null,
          products_data: [{ itemDescription: 'iPhone 15 Pro Max 256GB', estimatedPrice: '1199', quantity: '1', requestType: 'online', itemLink: 'https://apple.com' }],
          additional_notes: 'Paquete de prueba - Estado MATCHED'
        },
        // 2. quote_sent (cotización activa, 24h restantes)
        {
          user_id: shopperIds[1 % shopperIds.length],
          item_description: 'MacBook Air M3 - QUOTE SENT ACTIVO',
          estimated_price: 1299,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'quote_sent',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'pickup',
          quote: { service_fee: 520, delivery_fee: 25, total: 1844, message: 'Cotización de prueba' },
          quote_expires_at: future24h.toISOString(),
          products_data: [{ itemDescription: 'MacBook Air M3', estimatedPrice: '1299', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - Estado QUOTE_SENT activo'
        },
        // 3. quote_sent EXPIRADO
        {
          user_id: shopperIds[2 % shopperIds.length],
          item_description: 'AirPods Pro 2 - QUOTE SENT EXPIRADO',
          estimated_price: 249,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'quote_sent',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'delivery',
          quote: { service_fee: 100, delivery_fee: 60, total: 409, message: 'Cotización expirada' },
          quote_expires_at: past2Days.toISOString(),
          products_data: [{ itemDescription: 'AirPods Pro 2', estimatedPrice: '249', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - QUOTE_SENT expirado'
        },
        // 4. quote_accepted (aceptada, pendiente pago, timer activo)
        {
          user_id: shopperIds[3 % shopperIds.length],
          item_description: 'iPad Pro 12.9 - QUOTE ACCEPTED ACTIVO',
          estimated_price: 1099,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'quote_accepted',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'pickup',
          quote: { service_fee: 440, delivery_fee: 25, total: 1564, message: 'Esperando pago' },
          quote_expires_at: future12h.toISOString(),
          products_data: [{ itemDescription: 'iPad Pro 12.9', estimatedPrice: '1099', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - QUOTE_ACCEPTED activo'
        },
        // 5. quote_accepted EXPIRADO (aceptó pero NO pagó) - CASO ESPECIAL
        {
          user_id: shopperIds[4 % shopperIds.length],
          item_description: 'Apple Watch Ultra 2 - ACCEPTED NO PAGÓ',
          estimated_price: 799,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'quote_accepted',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'pickup',
          quote: { service_fee: 320, delivery_fee: 25, total: 1144, message: 'Aceptó pero nunca pagó' },
          quote_expires_at: past3Days.toISOString(),
          products_data: [{ itemDescription: 'Apple Watch Ultra 2', estimatedPrice: '799', quantity: '1', requestType: 'online' }],
          additional_notes: 'CASO ESPECIAL: Shopper aceptó cotización pero NO pagó y expiró'
        },
        // 6. payment_pending_approval
        {
          user_id: shopperIds[0],
          item_description: 'Sony WH-1000XM5 - PAYMENT PENDING',
          estimated_price: 349,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'payment_pending_approval',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'delivery',
          quote: { service_fee: 140, delivery_fee: 60, total: 549 },
          quote_expires_at: null,
          products_data: [{ itemDescription: 'Sony WH-1000XM5', estimatedPrice: '349', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - PAYMENT_PENDING_APPROVAL'
        },
        // 7. pending_purchase
        {
          user_id: shopperIds[1 % shopperIds.length],
          item_description: 'Nintendo Switch OLED - PENDING PURCHASE',
          estimated_price: 349,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'pending_purchase',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'pickup',
          quote: { service_fee: 140, delivery_fee: 25, total: 514 },
          quote_expires_at: null,
          products_data: [{ itemDescription: 'Nintendo Switch OLED', estimatedPrice: '349', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - PENDING_PURCHASE'
        },
        // 8. in_transit
        {
          user_id: shopperIds[2 % shopperIds.length],
          item_description: 'DJI Mini 4 Pro - IN TRANSIT',
          estimated_price: 759,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'in_transit',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'pickup',
          quote: { service_fee: 304, delivery_fee: 25, total: 1088 },
          quote_expires_at: null,
          products_data: [{ itemDescription: 'DJI Mini 4 Pro', estimatedPrice: '759', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - IN_TRANSIT',
          tracking_info: { carrier: 'UPS', tracking_number: '1Z999AA10123456784', url: 'https://www.ups.com/track' }
        },
        // 9. received_by_traveler
        {
          user_id: shopperIds[3 % shopperIds.length],
          item_description: 'Dyson V15 Detect - RECEIVED BY TRAVELER',
          estimated_price: 749,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'received_by_traveler',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'pickup',
          quote: { service_fee: 300, delivery_fee: 25, total: 1074 },
          quote_expires_at: null,
          products_data: [{ itemDescription: 'Dyson V15 Detect', estimatedPrice: '749', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - RECEIVED_BY_TRAVELER',
          traveler_confirmation: { confirmed_at: new Date().toISOString(), photo_url: null }
        },
        // 10. pending_office_confirmation
        {
          user_id: shopperIds[4 % shopperIds.length],
          item_description: 'Bose QC Ultra - PENDING OFFICE',
          estimated_price: 429,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'pending_office_confirmation',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'pickup',
          quote: { service_fee: 172, delivery_fee: 25, total: 626 },
          quote_expires_at: null,
          products_data: [{ itemDescription: 'Bose QC Ultra', estimatedPrice: '429', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - PENDING_OFFICE_CONFIRMATION'
        },
        // 11. delivered_to_office
        {
          user_id: shopperIds[0],
          item_description: 'Kindle Paperwhite - DELIVERED TO OFFICE',
          estimated_price: 149,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'delivered_to_office',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'pickup',
          quote: { service_fee: 60, delivery_fee: 25, total: 234 },
          quote_expires_at: null,
          products_data: [{ itemDescription: 'Kindle Paperwhite', estimatedPrice: '149', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - DELIVERED_TO_OFFICE',
          office_delivery: { confirmed_at: new Date().toISOString(), confirmed_by: 'admin' }
        },
        // 12. completed
        {
          user_id: shopperIds[1 % shopperIds.length],
          item_description: 'Anker PowerCore - COMPLETED',
          estimated_price: 99,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'completed',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'delivery',
          quote: { service_fee: 40, delivery_fee: 60, total: 199 },
          quote_expires_at: null,
          products_data: [{ itemDescription: 'Anker PowerCore 26800', estimatedPrice: '99', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - COMPLETED'
        },
        // 13. cancelled
        {
          user_id: shopperIds[2 % shopperIds.length],
          item_description: 'Samsung Galaxy S24 - CANCELLED',
          estimated_price: 899,
          delivery_deadline: futureDate.toISOString(),
          matched_trip_id: tripId,
          status: 'cancelled',
          purchase_origin: 'Estados Unidos',
          package_destination: 'Guatemala',
          delivery_method: 'pickup',
          quote: { service_fee: 360, delivery_fee: 25, total: 1284 },
          quote_expires_at: null,
          products_data: [{ itemDescription: 'Samsung Galaxy S24 Ultra', estimatedPrice: '899', quantity: '1', requestType: 'online' }],
          additional_notes: 'Paquete de prueba - CANCELLED',
          rejection_reason: 'Producto no disponible'
        }
      ];

      let successCount = 0;
      let errorCount = 0;

      for (const pkg of testPackages) {
        const { error } = await supabase.from('packages').insert(pkg);
        if (error) {
          console.error('Error creating package:', pkg.item_description, error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      toast({
        title: `✅ Paquetes creados: ${successCount}/${testPackages.length}`,
        description: errorCount > 0 
          ? `${errorCount} paquetes fallaron. Revisa la consola.` 
          : `Todos los paquetes fueron creados en tu viaje ${trips[0].from_city} → ${trips[0].to_city}`,
      });

    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Error inesperado",
        description: error.message || "Error al crear paquetes de prueba",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTestPackages(false);
    }
  };

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
          onClick={handleCreateTestPackagesForTrip} 
          variant="default" 
          size="sm"
          disabled={isCreatingTestPackages}
        >
          {isCreatingTestPackages ? "🔄 Creando..." : "📦 Crear 13 Paquetes Test (Viajero)"}
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
        El botón "Crear 13 Paquetes Test" creará paquetes con todos los estados posibles en tu primer viaje aprobado.
      </p>
    </div>
  );
};

export default UserActions;