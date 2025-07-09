
import { useState } from "react";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import BenefitsSection from "@/components/BenefitsSection";
import CTASection from "@/components/CTASection";

const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [user, setUser] = useState<any>(null);

  const handleLogin = (userData: any) => {
    // Add admin role for demo purposes
    const userWithRole = {
      ...userData,
      role: userData.email === 'admin@favaron.com' ? 'admin' : 'user',
      stats: userData.stats || {
        packagesRequested: 0,
        packagesCompleted: 0,
        totalTips: 0,
        packagesDelivered: 0
      }
    };
    setUser(userWithRole);
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <NavBar onOpenAuth={openAuthModal} />
      <main className="pb-safe">
        <HeroSection onOpenAuth={openAuthModal} />
        <HowItWorksSection />
        <BenefitsSection />
        <CTASection onOpenAuth={openAuthModal} />
      </main>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        mode={authMode}
        onAuth={handleLogin}
      />
    </div>
  );
};

export default Index;
