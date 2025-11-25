import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useModalProtection } from "@/hooks/useModalProtection";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DashboardPage = () => {
  const { user, profile, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasOpenModals } = useModalProtection();

  // Simplificado: RequireAuth ya maneja el redirect
  useEffect(() => {
    if (user) {
      try { 
        sessionStorage.setItem('was_authenticated', 'true'); 
      } catch {}
    }
  }, [user]);

  // Only show loading spinner if we're genuinely loading (not just transient states)
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user/profile, but avoid unmounting during transient loading
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