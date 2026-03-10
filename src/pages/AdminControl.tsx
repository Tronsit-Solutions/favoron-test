import { useState, useEffect } from "react";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Package, TrendingUp, Settings, ClipboardList, Building2, Ticket, DollarSign, MapPin, FlaskConical, UserPlus, Briefcase } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminControl = () => {
  const { user, profile, userRole } = useAuth();
  const [isCreatingTestPackages, setIsCreatingTestPackages] = useState(false);


  const handleCreateTestPackagesForTrip = async () => {
    if (!user) {
      toast({ title: "Error", description: "Debes estar autenticado", variant: "destructive" });
      return;
    }

    setIsCreatingTestPackages(true);
    try {
      // Get user's first approved trip
      const { data: trips, error: tripError } = await supabase
        .from('trips')
        .select('id, arrival_date')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('arrival_date', { ascending: true })
        .limit(1);

      if (tripError || !trips || trips.length === 0) {
        toast({ title: "Error", description: "No tienes viajes aprobados", variant: "destructive" });
        setIsCreatingTestPackages(false);
        return;
      }

      const tripId = trips[0].id;

      // Get other users to use as shoppers
      const { data: otherUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id)
        .limit(5);

      if (usersError || !otherUsers || otherUsers.length === 0) {
        toast({ title: "Error", description: "No hay otros usuarios para asignar como shoppers", variant: "destructive" });
        setIsCreatingTestPackages(false);
        return;
      }

      const shopperIds = otherUsers.map(u => u.id);
      const now = new Date();
      const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const future48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const baseQuote = {
        service_fee: 40,
        delivery_fee: 25,
        base_price: 100,
        total: 165,
        weight_fee: 0,
        currency: 'USD'
      };

      const baseProduct = [{
        name: "Producto de Prueba",
        price: 100,
        quantity: 1,
        url: "https://example.com/product"
      }];

      const packagesToCreate = [
        { status: 'matched', desc: 'Paquete Matched - Sin cotización', quote_expires_at: null },
        { status: 'quote_sent', desc: 'Quote Sent - Timer activo', quote_expires_at: future24h.toISOString() },
        { status: 'quote_sent', desc: 'Quote Sent - EXPIRADO', quote_expires_at: past24h.toISOString() },
        { status: 'quote_accepted', desc: 'Quote Accepted - Pendiente pago', quote_expires_at: future48h.toISOString() },
        { status: 'quote_accepted', desc: 'Quote Accepted - EXPIRÓ SIN PAGAR', quote_expires_at: past24h.toISOString() },
        { status: 'payment_pending_approval', desc: 'Pago pendiente aprobación', quote_expires_at: null },
        { status: 'pending_purchase', desc: 'Pendiente de compra', quote_expires_at: null },
        { status: 'in_transit', desc: 'En tránsito al viajero', quote_expires_at: null },
        { status: 'received_by_traveler', desc: 'Recibido por viajero', quote_expires_at: null },
        { status: 'pending_office_confirmation', desc: 'Pendiente confirmación oficina', quote_expires_at: null },
        { status: 'delivered_to_office', desc: 'Entregado en oficina', quote_expires_at: null },
        { status: 'completed', desc: 'Completado exitosamente', quote_expires_at: null },
        { status: 'cancelled', desc: 'Paquete Cancelado', quote_expires_at: null },
      ];

      const insertData = packagesToCreate.map((pkg, idx) => ({
        user_id: shopperIds[idx % shopperIds.length],
        item_description: pkg.desc,
        estimated_price: 100 + (idx * 10),
        delivery_deadline: future48h.toISOString(),
        matched_trip_id: tripId,
        status: pkg.status,
        purchase_origin: 'Estados Unidos',
        package_destination: 'Guatemala',
        delivery_method: idx % 2 === 0 ? 'pickup' : 'delivery',
        quote: baseQuote,
        quote_expires_at: pkg.quote_expires_at,
        products_data: baseProduct,
        rejection_reason: pkg.status === 'cancelled' ? 'Prueba de cancelación' : null,
      }));

      const { error: insertError } = await supabase
        .from('packages')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting packages:', insertError);
        toast({ title: "Error", description: insertError.message, variant: "destructive" });
      } else {
        toast({ title: "✅ Éxito", description: `Se crearon 13 paquetes de prueba en tu viaje` });
      }
    } catch (err) {
      console.error('Error:', err);
      toast({ title: "Error", description: "Error inesperado", variant: "destructive" });
    } finally {
      setIsCreatingTestPackages(false);
    }
  };
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const userData = {
    id: user?.id,
    name: `${profile?.first_name} ${profile?.last_name}`.trim(),
    firstName: profile?.first_name,
    lastName: profile?.last_name,
    email: user?.email,
    role: userRole?.role || 'user',
    trust_level: profile?.trust_level,
    avatar_url: profile?.avatar_url,
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={userData}
          onShowProfile={() => navigate('/dashboard')}
          onLogout={handleLogout}
          onGoHome={() => navigate('/')}
        />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Control Admin
            </h1>
            <p className="text-muted-foreground mt-2">
              Panel de control y configuración administrativa
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dashboard')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestión de Usuarios
                </CardTitle>
                <CardDescription>
                  Administrar usuarios, roles y permisos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Abrir Dashboard Admin
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Paquetes
                </CardTitle>
                <CardDescription>
                  Ver y gestionar todos los paquetes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                  Ver Paquetes
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Reportes
                </CardTitle>
                <CardDescription>
                  Estadísticas y análisis del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/admin/reports')}>
                  Ver Reportes
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Info Bancaria Favorón
                </CardTitle>
                <CardDescription>
                  Gestionar información de pago de la empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/admin/favoron-banking')}>
                  Ver Información
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Encuestas
                </CardTitle>
                <CardDescription>
                  Ver y analizar respuestas de encuestas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/admin/surveys')}>
                  Ver Encuestas
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Códigos de Descuento
                </CardTitle>
                <CardDescription>
                  Gestionar códigos promocionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/admin/discounts')}>
                  Gestionar Códigos
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tarifas de la Plataforma
                </CardTitle>
                <CardDescription>
                  Gestionar comisiones, envíos y penalizaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/admin/platform-fees')}>
                  Configurar Tarifas
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Puntos de Entrega
                </CardTitle>
                <CardDescription>
                  Gestionar puntos de entrega internacionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/admin/delivery-points')}>
                  Ver Puntos
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/referrals')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Programa de Referidos
                </CardTitle>
                <CardDescription>
                  Configurar recompensas, descuentos y ver reporte de referidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Ver Programa
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/applications')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Aplicaciones
                </CardTitle>
                <CardDescription>
                  Gestionar solicitudes de "Trabaja con nosotros"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Ver Aplicaciones
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración
                </CardTitle>
                <CardDescription>
                  Ajustes generales del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  Próximamente
                </Button>
              </CardContent>
            </Card>


            <Card className="hover:shadow-lg transition-shadow border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <FlaskConical className="h-5 w-5" />
                  Datos de Prueba
                </CardTitle>
                <CardDescription>
                  Crear paquetes de prueba para visualizar estados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                  onClick={handleCreateTestPackagesForTrip}
                  disabled={isCreatingTestPackages}
                >
                  {isCreatingTestPackages ? "Creando..." : "📦 Crear 13 Paquetes Test"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
};

export default AdminControl;
