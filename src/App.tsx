import { useEffect, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PlatformFeesProvider } from "@/contexts/PlatformFeesContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireOperations } from "@/components/auth/RequireOperations";
import { toast } from "sonner";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import SupportBubble from "./components/SupportBubble";
// TEMP: direct form test page (remove after testing)
import PackageRequestForm from "./components/PackageRequestForm";

// Lazy-loaded pages with retry logic for chunk failures
const CustomsRegulation = lazyWithRetry(() => import("./pages/CustomsRegulation"), "CustomsRegulation");
const CompleteProfile = lazyWithRetry(() => import("./pages/CompleteProfile"), "CompleteProfile");
const TermsAndConditions = lazyWithRetry(() => import("./pages/TermsAndConditions"), "TermsAndConditions");
const MonthlyPackageDetails = lazyWithRetry(() => import("./pages/MonthlyPackageDetails"), "MonthlyPackageDetails");
const AdminControl = lazyWithRetry(() => import("./pages/AdminControl"), "AdminControl");
const AdminSurveys = lazyWithRetry(() => import("./pages/AdminSurveys"), "AdminSurveys");
const AdminFavoronBanking = lazyWithRetry(() => import("./pages/AdminFavoronBanking"), "AdminFavoronBanking");
const AdminDiscounts = lazyWithRetry(() => import("./pages/AdminDiscounts"), "AdminDiscounts");
const AdminPlatformFees = lazyWithRetry(() => import("./pages/AdminPlatformFees"), "AdminPlatformFees");
const AdminReports = lazyWithRetry(() => import("./pages/AdminReports"), "AdminReports");
const AdminDeliveryPoints = lazyWithRetry(() => import("./pages/AdminDeliveryPoints"), "AdminDeliveryPoints");
const AdminWhatsApp = lazyWithRetry(() => import("./pages/AdminWhatsApp"), "AdminWhatsApp");
const AdminReferrals = lazyWithRetry(() => import("./pages/AdminReferrals"), "AdminReferrals");
const AdminApplications = lazyWithRetry(() => import("./pages/AdminApplications"), "AdminApplications");
const AdminCustomerExperience = lazyWithRetry(() => import("./pages/AdminCustomerExperience"), "AdminCustomerExperience");
const AdminRoles = lazyWithRetry(() => import("./pages/AdminRoles"), "AdminRoles");
const Operations = lazyWithRetry(() => import("./pages/Operations"), "Operations");
const AvisoLegal = lazyWithRetry(() => import("./pages/AvisoLegal"), "AvisoLegal");
const WorkWithUs = lazyWithRetry(() => import("./pages/WorkWithUs"), "WorkWithUs");
const PaymentCallback = lazyWithRetry(() => import("./pages/PaymentCallback"), "PaymentCallback");

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      console.error("[App] Unhandled rejection:", event.reason);
      toast.error("Ocurrió un error inesperado. Si persiste, recarga la página.");
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PlatformFeesProvider>
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/complete-profile" element={
                    <RequireAuth allowIncompleteProfile>
                      <CompleteProfile />
                    </RequireAuth>
                  } />
                  <Route path="/dashboard/*" element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  } />
                  <Route path="/admin/reports/month/:month" element={
                    <RequireAuth>
                      <MonthlyPackageDetails />
                    </RequireAuth>
                  } />
                  <Route path="/admin/control" element={
                    <RequireAuth>
                      <AdminControl />
                    </RequireAuth>
                  } />
                  <Route path="/admin/surveys" element={
                    <RequireAuth>
                      <AdminSurveys />
                    </RequireAuth>
                  } />
                  <Route path="/admin/favoron-banking" element={
                    <RequireAuth>
                      <AdminFavoronBanking />
                    </RequireAuth>
                  } />
                  <Route path="/admin/discounts" element={
                    <RequireAuth>
                      <AdminDiscounts />
                    </RequireAuth>
                  } />
                  <Route path="/admin/platform-fees" element={
                    <RequireAuth>
                      <AdminPlatformFees />
                    </RequireAuth>
                  } />
                  <Route path="/admin/reports" element={
                    <RequireAuth>
                      <AdminReports />
                    </RequireAuth>
                  } />
                  <Route path="/admin/delivery-points" element={
                    <RequireAuth>
                      <AdminDeliveryPoints />
                    </RequireAuth>
                  } />
                  <Route path="/admin/whatsapp" element={
                    <RequireAuth>
                      <AdminWhatsApp />
                    </RequireAuth>
                  } />
                  <Route path="/admin/referrals" element={
                    <RequireAuth>
                      <AdminReferrals />
                    </RequireAuth>
                  } />
                  <Route path="/admin/applications" element={
                    <RequireAuth>
                      <AdminApplications />
                    </RequireAuth>
                  } />
                  <Route path="/admin/customer-experience" element={
                    <RequireAuth>
                      <AdminCustomerExperience />
                    </RequireAuth>
                  } />
                  <Route path="/admin/roles" element={
                    <RequireAuth>
                      <AdminRoles />
                    </RequireAuth>
                  } />
                  <Route path="/operations" element={
                    <RequireOperations>
                      <Operations />
                    </RequireOperations>
                  } />
                  {/* TEMP: test PackageRequestForm without auth — remove after testing */}
                  <Route path="/test-form" element={<PackageRequestForm isOpen={true} onClose={() => { }} onSubmit={(d) => { console.log('submit', d); }} />} />
                  <Route path="/regulacion-aduanera" element={<CustomsRegulation />} />
                  <Route path="/terminos-y-condiciones" element={<TermsAndConditions />} />
                  <Route path="/aviso-legal" element={<AvisoLegal />} />
                  <Route path="/trabaja-con-nosotros" element={<WorkWithUs />} />
                  <Route path="/payment-callback" element={<PaymentCallback />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <SupportBubble />
            </PlatformFeesProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;