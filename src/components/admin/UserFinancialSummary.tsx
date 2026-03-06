import { useState, useEffect } from "react";
import { Package, Trip } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Package as PackageIcon, Plane, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/utils/dateHelpers";

interface UserFinancialSummaryProps {
  packages: Package[];
  trips: Trip[];
  allPackages: Package[];
  userId?: string;
}

interface ReferralData {
  referrerBalance: number;
  referrerUsed: number;
  referredDiscount: number;
  referredUsed: boolean;
  completedCount: number;
  pendingCount: number;
  referralCode: string | null;
}

const UserFinancialSummary = ({ packages, trips, allPackages, userId }: UserFinancialSummaryProps) => {
  const [referralData, setReferralData] = useState<ReferralData>({
    referrerBalance: 0, referrerUsed: 0, referredDiscount: 0,
    referredUsed: false, completedCount: 0, pendingCount: 0, referralCode: null,
  });
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  // Fetch referral data for this user
  useEffect(() => {
    if (!userId) return;
    const fetchReferralData = async () => {
      setLoadingReferrals(true);
      try {
        // Fetch as referrer
        const { data: asReferrer } = await supabase
          .from('referrals')
          .select('*')
          .eq('referrer_id', userId);

        // Fetch as referred
        const { data: asReferred } = await supabase
          .from('referrals')
          .select('*')
          .eq('referred_id', userId);

        // Fetch referral code from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', userId)
          .single();

        const referrerBalance = (asReferrer || [])
          .filter(r => r.status === 'completed' && !r.reward_used)
          .reduce((s, r) => s + (r.reward_amount || 0), 0);
        const referrerUsed = (asReferrer || [])
          .filter(r => r.reward_used)
          .reduce((s, r) => s + (r.reward_amount || 0), 0);
        const completedCount = (asReferrer || []).filter(r => r.status === 'completed').length;
        const pendingCount = (asReferrer || []).filter(r => r.status === 'pending').length;

        const referredRecord = (asReferred || [])[0];
        const referredDiscount = referredRecord?.referred_reward_amount || 0;
        const referredUsed = referredRecord?.referred_reward_used || false;

        setReferralData({
          referrerBalance, referrerUsed, referredDiscount, referredUsed,
          completedCount, pendingCount, referralCode: profile?.referral_code || null,
        });
      } catch (err) {
        console.error('Error fetching referral data:', err);
      } finally {
        setLoadingReferrals(false);
      }
    };
    fetchReferralData();
  }, [userId]);

  // Packages where referral credit was applied
  const packagesWithCredit = packages.filter(pkg => 
    (pkg.referral_credit_applied || 0) > 0
  );

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

  const totalCreditAvailable = referralData.referrerBalance + 
    (referralData.referredUsed ? 0 : referralData.referredDiscount);

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

      {/* Referral Credit Section */}
      {userId && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Gift className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">Crédito de Referidos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReferrals ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : (
              <div className="space-y-4">
                {referralData.referralCode && (
                  <p className="text-sm">
                    Código de referido: <span className="font-mono font-bold">{referralData.referralCode}</span>
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Crédito disponible total</p>
                    <p className="text-xl font-bold text-amber-600">Q{totalCreditAvailable.toFixed(2)}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Como referidor</p>
                    <p className="text-xl font-bold">Q{referralData.referrerBalance.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{referralData.completedCount} completados, {referralData.pendingCount} pendientes</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Descuento de registro</p>
                    <p className="text-xl font-bold">Q{referralData.referredDiscount.toFixed(2)}</p>
                    <p className={`text-xs ${referralData.referredUsed ? 'text-green-600' : 'text-amber-600'}`}>
                      {referralData.referredDiscount > 0 ? (referralData.referredUsed ? 'Ya usado' : 'Disponible') : 'No aplica'}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Ya usado</p>
                    <p className="text-xl font-bold text-green-600">Q{referralData.referrerUsed.toFixed(2)}</p>
                  </div>
                </div>

                {/* Packages where credit was applied */}
                {packagesWithCredit.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Pedidos con crédito aplicado</h4>
                    <div className="space-y-2">
                      {packagesWithCredit.map(pkg => (
                        <div key={pkg.id} className="flex items-center justify-between p-2 border rounded text-sm">
                          <div>
                            <p className="font-medium">{pkg.item_description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(pkg.created_at)}</p>
                          </div>
                          <span className="font-bold text-green-600">-Q{(pkg.referral_credit_applied || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {packagesWithCredit.length === 0 && totalCreditAvailable === 0 && referralData.referrerUsed === 0 && (
                  <p className="text-sm text-muted-foreground">Este usuario no tiene actividad de referidos.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
