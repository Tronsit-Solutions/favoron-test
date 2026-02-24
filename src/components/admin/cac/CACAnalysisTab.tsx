import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ShoppingBag, Plane, AlertTriangle } from "lucide-react";
import { useCACAnalytics } from "@/hooks/useCACAnalytics";
import { ShopperKPICards, TravelerKPICards } from "./CACKPICards";
import { CACTable } from "./CACTable";
import { CACMonthlyTable } from "./CACMonthlyTable";
import { InvestmentForm } from "./InvestmentForm";
import { IncidentCostForm } from "./IncidentCostForm";
import { FunnelChart } from "./FunnelChart";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export const CACAnalysisTab = () => {
  const { toast } = useToast();
  const {
    channelData,
    globalKPIs,
    shopperKPIs,
    travelerKPIs,
    monthlyData,
    investments,
    incidentCosts,
    isLoading,
    addInvestment,
    deleteInvestment,
    updateInvestment,
    addIncidentCost,
    updateIncidentCost,
    deleteIncidentCost,
  } = useCACAnalytics();

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Shopper KPIs Sheet
      const shopperSheet = XLSX.utils.json_to_sheet([
        { Métrica: "Shoppers Totales", Valor: shopperKPIs.totalShoppers },
        { Métrica: "Shoppers Activos", Valor: shopperKPIs.activeShoppers },
        { Métrica: "Shoppers Monetizados", Valor: shopperKPIs.monetizedShoppers },
        { Métrica: "Tasa de Activación (%)", Valor: shopperKPIs.shopperActivationRate.toFixed(2) },
        { Métrica: "Tasa de Conversión (%)", Valor: shopperKPIs.shopperConversionRate.toFixed(2) },
        { Métrica: "Inversión Shoppers (Q)", Valor: shopperKPIs.shopperInvestment.toFixed(2) },
        { Métrica: "CAC Shoppers (Q)", Valor: shopperKPIs.shopperCAC.toFixed(2) },
        { Métrica: "LTV (Q)", Valor: shopperKPIs.shopperLTV.toFixed(2) },
        { Métrica: "LTV/CAC", Valor: shopperKPIs.shopperLtvCacRatio === Infinity ? "∞" : shopperKPIs.shopperLtvCacRatio.toFixed(2) },
        { Métrica: "ARPU (Q)", Valor: shopperKPIs.shopperARPU.toFixed(2) },
        { Métrica: "Pedidos Pagados", Valor: shopperKPIs.totalPaidPackages },
        { Métrica: "CAC/Pedido (Q)", Valor: shopperKPIs.cacPerPaidOrder.toFixed(2) },
        { Métrica: "Costo Incidencias (Q)", Valor: shopperKPIs.totalIncidentCosts.toFixed(2) },
        { Métrica: "LTV Neto (Q)", Valor: shopperKPIs.netLTV.toFixed(2) },
        { Métrica: "LTV/CAC Neto", Valor: shopperKPIs.netLtvCacRatio === Infinity ? "∞" : shopperKPIs.netLtvCacRatio.toFixed(2) },
      ]);
      XLSX.utils.book_append_sheet(wb, shopperSheet, "KPIs Shoppers");

      // Traveler KPIs Sheet
      const travelerSheet = XLSX.utils.json_to_sheet([
        { Métrica: "Viajeros Totales", Valor: travelerKPIs.totalTravelers },
        { Métrica: "Viajeros Activos", Valor: travelerKPIs.activeTravelers },
        { Métrica: "Viajeros Productivos", Valor: travelerKPIs.productiveTravelers },
        { Métrica: "Inversión Viajeros (Q)", Valor: travelerKPIs.travelerInvestment.toFixed(2) },
        { Métrica: "CAC Viajeros (Q)", Valor: travelerKPIs.travelerCAC.toFixed(2) },
        { Métrica: "Pkgs/Viajero", Valor: travelerKPIs.avgPackagesPerTraveler.toFixed(2) },
        { Métrica: "Costo/Paquete (Q)", Valor: travelerKPIs.costPerDeliveredPackage.toFixed(2) },
        { Métrica: "Propinas (Q)", Valor: travelerKPIs.totalTipsDistributed.toFixed(2) },
      ]);
      XLSX.utils.book_append_sheet(wb, travelerSheet, "KPIs Viajeros");

      // Channel Data Sheet
      const channelSheet = XLSX.utils.json_to_sheet(
        channelData.map((ch) => ({
          Canal: ch.channelLabel,
          Registrados: ch.totalUsers,
          "Shoppers Activos": ch.activeUsers,
          Monetizados: ch.monetizedUsers,
          "CAC Shopper (Q)": ch.shopperCAC.toFixed(2),
          "LTV (Q)": ch.avgLTV.toFixed(2),
          "LTV/CAC": ch.ltvCacRatio === Infinity ? "∞" : ch.ltvCacRatio.toFixed(2),
          "Pedidos Pagados": ch.paidPackages,
          "CAC/Pedido (Q)": ch.cacPerPaidOrder > 0 ? ch.cacPerPaidOrder.toFixed(2) : "-",
          "Viajeros": ch.travelerUsers,
          "Viajeros Activos": ch.activeTravelers,
          "Viajeros Productivos": ch.productiveTravelers,
          "CAC Viajero (Q)": ch.travelerCAC.toFixed(2),
          "Pkgs Entregados": ch.packagesDelivered,
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
          "Inversión (Q)": m.investment.toFixed(2),
          "CAC (Q)": m.cac.toFixed(2),
          "LTV (Q)": m.ltv.toFixed(2),
          "LTV/CAC": m.ltvCacRatio === Infinity ? "∞" : m.ltvCacRatio.toFixed(2),
        }))
      );
      XLSX.utils.book_append_sheet(wb, monthlySheet, "Análisis Mensual");

      // Incident Costs Sheet
      if (incidentCosts.length > 0) {
        const incidentSheet = XLSX.utils.json_to_sheet(
          incidentCosts.map((ic) => ({
            Mes: ic.month,
            "Monto (Q)": Number(ic.amount).toFixed(2),
            Descripción: ic.description || "-",
          }))
        );
        XLSX.utils.book_append_sheet(wb, incidentSheet, "Costos Incidencias");
      }

      const date = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `analisis-cac-${date}.xlsx`);
      toast({ title: "Excel exportado", description: "El archivo se ha descargado correctamente" });
    } catch (error) {
      toast({ title: "Error al exportar", description: "No se pudo generar el archivo Excel", variant: "destructive" });
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
            Métricas de adquisición segmentadas por tipo de usuario
          </p>
        </div>
        <Button onClick={handleExportExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Investment Management + Funnel */}
      <div className="grid gap-6 lg:grid-cols-2">
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base">Costos de Incidencias</CardTitle>
            </div>
            <CardDescription>
              Registra gastos por paquetes perdidos, compensaciones, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncidentCostForm
              incidentCosts={incidentCosts}
              onAdd={async (data) => { await addIncidentCost.mutateAsync(data); }}
              onUpdate={async (data) => { await updateIncidentCost.mutateAsync(data); }}
              onDelete={async (id) => { await deleteIncidentCost.mutateAsync(id); }}
              isLoading={addIncidentCost.isPending || deleteIncidentCost.isPending || updateIncidentCost.isPending}
            />
          </CardContent>
        </Card>
      </div>

      {/* ═══════ Unit Economics: Shoppers ═══════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Unit Economics: Shoppers</h3>
        </div>
        <ShopperKPICards kpis={shopperKPIs} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métricas por Canal — Shoppers</CardTitle>
            <CardDescription>
              Registrados → Activos (crearon paquete) → Monetizados (pagaron)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CACTable data={channelData} mode="shopper" />
          </CardContent>
        </Card>
      </div>

      {/* ═══════ Unit Economics: Viajeros ═══════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Unit Economics: Viajeros</h3>
        </div>
        <TravelerKPICards kpis={travelerKPIs} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Métricas por Canal — Viajeros</CardTitle>
              <CardDescription>
                Con trip → Activos (trip aprobado) → Productivos (entregaron paquetes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CACTable data={channelData} mode="traveler" />
            </CardContent>
          </Card>
          <FunnelChart data={channelData} mode="traveler" />
        </div>
      </div>

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

      {/* Definitions */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">📊 Definiciones</h4>
          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <div>
              <strong className="text-blue-600">Shoppers:</strong>
              <ul className="ml-4 mt-1 space-y-1 list-disc">
                <li><strong>Activo:</strong> Ha creado al menos 1 paquete</li>
                <li><strong>Monetizado:</strong> Ha pagado al menos 1 paquete</li>
                <li><strong>CAC:</strong> Inversión shoppers / Monetizados</li>
                <li><strong>LTV:</strong> Revenue promedio por monetizado</li>
                <li><strong>LTV Neto:</strong> (Revenue - Costos Incidencias) / Monetizados</li>
              </ul>
            </div>
            <div>
              <strong className="text-orange-600">Viajeros:</strong>
              <ul className="ml-4 mt-1 space-y-1 list-disc">
                <li><strong>Activo:</strong> Con trip aprobado</li>
                <li><strong>Productivo:</strong> Entregó al menos 1 paquete</li>
                <li><strong>CAC:</strong> Inversión viajeros / Productivos</li>
                <li><strong>Costo/Pkg:</strong> Inversión viajeros / Paquetes entregados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
