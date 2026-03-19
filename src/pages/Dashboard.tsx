import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { retryPendingReferral } from "@/lib/referralRetry";

const DashboardPage = () => {
  // NOTE: Operations users are redirected by RequireAuth - they never reach this component
  const { user, profile, userRole, loading } = useAuth();

  // Persist auth evidence for tab-switch recovery
  useEffect(() => {
    if (user) {
      try { sessionStorage.setItem('was_authenticated', 'true'); } catch {}
    }
  }, [user]);

  // Check if user was previously authenticated (prevents unmount during token refresh)
  const wasAuthenticated = sessionStorage.getItem('was_authenticated') === 'true';
  
  // Only show loading spinner on genuine initial load with no prior auth evidence
  if (loading && !user && !wasAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // If no user/profile but was authenticated, wait silently for re-auth (no spinner)
  if (!user || !profile) {
    return null;
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
    ui_preferences: profile.ui_preferences,
    // Banking information is now in separate financial data table
    bankAccountHolder: null,
    bankName: null,
    bankAccountType: null,
    bankAccountNumber: null,
    bankSwiftCode: null,
    stats: {
      packagesRequested: 0,
      packagesCompleted: 0,
      totalTips: 0,
      packagesDelivered: 0
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      
      {/* Dashboard content */}
      <Dashboard user={userData} />
    </div>
  );
};

export default DashboardPage;