import { useNavigate } from "react-router-dom";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, TrendingUp } from "lucide-react";
import MonthlyReportsTab from "@/components/admin/MonthlyReportsTab";
import { DynamicReportsTab } from "@/components/admin/DynamicReportsTab";

const AdminReports = () => {
  const navigate = useNavigate();

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/control')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Centro de Reportes</h1>
              <p className="text-muted-foreground text-sm">
                Análisis detallado y métricas de la plataforma
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="dynamic" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="dynamic" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Dashboard Dinámico
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Reportes Mensuales
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dynamic">
              <DynamicReportsTab />
            </TabsContent>

            <TabsContent value="monthly">
              <MonthlyReportsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RequireAdmin>
  );
};

export default AdminReports;
