import { RequirePermission } from "@/components/auth/RequirePermission";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminApplicationsTab from "@/components/admin/AdminApplicationsTab";

const AdminApplications = () => {
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
    <RequirePermission permission="applications">
      <div className="min-h-screen bg-background">
        <DashboardHeader
          user={userData}
          onShowProfile={() => navigate('/dashboard')}
          onLogout={handleLogout}
          onGoHome={() => navigate('/')}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/control')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al Control Admin
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              Aplicaciones
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestionar solicitudes de "Trabaja con nosotros"
            </p>
          </div>

          <AdminApplicationsTab />
        </div>
      </div>
    </RequirePermission>
  );
};

export default AdminApplications;
