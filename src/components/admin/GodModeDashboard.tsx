import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Check, Plus, ChevronUp, ChevronDown, X, BarChart3, Users, Package, Plane, DollarSign, TrendingUp, PieChart, Coins, Activity, Table2, Zap, Target, Star } from "lucide-react";
import { useDynamicReports } from "@/hooks/useDynamicReports";
import { useAcquisitionAnalytics } from "@/hooks/useAcquisitionAnalytics";
import { useTravelerTipsReport } from "@/hooks/useTravelerTipsReport";
import AdminStatsOverview from "./AdminStatsOverview";
import { KPICards } from "./charts/KPICards";
import { UserGrowthChart } from "./charts/UserGrowthChart";
import { PackagesChart } from "./charts/PackagesChart";
import { TripsChart } from "./charts/TripsChart";
import { RevenueChart } from "./charts/RevenueChart";
import { GMVChart } from "./charts/GMVChart";
import { ServiceFeeGrowthChart } from "./charts/ServiceFeeGrowthChart";
import { AvgPackageValueChart } from "./charts/AvgPackageValueChart";
import { AcquisitionChart } from "./charts/AcquisitionChart";
import { AcquisitionSurveyTable } from "./charts/AcquisitionSurveyTable";
import { TravelerTipsCard } from "./charts/TravelerTipsCard";
import { CACAnalysisTab } from "./cac/CACAnalysisTab";
import PlatformRatingCard from "./charts/PlatformRatingCard";
import GodModeWidgetPicker from "./GodModeWidgetPicker";
import type { LucideIcon } from "lucide-react";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

const WIDGET_CATALOG: WidgetDefinition[] = [
  { id: "platform-rating", name: "Rating Global", description: "Rating promedio de la plataforma", icon: Star },
  { id: "stats-overview", name: "Stats Overview", description: "Paquetes, viajes, matches y entregados", icon: BarChart3 },
  { id: "kpi-cards", name: "KPI Cards", description: "Revenue, GMV, tasas de crecimiento", icon: TrendingUp },
  { id: "user-growth", name: "Crecimiento Usuarios", description: "Gráfico de crecimiento mensual", icon: Users },
  { id: "packages-chart", name: "Paquetes por Mes", description: "Completados vs totales", icon: Package },
  { id: "trips-chart", name: "Viajes por Mes", description: "Viajes aprobados y totales", icon: Plane },
  { id: "revenue-chart", name: "Ingresos", description: "Revenue por servicio y propinas", icon: DollarSign },
  { id: "gmv-chart", name: "GMV Mensual", description: "Gross Merchandise Value", icon: Coins },
  { id: "service-fee-growth", name: "Service Fee Growth", description: "Crecimiento de comisiones", icon: Activity },
  { id: "avg-package-value", name: "Valor Promedio", description: "Valor promedio por paquete", icon: Target },
  { id: "acquisition-chart", name: "Adquisición", description: "Canales de adquisición", icon: PieChart },
  { id: "acquisition-survey", name: "Encuestas", description: "Tabla de respuestas de encuestas", icon: Table2 },
  { id: "traveler-tips", name: "Propinas Viajeros", description: "Resumen de propinas", icon: Coins },
  { id: "cac-analysis", name: "Unit Economics (CAC)", description: "Análisis CAC completo", icon: Zap },
];

const DEFAULT_WIDGETS = ["platform-rating", "stats-overview", "kpi-cards", "user-growth", "revenue-chart"];

interface GodModeDashboardProps {
  packages: any[];
  trips: any[];
  userId: string;
}

