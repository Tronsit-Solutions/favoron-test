import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, DollarSign, TrendingUp, Target, Percent, BarChart3, Package, Plane, Truck, ShoppingCart, AlertTriangle, TrendingDown, Repeat, UserMinus, Hash } from "lucide-react";
import { ShopperKPIs, TravelerKPIs, RecurrenceKPIs } from "@/hooks/useCACAnalytics";
import KPIExplanationModal from "./KPIExplanationModal";

interface CardData {
  title: string;
  value: string;
  description: string;
  icon: typeof DollarSign;
  color: string;
  bgColor: string;
  formula: string;
  calculation: string;
  explanation: string;
}

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

const ClickableKPIGrid = ({ cards, gridClass }: { cards: CardData[]; gridClass: string }) => {
  const [selected, setSelected] = useState<CardData | null>(null);

  return (
    <>
      <div className={gridClass}>
        {cards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setSelected(card)}
          >
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
      {selected && (
        <KPIExplanationModal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.title}
          value={selected.value}
          formula={selected.formula}
          calculation={selected.calculation}
          explanation={selected.explanation}
        />
      )}
    </>
  );
};

export const ShopperKPICards = ({ kpis }: ShopperKPICardsProps) => {
  const cards: CardData[] = [
    {
      title: "CAC Shoppers",
      value: kpis.shopperInvestment > 0 ? formatCurrency(kpis.shopperCAC) : "Sin inversión",
      description: "Inversión shoppers / Monetizados",
      icon: DollarSign,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      formula: "Inversión Shoppers / Shoppers Monetizados",
      calculation: `${formatCurrency(kpis.shopperInvestment)} / ${kpis.monetizedShoppers} = ${formatCurrency(kpis.shopperCAC)}`,
      explanation: "Cuánto cuesta adquirir un shopper que realiza su primer pago. Un CAC bajo indica eficiencia en la inversión de marketing.",
    },
    {
      title: "LTV",
      value: formatCurrency(kpis.shopperLTV),
      description: "Revenue / Monetizados",
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      formula: "Revenue Total / Shoppers Monetizados",
      calculation: `${formatCurrency(kpis.shopperRevenue)} / ${kpis.monetizedShoppers} = ${formatCurrency(kpis.shopperLTV)}`,
      explanation: "Ingreso promedio que genera cada shopper monetizado a lo largo de su vida como cliente.",
    },
    {
      title: "LTV / CAC",
      value: kpis.shopperInvestment > 0 ? formatRatio(kpis.shopperLtvCacRatio) : "N/A",
      description: kpis.shopperLtvCacRatio >= 3 ? "✓ Saludable (≥3)" : kpis.shopperLtvCacRatio >= 1 ? "⚠ Mejorable" : "✗ Crítico",
      icon: Target,
      color: kpis.shopperLtvCacRatio >= 3 ? "text-green-500" : kpis.shopperLtvCacRatio >= 1 ? "text-yellow-500" : "text-red-500",
      bgColor: kpis.shopperLtvCacRatio >= 3 ? "bg-green-500/10" : kpis.shopperLtvCacRatio >= 1 ? "bg-yellow-500/10" : "bg-red-500/10",
      formula: "LTV / CAC",
      calculation: `${formatCurrency(kpis.shopperLTV)} / ${formatCurrency(kpis.shopperCAC)} = ${formatRatio(kpis.shopperLtvCacRatio)}`,
      explanation: "Si es ≥3, el negocio es saludable: cada quetzal invertido retorna 3+. Entre 1 y 3 es mejorable. Menor a 1 significa que se pierde dinero por cada cliente adquirido.",
    },
    {
      title: "Tasa Conversión",
      value: formatPercent(kpis.shopperConversionRate),
      description: "Registros → Monetizados",
      icon: Percent,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      formula: "Shoppers Monetizados / Total Shoppers Registrados × 100",
      calculation: `${kpis.monetizedShoppers} / ${kpis.totalShoppers} × 100 = ${formatPercent(kpis.shopperConversionRate)}`,
      explanation: "Porcentaje de shoppers registrados que terminan realizando al menos un pago. Mide la efectividad del funnel completo.",
    },
    {
      title: "Shoppers Activos",
      value: `${kpis.activeShoppers} / ${kpis.totalShoppers}`,
      description: `Activación: ${formatPercent(kpis.shopperActivationRate)}`,
      icon: UserCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      formula: "Shoppers con ≥1 pedido creado / Total Registrados",
      calculation: `${kpis.activeShoppers} / ${kpis.totalShoppers} = ${formatPercent(kpis.shopperActivationRate)}`,
      explanation: "Un shopper 'activo' es quien ha creado al menos un pedido. La tasa de activación mide cuántos registrados dan el primer paso.",
    },
    {
      title: "Monetizados",
      value: kpis.monetizedShoppers.toString(),
      description: `De ${kpis.activeShoppers} activos (${formatPercent(kpis.shopperMonetizationRate)})`,
      icon: Users,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      formula: "Shoppers con ≥1 pedido pagado",
      calculation: `${kpis.monetizedShoppers} de ${kpis.activeShoppers} activos = ${formatPercent(kpis.shopperMonetizationRate)} tasa de monetización`,
      explanation: "Shoppers que completaron al menos un pago. La tasa de monetización indica qué porcentaje de los activos llegan a pagar.",
    },
    {
      title: "ARPU",
      value: formatCurrency(kpis.shopperARPU),
      description: "Revenue / Shoppers activos",
      icon: BarChart3,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      formula: "Revenue Total / Shoppers Activos",
      calculation: `${formatCurrency(kpis.shopperRevenue)} / ${kpis.activeShoppers} = ${formatCurrency(kpis.shopperARPU)}`,
      explanation: "Average Revenue Per User. Ingreso promedio por shopper activo, incluyendo los que no han pagado. Útil para medir el valor general de la base activa.",
    },
    {
      title: "CAC / Pedido",
      value: kpis.shopperInvestment > 0 ? formatCurrency(kpis.cacPerPaidOrder) : "Sin inversión",
      description: `${kpis.totalPaidPackages} pedidos pagados`,
      icon: ShoppingCart,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      formula: "Inversión Shoppers / Total Pedidos Pagados",
      calculation: `${formatCurrency(kpis.shopperInvestment)} / ${kpis.totalPaidPackages} = ${formatCurrency(kpis.cacPerPaidOrder)}`,
      explanation: "Costo de adquisición por transacción individual. Mide cuánto cuesta cada pedido pagado en términos de inversión de marketing.",
    },
    {
      title: "Costo Incidencias",
      value: formatCurrency(kpis.totalIncidentCosts),
      description: "Pérdidas por incidencias",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      formula: "Suma de todos los costos de incidencias registrados",
      calculation: `Total = ${formatCurrency(kpis.totalIncidentCosts)}`,
      explanation: "Pérdidas acumuladas por paquetes dañados, perdidos, compensaciones u otros problemas. Se registran manualmente y afectan el LTV Neto.",
    },
    {
      title: "LTV Neto",
      value: formatCurrency(kpis.netLTV),
      description: "LTV después de incidencias",
      icon: TrendingDown,
      color: kpis.netLTV > 0 ? "text-green-500" : "text-red-500",
      bgColor: kpis.netLTV > 0 ? "bg-green-500/10" : "bg-red-500/10",
      formula: "(Revenue - Costos Incidencias) / Shoppers Monetizados",
      calculation: `(${formatCurrency(kpis.shopperRevenue)} - ${formatCurrency(kpis.totalIncidentCosts)}) / ${kpis.monetizedShoppers} = ${formatCurrency(kpis.netLTV)}`,
      explanation: "LTV real después de restar las pérdidas por incidencias. Refleja el valor verdadero de cada shopper monetizado para el negocio.",
    },
  ];

  return <ClickableKPIGrid cards={cards} gridClass="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5" />;
};

