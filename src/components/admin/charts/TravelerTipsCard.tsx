import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Coins, TrendingUp, Award } from "lucide-react";
import { TravelerTipsData } from "@/hooks/useTravelerTipsReport";

interface TravelerTipsCardProps {
  data: TravelerTipsData;
  isLoading: boolean;
}

const formatCurrency = (value: number) => `Q${value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const TravelerTipsCard = ({ data, isLoading }: TravelerTipsCardProps) => {
  const metrics = [
    {
      title: "Viajeros Activos",
      value: data.totalTravelersWithCompleted,
      icon: Users,
      description: "Con ≥1 entrega completada",
      format: (v: number) => v.toString(),
    },
    {
      title: "Paquetes Entregados",
      value: data.totalCompletedPackages,
      icon: Package,
      description: "Entregas realizadas",
      format: (v: number) => v.toString(),
    },
    {
      title: "Total Tips",
      value: data.totalTipsDistributed,
      icon: Coins,
      description: "Distribuido a viajeros",
      format: formatCurrency,
    },
    {
      title: "Promedio por Paquete",
      value: data.avgTipPerPackage,
      icon: TrendingUp,
      description: "Service fee promedio",
      format: formatCurrency,
    },
    {
      title: "Promedio por Viajero",
      value: data.avgTipPerTraveler,
      icon: Award,
      description: "Ganancia promedio total",
      format: formatCurrency,
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Métricas de Viajeros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16 mb-1"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-primary" />
          Métricas de Viajeros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.title} className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{metric.title}</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {metric.format(metric.value)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
