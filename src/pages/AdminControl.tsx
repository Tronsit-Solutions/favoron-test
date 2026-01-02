import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Package, TrendingUp, Settings, ClipboardList, Building2, Ticket, DollarSign, MapPin } from "lucide-react";

const AdminControl = () => {
  const { user, profile, userRole } = useAuth();
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
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
};

export default AdminControl;