interface GeneralKPICardsProps {
  kpis: {
    totalUsers: number;
    totalActiveUsers: number;
    totalMonetizedUsers: number;
    globalActivationRate: number;
    globalConversionRate: number;
    totalInvestment: number;
    totalRevenue: number;
    globalCAC: number;
    globalLTV: number;
    ltvCacRatio: number;
  };
  totalIncidentCosts: number;
}

export const GeneralKPICards = ({ kpis, totalIncidentCosts }: GeneralKPICardsProps) => {
  const netLTV = kpis.totalMonetizedUsers > 0
    ? (kpis.totalRevenue - totalIncidentCosts) / kpis.totalMonetizedUsers : 0;
  const netLtvCacRatio = kpis.globalCAC > 0 ? netLTV / kpis.globalCAC : netLTV > 0 ? Infinity : 0;

  const cards: CardData[] = [
    {
      title: "CAC General",
      value: kpis.totalInvestment > 0 ? formatCurrency(kpis.globalCAC) : "Sin inversión",
      description: "Inversión total / Monetizados",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      formula: "Inversión Total / Usuarios Monetizados",
      calculation: `${formatCurrency(kpis.totalInvestment)} / ${kpis.totalMonetizedUsers} = ${formatCurrency(kpis.globalCAC)}`,
      explanation: "Costo promedio de adquirir un usuario monetizado, considerando toda la inversión (shoppers + viajeros).",
    },
    {
      title: "LTV",
      value: formatCurrency(kpis.globalLTV),
      description: "Revenue / Monetizados",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      formula: "Revenue Total / Usuarios Monetizados",
      calculation: `${formatCurrency(kpis.totalRevenue)} / ${kpis.totalMonetizedUsers} = ${formatCurrency(kpis.globalLTV)}`,
      explanation: "Valor promedio de vida de un usuario monetizado considerando todos los ingresos de la plataforma.",
    },
    {
      title: "LTV / CAC",
      value: kpis.totalInvestment > 0 ? formatRatio(kpis.ltvCacRatio) : "N/A",
      description: kpis.ltvCacRatio >= 3 ? "✓ Saludable (≥3)" : kpis.ltvCacRatio >= 1 ? "⚠ Mejorable" : "✗ Crítico",
      icon: Target,
      color: kpis.ltvCacRatio >= 3 ? "text-green-500" : kpis.ltvCacRatio >= 1 ? "text-yellow-500" : "text-red-500",
      bgColor: kpis.ltvCacRatio >= 3 ? "bg-green-500/10" : kpis.ltvCacRatio >= 1 ? "bg-yellow-500/10" : "bg-red-500/10",
      formula: "LTV / CAC",
      calculation: `${formatCurrency(kpis.globalLTV)} / ${formatCurrency(kpis.globalCAC)} = ${formatRatio(kpis.ltvCacRatio)}`,
      explanation: "Ratio global de retorno sobre inversión en adquisición. ≥3 es saludable, entre 1-3 mejorable, <1 crítico.",
    },
    {
      title: "LTV Neto",
      value: formatCurrency(netLTV),
      description: "LTV después de incidencias",
      icon: TrendingDown,
      color: netLTV > 0 ? "text-emerald-600" : "text-red-500",
      bgColor: netLTV > 0 ? "bg-emerald-500/10" : "bg-red-500/10",
      formula: "(Revenue - Costos Incidencias) / Usuarios Monetizados",
      calculation: `(${formatCurrency(kpis.totalRevenue)} - ${formatCurrency(totalIncidentCosts)}) / ${kpis.totalMonetizedUsers} = ${formatCurrency(netLTV)}`,
      explanation: "LTV real después de descontar pérdidas por incidencias. Refleja el valor verdadero por usuario monetizado.",
    },
    {
      title: "Tasa Conversión",
      value: formatPercent(kpis.globalConversionRate),
      description: "Registros → Monetizados",
      icon: Percent,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      formula: "Usuarios Monetizados / Total Registrados × 100",
      calculation: `${kpis.totalMonetizedUsers} / ${kpis.totalUsers} × 100 = ${formatPercent(kpis.globalConversionRate)}`,
      explanation: "Porcentaje de todos los usuarios registrados que terminan generando ingresos en la plataforma.",
    },
    {
      title: "Usuarios Activos",
      value: `${kpis.totalActiveUsers} / ${kpis.totalUsers}`,
      description: `Activación: ${formatPercent(kpis.globalActivationRate)}`,
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      formula: "Usuarios Activos / Total Registrados × 100",
      calculation: `${kpis.totalActiveUsers} / ${kpis.totalUsers} × 100 = ${formatPercent(kpis.globalActivationRate)}`,
      explanation: "Usuarios que han creado al menos un pedido o un viaje. Mide la activación general de la base de usuarios.",
    },
    {
      title: "Monetizados",
      value: kpis.totalMonetizedUsers.toString(),
      description: `De ${kpis.totalActiveUsers} activos`,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      formula: "Shoppers monetizados + Viajeros productivos (sin duplicados)",
      calculation: `Total = ${kpis.totalMonetizedUsers} de ${kpis.totalActiveUsers} activos`,
      explanation: "Total de usuarios únicos que han generado ingresos, ya sea como shoppers (pagaron pedido) o viajeros (entregaron paquete).",
    },
    {
      title: "Inversión Total",
      value: formatCurrency(kpis.totalInvestment),
      description: "Shoppers + Viajeros",
      icon: BarChart3,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      formula: "Inversión Shoppers + Inversión Viajeros",
      calculation: `Total = ${formatCurrency(kpis.totalInvestment)}`,
      explanation: "Suma de toda la inversión en marketing, dividida entre la porción asignada a shoppers y a viajeros según la audiencia objetivo de cada campaña.",
    },
  ];

  return <ClickableKPIGrid cards={cards} gridClass="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4" />;
};

