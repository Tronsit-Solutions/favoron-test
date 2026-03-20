import { useNavigate } from "react-router-dom";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, TrendingUp, Calculator, Users, Clock } from "lucide-react";
import MonthlyReportsTab from "@/components/admin/MonthlyReportsTab";
import { DynamicReportsTab } from "@/components/admin/DynamicReportsTab";
import { CACAnalysisTab } from "@/components/admin/cac/CACAnalysisTab";
import { UserActivityTab } from "@/components/admin/UserActivityTab";
import { ActivityTimelineTab } from "@/components/admin/ActivityTimelineTab";

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
          <Tabs defaultValue="cac" className="space-y-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="cac" className="gap-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Unit Economics</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="dynamic" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Actividad</span>
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Mensuales</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cac">
              <CACAnalysisTab />
            </TabsContent>

            <TabsContent value="timeline">
              <ActivityTimelineTab />
            </TabsContent>

            <TabsContent value="dynamic">
              <DynamicReportsTab />
            </TabsContent>

            <TabsContent value="activity">
              <UserActivityTab />
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