const GodModeDashboard = ({ packages, trips, userId }: GodModeDashboardProps) => {
  const storageKey = `god_mode_widgets_${userId}`;

  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  const [editMode, setEditMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Data hooks
  const { monthlyData, kpis, isLoading } = useDynamicReports(12);
  const { acquisitionData, summaryKPIs, isLoading: acquisitionLoading } = useAcquisitionAnalytics();
  const { data: travelerTipsData, isLoading: travelerTipsLoading } = useTravelerTipsReport();

  const persist = useCallback((widgets: string[]) => {
    setActiveWidgets(widgets);
    try {
      localStorage.setItem(storageKey, JSON.stringify(widgets));
    } catch {}
  }, [storageKey]);

  const removeWidget = useCallback((id: string) => {
    persist(activeWidgets.filter(w => w !== id));
  }, [activeWidgets, persist]);

  const moveWidget = useCallback((id: string, direction: -1 | 1) => {
    const idx = activeWidgets.indexOf(id);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= activeWidgets.length) return;
    const next = [...activeWidgets];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    persist(next);
  }, [activeWidgets, persist]);

  const addWidget = useCallback((id: string) => {
    if (!activeWidgets.includes(id)) {
      persist([...activeWidgets, id]);
    }
  }, [activeWidgets, persist]);

  const availableWidgets = useMemo(
    () => WIDGET_CATALOG.filter(w => !activeWidgets.includes(w.id)),
    [activeWidgets]
  );

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case "stats-overview":
        return <AdminStatsOverview packages={packages} trips={trips} />;
      case "kpi-cards":
        return isLoading ? <WidgetSkeleton /> : <KPICards kpis={kpis} />;
      case "user-growth":
        return isLoading ? <WidgetSkeleton /> : <UserGrowthChart data={monthlyData} />;
      case "packages-chart":
        return isLoading ? <WidgetSkeleton /> : <PackagesChart data={monthlyData} />;
      case "trips-chart":
        return isLoading ? <WidgetSkeleton /> : <TripsChart data={monthlyData} />;
      case "revenue-chart":
        return isLoading ? <WidgetSkeleton /> : <RevenueChart data={monthlyData} />;
      case "gmv-chart":
        return isLoading ? <WidgetSkeleton /> : <GMVChart data={monthlyData} />;
      case "service-fee-growth":
        return isLoading ? <WidgetSkeleton /> : <ServiceFeeGrowthChart data={monthlyData} />;
      case "avg-package-value":
        return isLoading ? <WidgetSkeleton /> : <AvgPackageValueChart data={monthlyData} overallAvg={kpis.avgPackageValue} />;
      case "acquisition-chart":
        return acquisitionLoading ? <WidgetSkeleton /> : <AcquisitionChart data={acquisitionData} summaryKPIs={summaryKPIs} />;
      case "acquisition-survey":
        return <AcquisitionSurveyTable />;
      case "traveler-tips":
        return travelerTipsLoading ? <WidgetSkeleton /> : <TravelerTipsCard data={travelerTipsData} isLoading={travelerTipsLoading} />;
      case "cac-analysis":
        return <CACAnalysisTab />;
      default:
        return <p className="text-muted-foreground text-sm">Widget desconocido</p>;
    }
  };

  const getWidgetName = (id: string) =>
    WIDGET_CATALOG.find(w => w.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">⚡ God Mode</h2>
        <div className="flex gap-2">
          {editMode && (
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          )}
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? <><Check className="h-4 w-4 mr-1" /> Listo</> : <><Settings className="h-4 w-4 mr-1" /> Editar</>}
          </Button>
        </div>
      </div>

      {/* Widgets */}
      {activeWidgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No hay widgets activos.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setPickerOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Agregar Widget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeWidgets.map((widgetId, idx) => (
            <div key={widgetId} className="relative group">
              {editMode && (
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    disabled={idx === 0}
                    onClick={() => moveWidget(widgetId, -1)}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    disabled={idx === activeWidgets.length - 1}
                    onClick={() => moveWidget(widgetId, 1)}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeWidget(widgetId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {editMode && (
                <div className="text-xs text-muted-foreground mb-1 font-medium">
                  {getWidgetName(widgetId)}
                </div>
              )}
              <div className={editMode ? "ring-1 ring-border rounded-lg p-1" : ""}>
                {renderWidget(widgetId)}
              </div>
            </div>
          ))}
        </div>
      )}

      <GodModeWidgetPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        availableWidgets={availableWidgets}
        onAddWidget={addWidget}
      />
    </div>
  );
};

const WidgetSkeleton = () => (
  <Card>
    <CardContent className="py-8">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded" />
      </div>
    </CardContent>
  </Card>
);

export default GodModeDashboard;
