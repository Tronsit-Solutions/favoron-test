import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { 
  TrendingUp, 
  Package, 
  Plane, 
  CheckCircle, 
  DollarSign, 
  Calendar,
  BarChart3,
  MapPin,
  Download
} from "lucide-react";

interface MonthlyReport {
  period_year: number;
  period_month: number;
  month_name: string;
  total_packages: number;
  total_trips: number;
  successful_matches: number;
  completed_deliveries: number;
  pending_requests: number;
  total_revenue: number;
  traveler_tips: number;
  favoron_revenue: number;
  average_ticket: number;
  gmv_total: number;
  packages_by_status: any;
  trips_by_status: any;
  top_destinations: any;
  top_origins: any;
}

const MonthlyReportsTab = () => {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMonthlyReports();
  }, []);

  const fetchMonthlyReports = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_monthly_reports');
      
      if (error) {
        throw error;
      }
      
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching monthly reports:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes mensuales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: string, count: number) => {
    const statusMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
      'pending_approval': { label: 'Pendiente', variant: 'warning' },
      'approved': { label: 'Aprobado', variant: 'success' },
      'matched': { label: 'Matched', variant: 'success' },
      'completed': { label: 'Completado', variant: 'success' },
      'delivered_to_office': { label: 'Entregado', variant: 'success' },
      'received_by_traveler': { label: 'Recibido', variant: 'success' },
      'rejected': { label: 'Rechazado', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'default' as const };
    return (
      <Badge key={status} variant={config.variant} className="mr-2 mb-1">
        {config.label}: {count}
      </Badge>
    );
  };

  const getTopItems = (items: any, limit = 3) => {
    if (!items || typeof items !== 'object') return [];
    return Object.entries(items)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, limit);
  };

  const toggleMonthExpansion = (monthKey: string) => {
    setExpandedMonth(expandedMonth === monthKey ? null : monthKey);
  };

  const exportToExcel = () => {
    if (reports.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay datos disponibles para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Preparar datos para el resumen general
      const summaryData = reports.map(report => ({
        'Mes': report.month_name,
        'Año': report.period_year,
        'Total Paquetes': report.total_packages,
        'Total Viajes': report.total_trips,
        'Matches Exitosos': report.successful_matches,
        'Entregas Completadas': report.completed_deliveries,
        'Solicitudes Pendientes': report.pending_requests,
        'Ingresos Totales (USD)': Number(report.total_revenue).toFixed(2),
        'Tips Viajeros (USD)': Number(report.traveler_tips).toFixed(2),
        'Ingresos Favorón (USD)': Number(report.favoron_revenue).toFixed(2),
        'Ticket Promedio (USD)': Number(report.average_ticket).toFixed(2),
        'GMV Total (USD)': Number(report.gmv_total).toFixed(2),
        'Tasa de Match (%)': report.total_packages > 0 ? ((report.successful_matches / report.total_packages) * 100).toFixed(1) : '0',
        'Tasa de Completación (%)': report.successful_matches > 0 ? ((report.completed_deliveries / report.successful_matches) * 100).toFixed(1) : '0'
      }));

      // Preparar datos detallados por estado
      const statusData: any[] = [];
      reports.forEach(report => {
        Object.entries(report.packages_by_status).forEach(([status, count]) => {
          statusData.push({
            'Mes': report.month_name,
            'Estado': status,
            'Cantidad': Number(count)
          });
        });
      });

      // Preparar datos de destinos populares
      const destinationData: any[] = [];
      reports.forEach(report => {
        Object.entries(report.top_destinations).forEach(([destination, count]) => {
          destinationData.push({
            'Mes': report.month_name,
            'Destino': destination,
            'Cantidad': Number(count)
          });
        });
      });

      // Preparar datos de orígenes populares
      const originData: any[] = [];
      reports.forEach(report => {
        Object.entries(report.top_origins).forEach(([origin, count]) => {
          originData.push({
            'Mes': report.month_name,
            'Origen': origin,
            'Cantidad': Number(count)
          });
        });
      });

      // Crear workbook con múltiples hojas
      const wb = XLSX.utils.book_new();
      
      // Hoja de resumen
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Resumen Mensual");
      
      // Hoja de estados
      if (statusData.length > 0) {
        const statusWs = XLSX.utils.json_to_sheet(statusData);
        XLSX.utils.book_append_sheet(wb, statusWs, "Estados por Mes");
      }
      
      // Hoja de destinos
      if (destinationData.length > 0) {
        const destinationWs = XLSX.utils.json_to_sheet(destinationData);
        XLSX.utils.book_append_sheet(wb, destinationWs, "Destinos Populares");
      }
      
      // Hoja de orígenes
      if (originData.length > 0) {
        const originWs = XLSX.utils.json_to_sheet(originData);
        XLSX.utils.book_append_sheet(wb, originWs, "Orígenes Populares");
      }

      // Generar nombre del archivo con fecha
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      const filename = `Reportes_Mensuales_Favoron_${dateString}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, filename);

      toast({
        title: "Descarga exitosa",
        description: `El reporte se ha descargado como ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte a Excel",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando reportes mensuales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reportes Mensuales</h2>
          <p className="text-muted-foreground">
            Registro histórico de matches exitosos, solicitudes y métricas clave
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            {reports.length} meses registrados
          </Badge>
          {reports.length > 0 && (
            <Button 
              onClick={exportToExcel}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Excel
            </Button>
          )}
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
            <p className="text-muted-foreground">
              Los reportes mensuales aparecerán aquí cuando tengas datos registrados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const monthKey = `${report.period_year}-${report.period_month}`;
            const isExpanded = expandedMonth === monthKey;
            const matchRate = report.total_packages > 0 
              ? (report.successful_matches / report.total_packages) * 100 
              : 0;
            const completionRate = report.successful_matches > 0
              ? (report.completed_deliveries / report.successful_matches) * 100
              : 0;

            return (
              <Card key={monthKey} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleMonthExpansion(monthKey)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.month_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {report.successful_matches} matches exitosos • {report.total_packages} solicitudes totales
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(report.total_revenue)}</p>
                        <p className="text-xs text-muted-foreground">Ingresos totales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatPercentage(matchRate)}</p>
                        <p className="text-xs text-muted-foreground">Tasa de match</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Métricas principales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Package className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold text-primary">{report.total_packages}</p>
                      <p className="text-xs text-muted-foreground">Solicitudes totales</p>
                    </div>
                    <div className="text-center p-4 bg-traveler/5 rounded-lg">
                      <Plane className="h-6 w-6 text-traveler mx-auto mb-2" />
                      <p className="text-2xl font-bold text-traveler">{report.total_trips}</p>
                      <p className="text-xs text-muted-foreground">Viajes registrados</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{report.successful_matches}</p>
                      <p className="text-xs text-muted-foreground">Matches exitosos</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{report.completed_deliveries}</p>
                      <p className="text-xs text-muted-foreground">Entregas completadas</p>
                    </div>
                  </div>

                  {/* Detalles expandibles */}
                  {isExpanded && (
                    <div className="space-y-6 border-t pt-6">
                      {/* Métricas financieras */}
                      <div>
                        <h4 className="font-semibold mb-3">Métricas Financieras</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Ingresos totales</p>
                              <p className="text-xl font-bold">{formatCurrency(report.total_revenue)}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Tips viajeros</p>
                              <p className="text-xl font-bold">{formatCurrency(report.traveler_tips)}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Ingresos Favorón</p>
                              <p className="text-xl font-bold">{formatCurrency(report.favoron_revenue)}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Ticket promedio</p>
                              <p className="text-xl font-bold">{formatCurrency(report.average_ticket)}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Estado de paquetes */}
                      <div>
                        <h4 className="font-semibold mb-3">Estado de Paquetes</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(report.packages_by_status).map(([status, count]) => 
                            getStatusBadge(status, Number(count))
                          )}
                        </div>
                      </div>

                      {/* Top destinos y orígenes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            Top Destinos
                          </h4>
                          <div className="space-y-2">
                            {getTopItems(report.top_destinations).map(([destination, count]) => (
                              <div key={destination} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                <span className="text-sm">{destination}</span>
                                <Badge variant="secondary">{Number(count)}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3 flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            Top Orígenes
                          </h4>
                          <div className="space-y-2">
                            {getTopItems(report.top_origins).map(([origin, count]) => (
                              <div key={origin} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                <span className="text-sm">{origin}</span>
                                <Badge variant="secondary">{Number(count)}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Métricas de rendimiento */}
                      <div>
                        <h4 className="font-semibold mb-3">Métricas de Rendimiento</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded">
                            <p className="text-lg font-bold text-green-600">{formatPercentage(matchRate)}</p>
                            <p className="text-xs text-muted-foreground">Tasa de match</p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <p className="text-lg font-bold text-blue-600">{formatPercentage(completionRate)}</p>
                            <p className="text-xs text-muted-foreground">Tasa de completación</p>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded">
                            <p className="text-lg font-bold text-orange-600">{report.pending_requests}</p>
                            <p className="text-xs text-muted-foreground">Solicitudes pendientes</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded">
                            <p className="text-lg font-bold text-purple-600">{formatCurrency(report.gmv_total)}</p>
                            <p className="text-xs text-muted-foreground">GMV total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MonthlyReportsTab;