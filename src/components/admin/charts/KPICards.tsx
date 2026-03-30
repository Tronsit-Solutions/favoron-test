import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Plane, DollarSign, TrendingUp, TrendingDown, Percent, Coins, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  kpis: {
    totalUsers: number;
    totalPackages: number;
    totalTrips: number;
    totalRevenue: number;
    totalTips: number;
    totalProducts: number;
    completionRate: number;
    avgPackageValue: number;
    momUserGrowth: number;
    momPackageGrowth: number;
    momRevenueGrowth: number;
  };
}

const formatCurrency = (value: number) => {
  return `Q${new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)}`;
};

const GrowthIndicator = ({ value }: { value: number }) => {
  if (value === 0) return null;
  
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className={cn(
      "flex items-center gap-1 text-xs font-medium",
      isPositive ? "text-green-600" : "text-red-600"
    )}>
      <Icon className="h-3 w-3" />
      <span>{isPositive ? '+' : ''}{value.toFixed(1)}%</span>
    </div>
  );
};

export const KPICards = ({ kpis }: KPICardsProps) => {
  const cards = [
    {
      title: "Total Usuarios",
      value: kpis.totalUsers.toLocaleString(),
      growth: kpis.momUserGrowth,
      icon: Users,
      description: "usuarios registrados",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Solicitudes",
      value: kpis.totalPackages.toLocaleString(),
      growth: kpis.momPackageGrowth,
      icon: Package,
      description: "paquetes creados",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Viajes",
      value: kpis.totalTrips.toLocaleString(),
      icon: Plane,
      description: "viajes registrados",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Ingresos Favorón",
      value: formatCurrency(kpis.totalRevenue),
      growth: kpis.momRevenueGrowth,
      icon: DollarSign,
      description: "ingresos totales",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Propinas Viajeros",
      value: formatCurrency(kpis.totalTips),
      icon: Coins,
      description: "distribuidas a viajeros",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Tasa de Completación",
      value: `${kpis.completionRate.toFixed(1)}%`,
      icon: Percent,
      description: "paquetes completados",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Valor Promedio",
      value: formatCurrency(kpis.avgPackageValue),
      icon: DollarSign,
      description: "por paquete",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className={cn("p-2 rounded-lg", card.bgColor)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
              {card.growth !== undefined && <GrowthIndicator value={card.growth} />}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold tracking-tight">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
