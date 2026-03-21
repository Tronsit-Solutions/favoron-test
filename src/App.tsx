import { useEffect, lazy, Suspense } from "react";
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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SupportBubble from "./components/SupportBubble";

// Lazy-loaded pages
const CustomsRegulation = lazy(() => import("./pages/CustomsRegulation"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MonthlyPackageDetails = lazy(() => import("./pages/MonthlyPackageDetails"));
const AdminControl = lazy(() => import("./pages/AdminControl"));
const AdminSurveys = lazy(() => import("./pages/AdminSurveys"));
const AdminFavoronBanking = lazy(() => import("./pages/AdminFavoronBanking"));
const AdminDiscounts = lazy(() => import("./pages/AdminDiscounts"));
const AdminPlatformFees = lazy(() => import("./pages/AdminPlatformFees"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminDeliveryPoints = lazy(() => import("./pages/AdminDeliveryPoints"));
const AdminWhatsApp = lazy(() => import("./pages/AdminWhatsApp"));
const AdminReferrals = lazy(() => import("./pages/AdminReferrals"));
const AdminApplications = lazy(() => import("./pages/AdminApplications"));
const AdminCustomerExperience = lazy(() => import("./pages/AdminCustomerExperience"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const Operations = lazy(() => import("./pages/Operations"));
const AvisoLegal = lazy(() => import("./pages/AvisoLegal"));
const WorkWithUs = lazy(() => import("./pages/WorkWithUs"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));

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
            <Route path="/regulacion-aduanera" element={<CustomsRegulation />} />
            <Route path="/terminos-y-condiciones" element={<TermsAndConditions />} />
            <Route path="/aviso-legal" element={<AvisoLegal />} />
            <Route path="/trabaja-con-nosotros" element={<WorkWithUs />} />
            <Route path="/payment-callback" element={<PaymentCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SupportBubble />
          </PlatformFeesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
