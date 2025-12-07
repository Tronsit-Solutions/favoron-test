import { Package, Trip } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Package as PackageIcon, Plane } from "lucide-react";

interface UserFinancialSummaryProps {
  packages: Package[];
  trips: Trip[];
  allPackages: Package[]; // To calculate tips earned from other users' packages
}

const UserFinancialSummary = ({ packages, trips, allPackages }: UserFinancialSummaryProps) => {
  // Calculate total paid as shopper (only paid packages)
  const paidStatuses = ['pending_purchase', 'in_transit', 'delivered_to_office', 'received_by_traveler'];
  const totalPaidAsShopper = packages
    .filter(pkg => paidStatuses.includes(pkg.status))
    .reduce((total, pkg) => {
      const quote = pkg.quote as any;
      const price = parseFloat(quote?.totalPrice || pkg.estimated_price?.toString() || '0');
      return total + (isNaN(price) ? 0 : price);
    }, 0);

  // Calculate tips earned as traveler (from packages assigned to user's trips)
  const tipsEarned = trips.reduce((total, trip) => {
    const assignedPackages = allPackages.filter(pkg => pkg.matched_trip_id === trip.id);
    return total + assignedPackages.reduce((tripTotal, pkg) => {
      const quote = pkg.quote as any;
      const serviceFee = parseFloat(quote?.serviceFee || '0');
      return tripTotal + (isNaN(serviceFee) ? 0 : serviceFee);
    }, 0);
  }, 0);

  // Calculate total orders completed as shopper
  const completedOrders = packages.filter(pkg => 
    pkg.status === 'delivered_to_office' || pkg.status === 'received_by_traveler'
  ).length;

  // Calculate total packages transported as traveler
  const packagesTransported = trips.reduce((total, trip) => {
    const assignedPackages = allPackages.filter(pkg => 
      pkg.matched_trip_id === trip.id && 
      (pkg.status === 'delivered_to_office' || pkg.status === 'received_by_traveler')
    );
    return total + assignedPackages.length;
  }, 0);

  const financialMetrics = [
    {
      title: "Total Pagado (como Shopper)",
      value: `Q${totalPaidAsShopper.toFixed(2)}`,
      description: `En ${packages.filter(pkg => paidStatuses.includes(pkg.status)).length} pedidos pagados`,
      icon: DollarSign,
      color: "text-red-600"
    },
    {
      title: "Tips Ganados (como Viajero)",
      value: `$${tipsEarned.toFixed(2)}`,
      description: `De ${packagesTransported} paquetes transportados`,
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Órdenes Completadas",
      value: completedOrders.toString(),
      description: `De ${packages.length} pedidos totales`,
      icon: PackageIcon,
      color: "text-blue-600"
    },
    {
      title: "Paquetes Transportados",
      value: packagesTransported.toString(),
      description: `En ${trips.length} viajes`,
      icon: Plane,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumen de Actividad Económica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {financialMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <IconComponent className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actividad como Comprador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Pedidos Pendientes</span>
                <span className="font-medium">
                  {packages.filter(pkg => 
                    pkg.status === 'pending_approval' || 
                    pkg.status === 'matched' || 
                    pkg.status === 'quote_sent'
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">En Proceso</span>
                <span className="font-medium">
                  {packages.filter(pkg => 
                    pkg.status === 'quote_accepted' || 
                    pkg.status === 'pending_purchase' || 
                    pkg.status === 'in_transit'
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Completados</span>
                <span className="font-medium text-green-600">{completedOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Rechazados</span>
                <span className="font-medium text-red-600">
                  {packages.filter(pkg => pkg.status === 'quote_rejected').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actividad como Viajero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Viajes Pendientes</span>
                <span className="font-medium">
                  {trips.filter(trip => trip.status === 'pending_approval').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Viajes Activos</span>
                <span className="font-medium">
                  {trips.filter(trip => trip.status === 'active' || trip.status === 'approved').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Viajes Completados</span>
                <span className="font-medium text-green-600">
                  {trips.filter(trip => trip.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Promedio Paquetes/Viaje</span>
                <span className="font-medium">
                  {trips.length > 0 ? (packagesTransported / trips.length).toFixed(1) : '0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserFinancialSummary;