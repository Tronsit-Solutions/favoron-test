import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useCACAnalytics } from "@/hooks/useCACAnalytics";
import { CACKPICards } from "./CACKPICards";
import { CACTable } from "./CACTable";
import { CACMonthlyTable } from "./CACMonthlyTable";
import { InvestmentForm } from "./InvestmentForm";
import { FunnelChart } from "./FunnelChart";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export const CACAnalysisTab = () => {
  const { toast } = useToast();
  const {
    channelData,
    globalKPIs,
    monthlyData,
    investments,
    isLoading,
    addInvestment,
    deleteInvestment,
    updateInvestment,
  } = useCACAnalytics();

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // KPIs Sheet
      const kpisSheet = XLSX.utils.json_to_sheet([
        { Métrica: "Usuarios Totales", Valor: globalKPIs.totalUsers },
        { Métrica: "Usuarios Activos", Valor: globalKPIs.totalActiveUsers },
        { Métrica: "Usuarios Monetizados", Valor: globalKPIs.totalMonetizedUsers },
        { Métrica: "Tasa de Activación (%)", Valor: globalKPIs.globalActivationRate.toFixed(2) },
        { Métrica: "Tasa de Monetización (%)", Valor: globalKPIs.globalMonetizationRate.toFixed(2) },
        { Métrica: "Tasa de Conversión (%)", Valor: globalKPIs.globalConversionRate.toFixed(2) },
        { Métrica: "Inversión Total (Q)", Valor: globalKPIs.totalInvestment.toFixed(2) },
        { Métrica: "Revenue Total (Q)", Valor: globalKPIs.totalRevenue.toFixed(2) },
        { Métrica: "CAC Global (Q)", Valor: globalKPIs.globalCAC.toFixed(2) },
        { Métrica: "LTV Promedio (Q)", Valor: globalKPIs.globalLTV.toFixed(2) },
        { Métrica: "Ratio LTV/CAC", Valor: globalKPIs.ltvCacRatio === Infinity ? "∞" : globalKPIs.ltvCacRatio.toFixed(2) },
      ]);
      XLSX.utils.book_append_sheet(wb, kpisSheet, "KPIs Globales");

      // Channel Data Sheet
      const channelSheet = XLSX.utils.json_to_sheet(
        channelData.map((ch) => ({
          Canal: ch.channelLabel,
          Registrados: ch.totalUsers,
          Activos: ch.activeUsers,
          Monetizados: ch.monetizedUsers,
          "Activación (%)": ch.activationRate.toFixed(2),
          "Monetización (%)": ch.monetizationRate.toFixed(2),
          "Conversión (%)": ch.overallConversionRate.toFixed(2),
          "Inversión (Q)": ch.totalInvestment.toFixed(2),
          "Revenue (Q)": ch.totalRevenue.toFixed(2),
          "CAC (Q)": ch.cacPerMonetized.toFixed(2),
          "LTV (Q)": ch.avgLTV.toFixed(2),
          "LTV/CAC": ch.ltvCacRatio === Infinity ? "∞" : ch.ltvCacRatio.toFixed(2),
        }))
      );
      XLSX.utils.book_append_sheet(wb, channelSheet, "Análisis por Canal");

      // Monthly Data Sheet
      const monthlySheet = XLSX.utils.json_to_sheet(
        monthlyData.map((m) => ({
          Mes: m.month,
          "Nuevos Usuarios": m.newUsers,
          Activos: m.activeUsers,
          Monetizados: m.monetizedUsers,
          "Tasa Conversión (%)": m.newUsers > 0 ? ((m.monetizedUsers / m.newUsers) * 100).toFixed(2) : "0",
          "Inversión (Q)": m.investment.toFixed(2),
          "CAC (Q)": m.cac.toFixed(2),
          "LTV (Q)": m.ltv.toFixed(2),
          "LTV/CAC": m.ltvCacRatio === Infinity ? "∞" : m.ltvCacRatio.toFixed(2),
        }))
      );
      XLSX.utils.book_append_sheet(wb, monthlySheet, "Análisis Mensual");

      // Investments Sheet
      const investmentsSheet = XLSX.utils.json_to_sheet(
        investments.map((inv) => ({
          Canal: inv.channel,
          Mes: inv.month,
          "Inversión (Q)": inv.investment,
          Notas: inv.notes || "",
          "Fecha Registro": new Date(inv.created_at).toLocaleDateString(),
        }))
      );
      XLSX.utils.book_append_sheet(wb, investmentsSheet, "Inversiones");

      // Download
      const date = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `analisis-cac-${date}.xlsx`);

      toast({
        title: "Excel exportado",
        description: "El archivo se ha descargado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el archivo Excel",
        variant: "destructive",
      });
    }
  };

  const handleAddInvestment = async (data: { channel: string; month: string; investment: number; notes?: string; target_audience?: string }) => {
    await addInvestment.mutateAsync(data);
  };

  const handleUpdateInvestment = async (data: { id: string; channel: string; month: string; investment: number; notes?: string; target_audience?: string }) => {
    await updateInvestment.mutateAsync(data);
  };

  const handleDeleteInvestment = async (id: string) => {
    await deleteInvestment.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Análisis de CAC</h2>
          <p className="text-sm text-muted-foreground">
            Métricas de adquisición, activación y monetización de usuarios
          </p>
        </div>
        <Button onClick={handleExportExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* KPI Cards */}
      <CACKPICards kpis={globalKPIs} />

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Investment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gestión de Inversiones</CardTitle>
            <CardDescription>
              Registra la inversión mensual por canal de adquisición
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvestmentForm
              investments={investments}
              onAddInvestment={handleAddInvestment}
              onUpdateInvestment={handleUpdateInvestment}
              onDeleteInvestment={handleDeleteInvestment}
              isLoading={addInvestment.isPending || deleteInvestment.isPending || updateInvestment.isPending}
            />
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <FunnelChart data={channelData} />
      </div>

      {/* Full Width Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas Detalladas por Canal</CardTitle>
          <CardDescription>
            Usuarios registrados, activos y monetizados con cálculos de CAC y LTV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CACTable data={channelData} />
        </CardContent>
      </Card>

      {/* Monthly CAC Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolución Mensual de CAC</CardTitle>
          <CardDescription>
            Costo de adquisición por cohorte mensual de usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CACMonthlyTable data={monthlyData} />
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">📊 Definiciones</h4>
          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
            <div>
              <strong>Registrado:</strong> Usuario con perfil en la plataforma
            </div>
            <div>
              <strong>Activo:</strong> Ha creado al menos 1 paquete
            </div>
            <div>
              <strong>Monetizado:</strong> Ha pagado al menos 1 paquete
            </div>
            <div>
              <strong>CAC:</strong> Inversión / Usuarios monetizados
            </div>
            <div>
              <strong>LTV:</strong> Revenue promedio por usuario monetizado
            </div>
            <div>
              <strong>LTV/CAC ≥ 3:</strong> Ratio saludable para el negocio
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
