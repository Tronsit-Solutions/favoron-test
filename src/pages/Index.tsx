
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/Dashboard";
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import TravelsHubSection from "@/components/TravelsHubSection";
import PlatformDescriptionSection from "@/components/PlatformDescriptionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import BenefitsSection from "@/components/BenefitsSection";
import CTASection from "@/components/CTASection";

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
        
        {/* All sections loaded directly */}
        <PlatformDescriptionSection />
        <TravelsHubSection />
        <HowItWorksSection />
        <BenefitsSection />
        <CTASection onOpenAuth={openAuth} />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
