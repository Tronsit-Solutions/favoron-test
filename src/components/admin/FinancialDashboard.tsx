import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "@/types";
import { DollarSign, Backpack, TrendingUp } from "lucide-react";

interface FinancialDashboardProps {
  packages: Package[];
}

const FinancialDashboard = ({ packages }: FinancialDashboardProps) => {
  const [dateFilter, setDateFilter] = useState("all");

  const filteredPackages = useMemo(() => {
    if (dateFilter === "all") return packages;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (dateFilter) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        break;
      case "current_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return packages;
    }
    
    return packages.filter(pkg => new Date(pkg.createdAt) >= startDate);
  }, [packages, dateFilter]);

  const financialMetrics = useMemo(() => {
    const completedPackages = filteredPackages.filter(pkg => 
      ['delivered_to_office', 'received_by_traveler'].includes(pkg.status) && pkg.quote?.totalPrice
    );

    // Total pagado por shoppers (órdenes completadas)
    const totalOrderValue = completedPackages.reduce((sum, pkg) => {
      return sum + parseFloat(pkg.quote?.totalPrice || '0');
    }, 0);

    // GMV - Valor bruto de mercancías (precio estimado de productos)
    const totalGMV = completedPackages.reduce((sum, pkg) => {
      if (pkg.products && pkg.products.length > 0) {
        return sum + pkg.products.reduce((productSum, product) => {
          return productSum + parseFloat(product.estimatedPrice || '0');
        }, 0);
      }
      return sum + parseFloat(pkg.estimatedPrice || '0');
    }, 0);

    // Ingresos Favorón (40% del precio base + fees adicionales)
    const favoronRevenue = completedPackages.reduce((sum, pkg) => {
      const basePrice = parseFloat(pkg.quote?.price || '0');
      const serviceFee = parseFloat(pkg.quote?.serviceFee || '0');
      const favoronFee = (basePrice + serviceFee) * 0.4; // 40% fee
      return sum + favoronFee;
    }, 0);

    // Tips para viajeros (igual a la cotización completa)
    const travelerTips = completedPackages.reduce((sum, pkg) => {
      const travelerTip = parseFloat(pkg.quote?.price || '0');
      return sum + travelerTip;
    }, 0);

    return {
      totalOrderValue,
      totalGMV,
      favoronRevenue,
      travelerTips,
      completedOrders: completedPackages.length
    };
  }, [filteredPackages]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Financiero</h2>
          <p className="text-muted-foreground">Indicadores clave del negocio</p>
        </div>
        
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tiempos</SelectItem>
            <SelectItem value="7days">Últimos 7 días</SelectItem>
            <SelectItem value="30days">Últimos 30 días</SelectItem>
            <SelectItem value="current_month">Mes actual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total órdenes completadas */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              💰 Órdenes Completadas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(financialMetrics.totalOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialMetrics.completedOrders} órdenes completadas
            </p>
          </CardContent>
        </Card>

        {/* Tips para viajeros */}
        <Card className="border-2 border-traveler/20 bg-traveler/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-traveler">
              🎒 Tips para Viajeros
            </CardTitle>
            <Backpack className="h-4 w-4 text-traveler" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-traveler">
              {formatCurrency(financialMetrics.travelerTips)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cotización completa del viajero
            </p>
          </CardContent>
        </Card>

        {/* Ingresos Favorón */}
        <Card className="border-2 border-green-500/20 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              📈 Ingresos Favorón
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(financialMetrics.favoronRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              40% + fees adicionales
            </p>
          </CardContent>
        </Card>

        {/* GMV Total */}
        <Card className="border-2 border-blue-500/20 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              📦 GMV Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(financialMetrics.totalGMV)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor bruto de mercancías
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Órdenes procesadas</p>
              <p className="text-2xl font-bold text-primary">{financialMetrics.completedOrders}</p>
            </div>
            <div>
              <p className="font-medium">Ticket promedio</p>
              <p className="text-2xl font-bold text-traveler">
                {financialMetrics.completedOrders > 0 
                  ? formatCurrency(financialMetrics.totalOrderValue / financialMetrics.completedOrders)
                  : formatCurrency(0)
                }
              </p>
            </div>
            <div>
              <p className="font-medium">Margen Favorón</p>
              <p className="text-2xl font-bold text-green-600">
                {financialMetrics.totalOrderValue > 0 
                  ? `${((financialMetrics.favoronRevenue / financialMetrics.totalOrderValue) * 100).toFixed(1)}%`
                  : '0%'
                }
              </p>
            </div>
            <div>
              <p className="font-medium">GMV vs Facturado</p>
              <p className="text-2xl font-bold text-blue-600">
                {financialMetrics.totalGMV > 0 
                  ? `${((financialMetrics.totalOrderValue / financialMetrics.totalGMV) * 100).toFixed(1)}%`
                  : '0%'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;