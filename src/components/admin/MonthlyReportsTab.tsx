import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import { 
  TrendingUp, 
  Package, 
  Plane, 
  CheckCircle, 
  DollarSign, 
  Calendar as CalendarIcon,
  BarChart3,
  MapPin,
  Download,
  Filter,
  RotateCcw
} from "lucide-react";

interface MonthlyReport {
  month: string;
  month_name: string;
  total_packages: number;
  total_trips: number;
  total_revenue: number;
  average_package_value: number;
  completion_rate: number;
  status_breakdown: Record<string, { count: number; revenue: number }> | null;
  top_destinations: Record<string, number> | null;
  top_origins: Record<string, number> | null;
  financial_metrics: {
    gross_revenue: number;
    net_revenue: number;
    service_fees: number;
  };
}

const MonthlyReportsTab = () => {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchMonthlyReports();
  }, []);

  const fetchMonthlyReports = async (customStartDate?: Date, customEndDate?: Date) => {
    try {
      setLoading(true);
      
      const params: { start_date?: string; end_date?: string } = {};
      
      if (customStartDate) {
        params.start_date = format(customStartDate, 'yyyy-MM-dd');
      }
      
      if (customEndDate) {
        params.end_date = format(customEndDate, 'yyyy-MM-dd');
      }
      
      const { data, error } = await supabase
        .rpc('get_monthly_reports', params);
      
      if (error) {
        throw error;
      }
      
      setReports(Array.isArray(data) ? data as unknown as MonthlyReport[] : []);
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

  const applyDateFilter = () => {
    fetchMonthlyReports(startDate, endDate);
  };

  const resetDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setDateRange("all");
    fetchMonthlyReports();
  };

  const handlePresetRange = (preset: string) => {
    const today = new Date();
    let start: Date | undefined;
    let end: Date | undefined;

    switch (preset) {
      case "last_month":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "last_3_months":
        start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        end = today;
        break;
      case "current_year":
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      case "last_year":
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        start = undefined;
        end = undefined;
    }

    setStartDate(start);
    setEndDate(end);
    setDateRange(preset);
    fetchMonthlyReports(start, end);
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
        'Total Paquetes': report.total_packages,
        'Total Viajes': report.total_trips,
        'Ingresos Totales (USD)': Number(report.total_revenue).toFixed(2),
        'Valor Promedio Paquete (USD)': Number(report.average_package_value).toFixed(2),
        'Tasa de Completación (%)': Number(report.completion_rate).toFixed(1),
        'Ingresos Brutos (USD)': Number(report.financial_metrics.gross_revenue).toFixed(2),
        'Ingresos Netos (USD)': Number(report.financial_metrics.net_revenue).toFixed(2),
        'Comisiones de Servicio (USD)': Number(report.financial_metrics.service_fees).toFixed(2)
      }));

      // Preparar datos detallados por estado
      const statusData: any[] = [];
      reports.forEach(report => {
        if (report.status_breakdown) {
          Object.entries(report.status_breakdown).forEach(([status, data]) => {
            statusData.push({
              'Mes': report.month_name,
              'Estado': status,
              'Cantidad': Number(data.count),
              'Ingresos (USD)': Number(data.revenue).toFixed(2)
            });
          });
        }
      });

      // Preparar datos de destinos populares
      const destinationData: any[] = [];
      reports.forEach(report => {
        if (report.top_destinations) {
          Object.entries(report.top_destinations).forEach(([destination, count]) => {
            destinationData.push({
              'Mes': report.month_name,
              'Destino': destination,
              'Cantidad': Number(count)
            });
          });
        }
      });

      // Preparar datos de orígenes populares
      const originData: any[] = [];
      reports.forEach(report => {
        if (report.top_origins) {
          Object.entries(report.top_origins).forEach(([origin, count]) => {
            originData.push({
              'Mes': report.month_name,
              'Origen': origin,
              'Cantidad': Number(count)
            });
          });
        }
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
      let dateRangeString = "";
      
      if (startDate && endDate) {
        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');
        dateRangeString = `_${startStr}_a_${endStr}`;
      } else if (dateRange !== "all") {
        dateRangeString = `_${dateRange}`;
      }
      
      const filename = `Reportes_Mensuales_Favoron${dateRangeString}_${dateString}.xlsx`;

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
          {(startDate || endDate) && (
            <p className="text-sm text-primary font-medium mt-1">
              {startDate && endDate 
                ? `Filtrado: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
                : startDate 
                ? `Desde: ${format(startDate, 'dd/MM/yyyy')}`
                : `Hasta: ${format(endDate!, 'dd/MM/yyyy')}`
              }
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
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

      {/* Filtros de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Fecha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Opciones predefinidas */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Rangos predefinidos</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateRange === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetRange("all")}
              >
                Todos los datos
              </Button>
              <Button
                variant={dateRange === "last_month" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetRange("last_month")}
              >
                Último mes
              </Button>
              <Button
                variant={dateRange === "last_3_months" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetRange("last_3_months")}
              >
                Últimos 3 meses
              </Button>
              <Button
                variant={dateRange === "current_year" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetRange("current_year")}
              >
                Año actual
              </Button>
              <Button
                variant={dateRange === "last_year" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetRange("last_year")}
              >
                Año pasado
              </Button>
            </div>
          </div>

          {/* Selectores de fecha personalizados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="start-date" className="text-sm font-medium">
                Fecha de inicio
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setDateRange("custom");
                    }}
                    disabled={(date) => endDate ? date > endDate : false}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="end-date" className="text-sm font-medium">
                Fecha de fin
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setDateRange("custom");
                    }}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button onClick={applyDateFilter} className="flex-1">
                <Filter className="mr-2 h-4 w-4" />
                Aplicar filtro
              </Button>
              <Button onClick={resetDateFilter} variant="outline">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
            const monthKey = report.month;
            const isExpanded = expandedMonth === monthKey;

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
                        {report.total_packages} paquetes • {report.total_trips} viajes
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(report.total_revenue)}</p>
                        <p className="text-xs text-muted-foreground">Ingresos totales</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatPercentage(report.completion_rate)}</p>
                        <p className="text-xs text-muted-foreground">Tasa de completación</p>
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
                      <p className="text-xs text-muted-foreground">Total paquetes</p>
                    </div>
                    <div className="text-center p-4 bg-traveler/5 rounded-lg">
                      <Plane className="h-6 w-6 text-traveler mx-auto mb-2" />
                      <p className="text-2xl font-bold text-traveler">{report.total_trips}</p>
                      <p className="text-xs text-muted-foreground">Total viajes</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(report.total_revenue)}</p>
                      <p className="text-xs text-muted-foreground">Ingresos totales</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{formatPercentage(report.completion_rate)}</p>
                      <p className="text-xs text-muted-foreground">Tasa completación</p>
                    </div>
                  </div>

                  {/* Detalles expandibles */}
                  {isExpanded && (
                    <div className="space-y-6 border-t pt-6">
                      {/* Métricas financieras */}
                      <div>
                        <h4 className="font-semibold mb-3">Métricas Financieras</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Ingresos brutos</p>
                              <p className="text-xl font-bold">{formatCurrency(report.financial_metrics.gross_revenue)}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Tips viajeros</p>
                              <p className="text-xl font-bold">{formatCurrency(report.financial_metrics.net_revenue)}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4">
                              <p className="text-sm text-muted-foreground">Ingresos Favorón</p>
                              <p className="text-xl font-bold">{formatCurrency(report.financial_metrics.service_fees)}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Estado de paquetes */}
                      {report.status_breakdown && (
                        <div>
                          <h4 className="font-semibold mb-3">Estado de Paquetes</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(report.status_breakdown).map(([status, data]) => 
                              getStatusBadge(status, Number(data.count))
                            )}
                          </div>
                        </div>
                      )}

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

                      {/* Métricas adicionales */}
                      <div>
                        <h4 className="font-semibold mb-3">Métricas Adicionales</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded">
                            <p className="text-lg font-bold text-green-600">{formatCurrency(report.average_package_value)}</p>
                            <p className="text-xs text-muted-foreground">Valor promedio paquete</p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <p className="text-lg font-bold text-blue-600">{formatPercentage(report.completion_rate)}</p>
                            <p className="text-xs text-muted-foreground">Tasa de completación</p>
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