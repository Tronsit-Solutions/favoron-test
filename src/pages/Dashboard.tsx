import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useModalProtection } from "@/hooks/useModalProtection";
import { supabase } from "@/integrations/supabase/client";

const DashboardPage = () => {
  const { user, profile, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasOpenModals } = useModalProtection();
useEffect(() => {
  // Robust auth guard with modal and visibility protection
  const wasAuthenticated = sessionStorage.getItem('was_authenticated') === 'true';
  let cancelled = false;

  const delay = (typeof hasOpenModals === 'function' && hasOpenModals()) ? 30000 : 10000; // 30s if modal open, else 10s

  const checkAndMaybeRedirect = async () => {
    if (cancelled) return;

    // If authenticated, persist flag and stop
    if (user) {
      try { sessionStorage.setItem('was_authenticated', 'true'); } catch {}
      return;
    }

    // Avoid redirecting while loading, hidden tab, or offline
    if (loading || document.hidden || !navigator.onLine) return;

    // If previously authenticated, be conservative (transient null user)
    if (wasAuthenticated) return;

    // Final verification with Supabase to avoid race conditions
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        try { sessionStorage.setItem('was_authenticated', 'true'); } catch {}
        return;
      }
    } catch {
      // If getSession fails, do not be aggressive
      return;
    }

    if (!cancelled) navigate('/auth', { state: { from: location } });
  };

  const timer = setTimeout(checkAndMaybeRedirect, delay);
  return () => { cancelled = true; clearTimeout(timer); };
}, [user, loading, navigate, hasOpenModals, location]);

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