import { useEffect } from "react";
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
import CustomsRegulation from "./pages/CustomsRegulation";
import TermsAndConditions from "./pages/TermsAndConditions";
import Dashboard from "./pages/Dashboard";
import MonthlyPackageDetails from "./pages/MonthlyPackageDetails";
import AdminControl from "./pages/AdminControl";
import AdminSurveys from "./pages/AdminSurveys";
import AdminFavoronBanking from "./pages/AdminFavoronBanking";
import AdminDiscounts from "./pages/AdminDiscounts";
import AdminPlatformFees from "./pages/AdminPlatformFees";
import AdminReports from "./pages/AdminReports";
import AdminDeliveryPoints from "./pages/AdminDeliveryPoints";
import AdminWhatsApp from "./pages/AdminWhatsApp";
import AdminReferrals from "./pages/AdminReferrals";
import AdminApplications from "./pages/AdminApplications";
import AdminCustomerExperience from "./pages/AdminCustomerExperience";
import Operations from "./pages/Operations";
import AvisoLegal from "./pages/AvisoLegal";
import WorkWithUs from "./pages/WorkWithUs";
import PaymentCallback from "./pages/PaymentCallback";
import SupportBubble from "./components/SupportBubble";

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
