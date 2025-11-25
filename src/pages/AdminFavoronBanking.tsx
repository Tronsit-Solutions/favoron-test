import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";
import { AdminFavoronBankingInfo } from "@/components/admin/AdminFavoronBankingInfo";

const AdminFavoronBanking = () => {
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
              <Building2 className="h-8 w-8 text-primary" />
              Información Bancaria de Favorón
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona la cuenta bancaria donde los shoppers realizan sus pagos
            </p>
          </div>

          <AdminFavoronBankingInfo />
        </div>
      </div>
    </RequireAdmin>
  );
};

export default AdminFavoronBanking;
