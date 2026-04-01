
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Suspense, lazy, ComponentType, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";

// Retry wrapper for lazy imports to handle chunk loading failures after deployments
const lazyWithRetry = <T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      // Chunk failed to load - likely stale cache after deployment
      console.warn('Chunk load failed, reloading page...', error);
      window.location.reload();
      // Return a dummy component to satisfy types (won't actually render)
      return { default: (() => null) as unknown as T };
    }
  });

// Lazy load heavy components with retry logic
const PlatformDescriptionSection = lazyWithRetry(() => import("@/components/PlatformDescriptionSection"));
const HowItWorksSection = lazyWithRetry(() => import("@/components/HowItWorksSection"));
const BenefitsSection = lazyWithRetry(() => import("@/components/BenefitsSection"));
const FAQSection = lazyWithRetry(() => import("@/components/FAQSection"));
const CTASection = lazyWithRetry(() => import("@/components/CTASection"));
const TravelsHubSection = lazyWithRetry(() => import("@/components/TravelsHubSection"));

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

  // No blocking on auth - landing page renders immediately
  // User-specific content (NavBar, HeroSection) handles its own loading state

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
          <FAQSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-blue-50 to-white animate-pulse" />}>
          <CTASection onOpenAuth={openAuth} />
        </Suspense>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