export const TravelerKPICards = ({ kpis }: TravelerKPICardsProps) => {
  const cards: CardData[] = [
    {
      title: "CAC Viajeros",
      value: kpis.travelerInvestment > 0 ? formatCurrency(kpis.travelerCAC) : "Sin inversión",
      description: "Inversión viajeros / Productivos",
      icon: DollarSign,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      formula: "Inversión Viajeros / Viajeros Productivos",
      calculation: `${formatCurrency(kpis.travelerInvestment)} / ${kpis.productiveTravelers} = ${formatCurrency(kpis.travelerCAC)}`,
      explanation: "Costo de adquirir un viajero que efectivamente entrega paquetes. Un viajero 'productivo' es quien ha entregado al menos un paquete.",
    },
    {
      title: "Viajeros Activos",
      value: `${kpis.activeTravelers} / ${kpis.totalTravelers}`,
      description: `Activación: ${formatPercent(kpis.travelerActivationRate)}`,
      icon: Plane,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      formula: "Viajeros con ≥1 trip aprobado / Total Viajeros Registrados",
      calculation: `${kpis.activeTravelers} / ${kpis.totalTravelers} = ${formatPercent(kpis.travelerActivationRate)}`,
      explanation: "Viajeros que han publicado al menos un viaje aprobado. La tasa de activación mide cuántos registrados participan activamente.",
    },
    {
      title: "Productivos",
      value: kpis.productiveTravelers.toString(),
      description: `De ${kpis.activeTravelers} activos (${formatPercent(kpis.travelerProductivityRate)})`,
      icon: Truck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      formula: "Viajeros que han entregado ≥1 paquete",
      calculation: `${kpis.productiveTravelers} de ${kpis.activeTravelers} activos = ${formatPercent(kpis.travelerProductivityRate)}`,
      explanation: "Viajeros que han completado al menos una entrega. La tasa de productividad muestra qué porcentaje de los activos genera valor real.",
    },
    {
      title: "Pkgs / Viajero",
      value: kpis.avgPackagesPerTraveler.toFixed(1),
      description: `${kpis.totalPackagesDelivered} paquetes entregados`,
      icon: Package,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      formula: "Total Paquetes Entregados / Viajeros Productivos",
      calculation: `${kpis.totalPackagesDelivered} / ${kpis.productiveTravelers} = ${kpis.avgPackagesPerTraveler.toFixed(1)}`,
      explanation: "Eficiencia promedio por viajero productivo. Indica cuántos paquetes entrega en promedio cada viajero que participa.",
    },
    {
      title: "Costo / Paquete",
      value: kpis.travelerInvestment > 0 ? formatCurrency(kpis.costPerDeliveredPackage) : "N/A",
      description: "Inversión / Paquetes entregados",
      icon: BarChart3,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      formula: "Inversión Viajeros / Total Paquetes Entregados",
      calculation: `${formatCurrency(kpis.travelerInvestment)} / ${kpis.totalPackagesDelivered} = ${formatCurrency(kpis.costPerDeliveredPackage)}`,
      explanation: "Costo de marketing por cada paquete entregado. Mide la eficiencia de la inversión en adquisición de viajeros por transacción.",
    },
    {
      title: "Propinas",
      value: formatCurrency(kpis.totalTipsDistributed),
      description: "Total distribuido a viajeros",
      icon: TrendingUp,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      formula: "Suma de todas las propinas asignadas a viajeros",
      calculation: `Total = ${formatCurrency(kpis.totalTipsDistributed)}`,
      explanation: "Total acumulado de propinas distribuidas a viajeros. Las propinas son asignadas por el admin y forman parte del incentivo para los viajeros.",
    },
  ];

  return <ClickableKPIGrid cards={cards} gridClass="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />;
};

