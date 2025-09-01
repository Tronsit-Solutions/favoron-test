import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FocusStabilizer } from "@/components/FocusStabilizer";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CustomsRegulation from "./pages/CustomsRegulation";
import TermsAndConditions from "./pages/TermsAndConditions";
import Dashboard from "./pages/Dashboard";
import InputDebug from "./pages/InputDebug";

const queryClient = new QueryClient();

const App = () => {

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FocusStabilizer />
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
            <Route path="/input-debug" element={<InputDebug />} />
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
};

export default App;
