
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/Dashboard";
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import BenefitsSection from "@/components/BenefitsSection";
import CTASection from "@/components/CTASection";

const Index = () => {
  const { user, profile, userRole, loading } = useAuth();
  const navigate = useNavigate();

  const openAuth = () => {
    navigate('/auth');
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

  if (user && profile && userRole) {
    // Create user object compatible with existing Dashboard component
    const userData = {
      id: user.id,
      name: `${profile.first_name} ${profile.last_name}`.trim(),
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: user.email,
      phone: profile.phone_number,
      role: userRole.role,
      trustLevel: profile.trust_level,
      avatar_url: profile.avatar_url,
      joinedAt: profile.created_at,
      // Banking information - map from database fields to component expected fields
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <NavBar onOpenAuth={openAuth} />
      <main className="pb-safe">
        <HeroSection onOpenAuth={openAuth} />
        <HowItWorksSection />
        <BenefitsSection />
        <CTASection onOpenAuth={openAuth} />
      </main>
    </div>
  );
};

export default Index;
