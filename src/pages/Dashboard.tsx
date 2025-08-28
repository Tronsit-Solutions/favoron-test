import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const DashboardPage = () => {
  const { user, profile, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Will redirect to auth
  }

  // Create user object compatible with existing Dashboard component
  const userData = {
    id: user.id,
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: user.email,
    phone: profile.phone_number,
    role: userRole?.role || 'user',
    trustLevel: profile.trust_level,
    avatar_url: profile.avatar_url,
    joinedAt: profile.created_at,
    bankAccountHolder: profile.bank_account_holder,
    bankName: profile.bank_name,
    bankAccountType: profile.bank_account_type,
    bankAccountNumber: profile.bank_account_number,
    bankSwiftCode: profile.bank_swift_code,
    stats: {
      packagesRequested: 0,
      packagesCompleted: 0,
      totalTips: 0,
      packagesDelivered: 0
    }
  };
  
  return <Dashboard user={userData} />;
};

export default DashboardPage;