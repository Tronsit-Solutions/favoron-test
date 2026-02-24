import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, DollarSign, TrendingUp, Target, Percent, BarChart3 } from "lucide-react";
import { GlobalKPIs } from "@/hooks/useCACAnalytics";

interface CACKPICardsProps {
  kpis: GlobalKPIs;
}

const formatCurrency = (value: number) => `Q${value.toFixed(2)}`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatRatio = (value: number) => {
  if (value === Infinity) return "∞";
  return `${value.toFixed(2)}x`;
};

export const CACKPICards = ({ kpis }: CACKPICardsProps) => {
  const cards = [
    {
      title: "CAC Global",
      value: kpis.totalInvestment > 0 ? formatCurrency(kpis.globalCAC) : "Sin inversión",
      description: "Inversión total / Monetizados",
      icon: DollarSign,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "CAC Shoppers",
      value: kpis.shopperInvestment > 0 ? formatCurrency(kpis.shopperCAC) : "Sin inversión",
      description: "Inversión shoppers / Monetizados",
      icon: DollarSign,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      title: "LTV Promedio",
      value: formatCurrency(kpis.globalLTV),
      description: "Valor promedio por cliente",
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "LTV / CAC",
      value: kpis.totalInvestment > 0 ? formatRatio(kpis.ltvCacRatio) : "N/A",
      description: kpis.ltvCacRatio >= 3 ? "✓ Saludable (≥3)" : kpis.ltvCacRatio >= 1 ? "⚠ Mejorable" : "✗ Crítico",
      icon: Target,
      color: kpis.ltvCacRatio >= 3 ? "text-green-500" : kpis.ltvCacRatio >= 1 ? "text-yellow-500" : "text-red-500",
      bgColor: kpis.ltvCacRatio >= 3 ? "bg-green-500/10" : kpis.ltvCacRatio >= 1 ? "bg-yellow-500/10" : "bg-red-500/10",
    },
    {
      title: "Tasa Conversión",
      value: formatPercent(kpis.globalConversionRate),
      description: "Registros → Monetizados",
      icon: Percent,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Usuarios Activos",
      value: `${kpis.totalActiveUsers} / ${kpis.totalUsers}`,
      description: `Activación: ${formatPercent(kpis.globalActivationRate)}`,
      icon: UserCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Monetizados",
      value: kpis.totalMonetizedUsers.toString(),
      description: `De ${kpis.totalActiveUsers} activos (${formatPercent(kpis.globalMonetizationRate)})`,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "ARPU",
      value: kpis.totalActiveUsers > 0 ? formatCurrency(kpis.totalRevenue / kpis.totalActiveUsers) : "Q0.00",
      description: "Revenue / Usuarios activos",
      icon: BarChart3,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
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
