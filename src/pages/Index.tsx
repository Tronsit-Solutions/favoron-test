
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";

// Lazy load heavy components with shared retry logic
const PlatformDescriptionSection = lazyWithRetry(() => import("@/components/PlatformDescriptionSection"), "PlatformDescription");
const HowItWorksSection = lazyWithRetry(() => import("@/components/HowItWorksSection"), "HowItWorks");
const BenefitsSection = lazyWithRetry(() => import("@/components/BenefitsSection"), "Benefits");
const FAQSection = lazyWithRetry(() => import("@/components/FAQSection"), "FAQ");
const CTASection = lazyWithRetry(() => import("@/components/CTASection"), "CTA");
const TravelsHubSection = lazyWithRetry(() => import("@/components/TravelsHubSection"), "TravelsHub");

const Index = () => {
  const { user, profile, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [nativeRedirecting, setNativeRedirecting] = useState(false);

  // On native Capacitor app, skip landing page entirely
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      if (!loading) {
        setNativeRedirecting(true);
        if (user && profile) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/auth', { replace: true });
        }
      }
    }
  }, [user, profile, loading, navigate]);

  // Capture referral code immediately on landing
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('pending_referral_code', refCode);
      localStorage.setItem('pending_referral_code_ts', String(Date.now()));
      console.log('📎 Referral code captured on landing:', refCode);
    }
  }, []);

  const openAuth = (mode: "login" | "register" = "login") => {
    const refCode = new URLSearchParams(window.location.search).get('ref');
    const authUrl = refCode ? `/auth?ref=${refCode}` : '/auth';
    navigate(authUrl, { state: { mode } });
  };

  // On native, show nothing while redirecting
  if (nativeRedirecting || (Capacitor.isNativePlatform() && loading)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
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
        
        <Suspense fallback={<div className="h-96 bg-white" />}>
          <PlatformDescriptionSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-white" />}>
          <TravelsHubSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-white" />}>
          <HowItWorksSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-white" />}>
          <BenefitsSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-white" />}>
          <FAQSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-white" />}>
          <CTASection onOpenAuth={openAuth} />
        </Suspense>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
