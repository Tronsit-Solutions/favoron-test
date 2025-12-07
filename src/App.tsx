import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/auth/RequireAuth";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            <Route path="/regulacion-aduanera" element={<CustomsRegulation />} />
            <Route path="/terminos-y-condiciones" element={<TermsAndConditions />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
