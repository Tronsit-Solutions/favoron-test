import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "@/types";
import { DollarSign, Backpack, TrendingUp, Gift } from "lucide-react";
import FinancialTablesSection from "./FinancialTablesSection";
import { getQuoteValues } from '@/lib/quoteHelpers';
import { supabase } from "@/integrations/supabase/client";

interface FinancialDashboardProps {
  packages: Package[];
}
const FinancialDashboard = ({
  packages
}: FinancialDashboardProps) => {

  // Referral credits data
  const [referralMetrics, setReferralMetrics] = useState({
    pendingCredit: 0, pendingDiscounts: 0, distributed: 0,
    completedCount: 0, totalCount: 0
  });

  useEffect(() => {
    const fetchReferrals = async () => {
      const { data, error } = await supabase.from('referrals').select('*');
      if (error || !data) return;
      
      const pendingCredit = data
        .filter(r => r.status === 'completed' && !r.reward_used)
        .reduce((s, r) => s + (r.reward_amount || 0), 0);
      const pendingDiscounts = data
        .filter(r => !r.referred_reward_used && (r.referred_reward_amount || 0) > 0)
        .reduce((s, r) => s + (r.referred_reward_amount || 0), 0);
      const distributed = data
        .filter(r => r.reward_used)
        .reduce((s, r) => s + (r.reward_amount || 0), 0);
      const completedCount = data.filter(r => r.status === 'completed').length;
      
      setReferralMetrics({ pendingCredit, pendingDiscounts, distributed, completedCount, totalCount: data.length });
    };
    fetchReferrals();
  }, []);

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
    return packages.filter(pkg => new Date(pkg.created_at) >= startDate);
  }, [packages, dateFilter]);
  const financialMetrics = useMemo(() => {
    const completedPackages = filteredPackages.filter(pkg => 
      ['delivered_to_office', 'received_by_traveler', 'completed'].includes(pkg.status) && 
      pkg.quote && 
      typeof pkg.quote === 'object' && 
      (pkg.quote as any).totalPrice
    );

    // Total pagado por shoppers (órdenes completadas)
    const totalOrderValue = completedPackages.reduce((sum, pkg) => {
      const quote = pkg.quote as any;
      return sum + parseFloat(quote?.totalPrice || '0');
    }, 0);

    // GMV - Valor bruto de mercancías (precio estimado de productos)
    const totalGMV = completedPackages.reduce((sum, pkg) => {
      return sum + parseFloat(pkg.estimated_price?.toString() || '0');
    }, 0);

    // Descuentos totales aplicados
    const totalDiscounts = completedPackages.reduce((sum, pkg) => {
      const quote = pkg.quote as any;
      const discountAmount = parseFloat(quote?.discountAmount || '0');
      return sum + discountAmount;
    }, 0);

    // Ingresos Favorón (serviceFee del quote, igual que la tabla resumen)
    const favoronRevenueGross = completedPackages.reduce((sum, pkg) => {
      const quoteValues = getQuoteValues(pkg.quote);
      return sum + quoteValues.serviceFee;
    }, 0);

    // Restar descuentos de los ingresos de Favorón
    const favoronRevenue = favoronRevenueGross - totalDiscounts;

    // Tips para viajeros (igual a la cotización completa)
    const travelerTips = completedPackages.reduce((sum, pkg) => {
      const quote = pkg.quote as any;
      const travelerTip = parseFloat(quote?.price || '0');
      return sum + travelerTip;
    }, 0);
    return {
      totalOrderValue,
      totalGMV,
      favoronRevenue,
      totalDiscounts,
      travelerTips,
      completedOrders: completedPackages.length
    };
  }, [filteredPackages]);
  const formatCurrencyGTQ = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatCurrencyUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  return <div className="space-y-6">
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
              {formatCurrencyGTQ(financialMetrics.totalOrderValue)}
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
              {formatCurrencyGTQ(financialMetrics.travelerTips)}
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
              {formatCurrencyGTQ(financialMetrics.favoronRevenue)}
            </div>
            {financialMetrics.totalDiscounts > 0 && (
              <p className="text-xs text-red-600 font-medium">
                Descuentos aplicados: -{formatCurrencyGTQ(financialMetrics.totalDiscounts)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              fees - descuentos
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
              {formatCurrencyUSD(financialMetrics.totalGMV)}
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
                {financialMetrics.completedOrders > 0 ? formatCurrencyGTQ(financialMetrics.totalOrderValue / financialMetrics.completedOrders) : formatCurrencyGTQ(0)}
              </p>
            </div>
            <div>
              <p className="font-medium">Margen Favorón</p>
              <p className="text-2xl font-bold text-green-600">
                {financialMetrics.totalOrderValue > 0 ? `${(financialMetrics.favoronRevenue / financialMetrics.totalOrderValue * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Créditos de Referidos */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Gift className="h-5 w-5 text-amber-600" />
          <CardTitle>Créditos de Referidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-amber-700">Crédito por pagar</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrencyGTQ(referralMetrics.pendingCredit)}
              </p>
              <p className="text-xs text-muted-foreground">Referidores pendientes</p>
            </div>
            <div>
              <p className="font-medium text-amber-700">Descuentos pendientes</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrencyGTQ(referralMetrics.pendingDiscounts)}
              </p>
              <p className="text-xs text-muted-foreground">Referidos no usados</p>
            </div>
            <div>
              <p className="font-medium text-green-700">Ya distribuido</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrencyGTQ(referralMetrics.distributed)}
              </p>
              <p className="text-xs text-muted-foreground">Recompensas usadas</p>
            </div>
            <div>
              <p className="font-medium">Referidos activos</p>
              <p className="text-2xl font-bold text-primary">
                {referralMetrics.completedCount} / {referralMetrics.totalCount}
              </p>
              <p className="text-xs text-muted-foreground">Completados / Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Tables Section */}
      <FinancialTablesSection packages={filteredPackages} />
    </div>;
};
export default FinancialDashboard;