
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Dashboard from "@/components/Dashboard";
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";

// Lazy load heavy components to speed up initial load
const TravelsHubSection = lazy(() => import("@/components/TravelsHubSection"));
const PlatformDescriptionSection = lazy(() => import("@/components/PlatformDescriptionSection"));
const HowItWorksSection = lazy(() => import("@/components/HowItWorksSection"));
const BenefitsSection = lazy(() => import("@/components/BenefitsSection"));
const CTASection = lazy(() => import("@/components/CTASection"));

const Index = () => {
  const { user, profile, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const openAuth = (mode: "login" | "register" = "login") => {
    navigate('/auth', { state: { mode } });
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <NavBar 
        onOpenAuth={openAuth} 
        isAuthenticated={!!(user && profile)} 
        onSignOut={signOut}
        user={profile}
        loading={loading}
      />
      <main className="pb-safe">
        <HeroSection 
          onOpenAuth={openAuth} 
          isAuthenticated={!!(user && profile)}
          userName={profile?.first_name}
          userRole={userRole}
        />
        
        {/* Lazy load remaining sections with loading fallbacks */}
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-blue-50 to-white animate-pulse" />}>
          <PlatformDescriptionSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-blue-50 to-white animate-pulse" />}>
          <TravelsHubSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-blue-50 to-white animate-pulse" />}>
          <HowItWorksSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-blue-50 to-white animate-pulse" />}>
          <BenefitsSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-blue-50 to-white animate-pulse" />}>
          <CTASection onOpenAuth={openAuth} />
        </Suspense>
      </main>
    </div>
  );
};

export default Index;
