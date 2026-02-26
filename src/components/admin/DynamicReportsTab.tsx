import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDynamicReports } from "@/hooks/useDynamicReports";
import { useAcquisitionAnalytics } from "@/hooks/useAcquisitionAnalytics";
import { useTravelerTipsReport } from "@/hooks/useTravelerTipsReport";
import { UserGrowthChart } from "./charts/UserGrowthChart";
import { PackagesChart } from "./charts/PackagesChart";
import { TripsChart } from "./charts/TripsChart";
import { AvgPackageValueChart } from "./charts/AvgPackageValueChart";
import { GMVChart } from "./charts/GMVChart";
import { AcquisitionChart } from "./charts/AcquisitionChart";
import { AcquisitionSurveyTable } from "./charts/AcquisitionSurveyTable";
import { KPICards } from "./charts/KPICards";
import { TravelerTipsCard } from "./charts/TravelerTipsCard";
import { BarChart3, Download, Calendar } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

export const DynamicReportsTab = () => {
  const [months, setMonths] = useState<number>(12);
  const { monthlyData, kpis, isLoading } = useDynamicReports(months);
  const { acquisitionData, summaryKPIs, isLoading: acquisitionLoading } = useAcquisitionAnalytics();
  const { data: travelerTipsData, isLoading: travelerTipsLoading } = useTravelerTipsReport();
  const { toast } = useToast();

  const handleExportExcel = () => {
    if (monthlyData.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay datos disponibles para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Users sheet
      const usersData = monthlyData.map(d => ({
        'Mes': d.monthLabel,
        'Nuevos Usuarios': d.newUsers,
        'Total Acumulado': d.accumulatedUsers,
      }));

      // Packages sheet
      const packagesData = monthlyData.map(d => ({
        'Mes': d.monthLabel,
        'Total Paquetes': d.totalPackages,
        'Completados': d.completedPackages,
        'En Proceso': d.pendingPackages,
        'Cancelados': d.cancelledPackages,
        'Tasa Conversión (%)': d.conversionRate.toFixed(1),
      }));

      // Trips sheet
      const tripsData = monthlyData.map(d => ({
        'Mes': d.monthLabel,
        'Total Viajes': d.totalTrips,
        'Aprobados': d.approvedTrips,
        'Completados': d.completedTrips,
        'Tasa Aprobación (%)': d.tripApprovalRate.toFixed(1),
      }));

      // Revenue sheet
      const revenueData = monthlyData.map(d => ({
        'Mes': d.monthLabel,
        'GMV (Q)': d.gmv.toFixed(2),
        'Ingresos Favorón (Q)': d.favoronRevenue.toFixed(2),
        'Propinas Viajeros (Q)': d.travelerTips.toFixed(2),
        'Margen (%)': d.profitMargin.toFixed(1),
      }));

      // KPIs sheet
      const kpisData = [{
        'Total Usuarios': kpis.totalUsers,
        'Total Solicitudes': kpis.totalPackages,
        'Total Viajes': kpis.totalTrips,
        'Ingresos Totales (Q)': kpis.totalRevenue.toFixed(2),
        'Propinas Totales (Q)': kpis.totalTips.toFixed(2),
        'Tasa Completación (%)': kpis.completionRate.toFixed(1),
        'Valor Promedio (Q)': kpis.avgPackageValue.toFixed(2),
        'Crecimiento Usuarios MoM (%)': kpis.momUserGrowth.toFixed(1),
        'Crecimiento Paquetes MoM (%)': kpis.momPackageGrowth.toFixed(1),
        'Crecimiento Ingresos MoM (%)': kpis.momRevenueGrowth.toFixed(1),
      }];

      // Acquisition sheet
      const acquisitionSheetData = acquisitionData.map(d => ({
        'Canal': d.channelLabel,
        'Usuarios': d.totalUsers,
        'Paquetes Totales': d.totalPackages,
        'Paquetes Pagados': d.paidPackages,
        'Tasa Conversión (%)': d.conversionRate.toFixed(1),
        'Service Fee (Q)': d.totalServiceFee.toFixed(2),
        'Revenue Total (Q)': d.totalRevenue.toFixed(2),
        'Revenue por Usuario (Q)': d.avgRevenuePerUser.toFixed(2),
      }));

      // Traveler Tips sheet
      const travelerTipsSheetData = [{
        'Viajeros Activos': travelerTipsData.totalTravelersWithCompleted,
        'Paquetes Entregados': travelerTipsData.totalCompletedPackages,
        'Total Tips (Q)': travelerTipsData.totalTipsDistributed.toFixed(2),
        'Promedio por Paquete (Q)': travelerTipsData.avgTipPerPackage.toFixed(2),
        'Promedio por Viajero (Q)': travelerTipsData.avgTipPerTraveler.toFixed(2),
      }];

      const wb = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpisData), "KPIs");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersData), "Usuarios");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(packagesData), "Paquetes");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tripsData), "Viajes");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(revenueData), "Ingresos");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(acquisitionSheetData), "Adquisición");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(travelerTipsSheetData), "Tips Viajeros");

      const filename = `Reportes_Dinamicos_Favoron_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: "Descarga exitosa",
        description: `El reporte se ha descargado como ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
        variant: "destructive",
      });
    }
  };

  if (isLoading || acquisitionLoading || travelerTipsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Dashboard Dinámico
          </h2>
          <p className="text-muted-foreground">
            Visualización interactiva del crecimiento y métricas clave
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="months" className="text-sm whitespace-nowrap">
              <Calendar className="h-4 w-4 inline mr-1" />
              Período:
            </Label>
            <Select
              value={months.toString()}
              onValueChange={(value) => setMonths(parseInt(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
                <SelectItem value="24">Últimos 24 meses</SelectItem>
                <SelectItem value="36">Últimos 3 años</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={monthlyData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {monthlyData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
            <p className="text-muted-foreground">
              Los reportes dinámicos aparecerán aquí cuando tengas datos registrados
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <KPICards kpis={kpis} />

          {/* Traveler Tips Card */}
          <TravelerTipsCard data={travelerTipsData} isLoading={travelerTipsLoading} />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UserGrowthChart data={monthlyData} />
            <PackagesChart data={monthlyData} />
            <TripsChart data={monthlyData} />
            <GMVChart data={monthlyData} />
            <AvgPackageValueChart data={monthlyData} overallAvg={kpis.avgPackageValue} />
          </div>

          {/* Acquisition Analysis */}
          <AcquisitionChart data={acquisitionData} summaryKPIs={summaryKPIs} />

          {/* Acquisition Survey Responses Table */}
          <AcquisitionSurveyTable />
        </>
      )}
    </div>
  );
};