interface RecurrenceKPICardsProps {
  kpis: RecurrenceKPIs;
}

export const RecurrenceKPICards = ({ kpis }: RecurrenceKPICardsProps) => {
  const cards: CardData[] = [
    {
      title: "Shoppers Recurrentes",
      value: `${kpis.repeatShoppers} (${formatPercent(kpis.shopperRepeatRate)})`,
      description: `De ${kpis.monetizedShoppers} monetizados`,
      icon: Repeat,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      formula: "Shoppers con ≥2 pedidos pagados / Shoppers Monetizados × 100",
      calculation: `${kpis.repeatShoppers} / ${kpis.monetizedShoppers} × 100 = ${formatPercent(kpis.shopperRepeatRate)}`,
      explanation: "Porcentaje de shoppers monetizados que han realizado más de una compra. Una tasa alta indica buena retención y satisfacción del cliente.",
    },
    {
      title: "Shoppers 1 Vez",
      value: kpis.oneTimerShoppers.toString(),
      description: "Solo 1 pedido pagado",
      icon: UserMinus,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      formula: "Shoppers Monetizados - Shoppers Recurrentes",
      calculation: `${kpis.monetizedShoppers} - ${kpis.repeatShoppers} = ${kpis.oneTimerShoppers}`,
      explanation: "Shoppers que solo han pagado un pedido. Representan oportunidad de retención: convertirlos en recurrentes mejoraría el LTV.",
    },
    {
      title: "Pedidos Promedio",
      value: kpis.avgOrdersPerRepeatShopper.toFixed(1),
      description: "Promedio por shopper que repitió",
      icon: Hash,
      color: "text-amber-700",
      bgColor: "bg-amber-500/10",
      formula: "Total Pedidos de Recurrentes / Shoppers Recurrentes",
      calculation: `Promedio = ${kpis.avgOrdersPerRepeatShopper.toFixed(1)} pedidos por shopper recurrente`,
      explanation: "Frecuencia de compra promedio entre los shoppers que han comprado más de una vez. Un número alto indica alta fidelidad.",
    },
    {
      title: "Viajeros Recurrentes",
      value: `${kpis.repeatTravelers} (${formatPercent(kpis.travelerRepeatRate)})`,
      description: "Viajeros con 2+ trips aprobados",
      icon: Repeat,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      formula: "Viajeros con ≥2 trips aprobados / Viajeros Activos × 100",
      calculation: `${kpis.repeatTravelers} / ${kpis.totalActiveTravelers} × 100 = ${formatPercent(kpis.travelerRepeatRate)}`,
      explanation: "Porcentaje de viajeros activos que han publicado más de un viaje aprobado. Indica la retención y satisfacción de los viajeros.",
    },
    {
      title: "Viajeros 1 Vez",
      value: kpis.oneTimeTravelers.toString(),
      description: "Solo 1 trip aprobado",
      icon: UserMinus,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      formula: "Viajeros Activos - Viajeros Recurrentes",
      calculation: `${kpis.totalActiveTravelers} - ${kpis.repeatTravelers} = ${kpis.oneTimeTravelers}`,
      explanation: "Viajeros que solo han completado un viaje. Convertirlos en recurrentes aumentaría la capacidad de entrega de la plataforma.",
    },
    {
      title: "Trips Promedio",
      value: kpis.avgTripsPerRepeatTraveler.toFixed(1),
      description: "Promedio por viajero que repitió",
      icon: Hash,
      color: "text-orange-700",
      bgColor: "bg-orange-500/10",
      formula: "Total Trips de Recurrentes / Viajeros Recurrentes",
      calculation: `Promedio = ${kpis.avgTripsPerRepeatTraveler.toFixed(1)} trips por viajero recurrente`,
      explanation: "Frecuencia promedio de viajes entre viajeros que han viajado más de una vez. Un número alto indica buena retención de viajeros.",
    },
  ];

  return <ClickableKPIGrid cards={cards} gridClass="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />;
};
