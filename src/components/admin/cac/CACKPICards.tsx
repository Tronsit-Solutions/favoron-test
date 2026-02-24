import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, DollarSign, TrendingUp, Target, Percent, BarChart3, Package, Plane, Truck, ShoppingCart, AlertTriangle, TrendingDown } from "lucide-react";
import { ShopperKPIs, TravelerKPIs } from "@/hooks/useCACAnalytics";

interface ShopperKPICardsProps {
  kpis: ShopperKPIs;
}

interface TravelerKPICardsProps {
  kpis: TravelerKPIs;
}

const formatCurrency = (value: number) => `Q${value.toFixed(2)}`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatRatio = (value: number) => {
  if (value === Infinity) return "∞";
  return `${value.toFixed(2)}x`;
};

export const ShopperKPICards = ({ kpis }: ShopperKPICardsProps) => {
  const cards = [
    {
      title: "CAC Shoppers",
      value: kpis.shopperInvestment > 0 ? formatCurrency(kpis.shopperCAC) : "Sin inversión",
      description: "Inversión shoppers / Monetizados",
      icon: DollarSign,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "LTV",
      value: formatCurrency(kpis.shopperLTV),
      description: "Revenue / Monetizados",
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "LTV / CAC",
      value: kpis.shopperInvestment > 0 ? formatRatio(kpis.shopperLtvCacRatio) : "N/A",
      description: kpis.shopperLtvCacRatio >= 3 ? "✓ Saludable (≥3)" : kpis.shopperLtvCacRatio >= 1 ? "⚠ Mejorable" : "✗ Crítico",
      icon: Target,
      color: kpis.shopperLtvCacRatio >= 3 ? "text-green-500" : kpis.shopperLtvCacRatio >= 1 ? "text-yellow-500" : "text-red-500",
      bgColor: kpis.shopperLtvCacRatio >= 3 ? "bg-green-500/10" : kpis.shopperLtvCacRatio >= 1 ? "bg-yellow-500/10" : "bg-red-500/10",
    },
    {
      title: "Tasa Conversión",
      value: formatPercent(kpis.shopperConversionRate),
      description: "Registros → Monetizados",
      icon: Percent,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Shoppers Activos",
      value: `${kpis.activeShoppers} / ${kpis.totalShoppers}`,
      description: `Activación: ${formatPercent(kpis.shopperActivationRate)}`,
      icon: UserCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Monetizados",
      value: kpis.monetizedShoppers.toString(),
      description: `De ${kpis.activeShoppers} activos (${formatPercent(kpis.shopperMonetizationRate)})`,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "ARPU",
      value: formatCurrency(kpis.shopperARPU),
      description: "Revenue / Shoppers activos",
      icon: BarChart3,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
    {
      title: "CAC / Pedido",
      value: kpis.shopperInvestment > 0 ? formatCurrency(kpis.cacPerPaidOrder) : "Sin inversión",
      description: `${kpis.totalPaidPackages} pedidos pagados`,
      icon: ShoppingCart,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "Costo Incidencias",
      value: formatCurrency(kpis.totalIncidentCosts),
      description: "Pérdidas por incidencias",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "LTV Neto",
      value: formatCurrency(kpis.netLTV),
      description: "LTV después de incidencias",
      icon: TrendingDown,
      color: kpis.netLTV > 0 ? "text-green-500" : "text-red-500",
      bgColor: kpis.netLTV > 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4 min-w-0">
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <div className={`p-1.5 rounded-lg shrink-0 ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground truncate">{card.title}</span>
            </div>
            <div className="text-xl font-bold truncate">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const TravelerKPICards = ({ kpis }: TravelerKPICardsProps) => {
  const cards = [
    {
      title: "CAC Viajeros",
      value: kpis.travelerInvestment > 0 ? formatCurrency(kpis.travelerCAC) : "Sin inversión",
      description: "Inversión viajeros / Productivos",
      icon: DollarSign,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Viajeros Activos",
      value: `${kpis.activeTravelers} / ${kpis.totalTravelers}`,
      description: `Activación: ${formatPercent(kpis.travelerActivationRate)}`,
      icon: Plane,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Productivos",
      value: kpis.productiveTravelers.toString(),
      description: `De ${kpis.activeTravelers} activos (${formatPercent(kpis.travelerProductivityRate)})`,
      icon: Truck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Pkgs / Viajero",
      value: kpis.avgPackagesPerTraveler.toFixed(1),
      description: `${kpis.totalPackagesDelivered} paquetes entregados`,
      icon: Package,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Costo / Paquete",
      value: kpis.travelerInvestment > 0 ? formatCurrency(kpis.costPerDeliveredPackage) : "N/A",
      description: "Inversión / Paquetes entregados",
      icon: BarChart3,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Propinas",
      value: formatCurrency(kpis.totalTipsDistributed),
      description: "Total distribuido a viajeros",
      icon: TrendingUp,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
            </div>
            <div className="text-xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
