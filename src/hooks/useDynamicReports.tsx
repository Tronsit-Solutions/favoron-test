import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { getQuoteValues } from "@/lib/quoteHelpers";

interface MonthlyUserCount {
  month: string;
  user_count: number;
}

interface MonthlyPackageStats {
  month: string;
  total_count: number;
  completed_count: number;
  pending_count: number;
  cancelled_count: number;
  gmv: number;
  service_fee: number;
  delivery_fee: number;
}

interface MonthlyTripStats {
  month: string;
  total_count: number;
  approved_count: number;
  completed_count: number;
}

interface MonthlyDataPoint {
  month: string;
  monthLabel: string;
  newUsers: number;
  accumulatedUsers: number;
  totalPackages: number;
  completedPackages: number;
  pendingPackages: number;
  cancelledPackages: number;
  conversionRate: number;
  totalTrips: number;
  approvedTrips: number;
  completedTrips: number;
  tripApprovalRate: number;
  gmv: number;
  favoronRevenue: number;
  netFavoronRevenue: number;
  travelerTips: number;
  profitMargin: number;
  avgPackageValue: number;
}

interface CompletedRefundOrder {
  package_id: string;
  amount: number;
  created_at: string;
  completed_at: string | null;
  cancelled_products: unknown;
}

interface CancelledPaidPackage {
  id: string;
  created_at: string;
  updated_at: string;
  quote: unknown;
  payment_receipt: unknown;
  recurrente_payment_id: string | null;
}

interface KPIData {
  totalUsers: number;
  totalPackages: number;
  totalTrips: number;
  totalRevenue: number;
  totalTips: number;
  completionRate: number;
  avgPackageValue: number;
  momUserGrowth: number;
  momPackageGrowth: number;
  momRevenueGrowth: number;
}

export interface DynamicReportsData {
  monthlyData: MonthlyDataPoint[];
  kpis: KPIData;
  isLoading: boolean;
  error: Error | null;
}

const PAGE_SIZE = 1000;

const toMonthKey = (value: string | null | undefined): string | null => {
  if (!value) return null;
  return value.substring(0, 7);
};

const hasPaymentEvidence = (pkg: CancelledPaidPackage): boolean => {
  const receipt = pkg.payment_receipt as any;
  const hasManualReceipt = receipt && typeof receipt === 'object' && !!receipt.filePath;
  const hasCardPayment = !!pkg.recurrente_payment_id;
  const hasCardReceiptEvidence = receipt && typeof receipt === 'object' &&
    (receipt.method === 'card' || !!receipt.payment_id || receipt.provider === 'recurrente');

  return hasManualReceipt || hasCardPayment || hasCardReceiptEvidence;
};

const extractRefundServiceFee = (refund: CompletedRefundOrder): number => {
  const cancelledProducts = Array.isArray(refund.cancelled_products) ? refund.cancelled_products as any[] : [];

  if (cancelledProducts.length === 0) return 0;

  const explicitServiceFee = cancelledProducts.reduce((sum, product) => {
    const value = Number(product?.serviceFee ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  if (explicitServiceFee > 0) return explicitServiceFee;

  const refundTips = cancelledProducts.reduce((sum, product) => {
    const value = Number(product?.tip ?? product?.adminAssignedTip ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const refundDeliveryFee = cancelledProducts.reduce((sum, product) => {
    const value = Number(product?.deliveryFee ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  return Math.max(0, Number(refund.amount || 0) - refundTips - refundDeliveryFee);
};

export const useDynamicReports = (months: number = 12) => {
  // Fetch exact counts (not limited by default 1000 row limit)
  const { data: countsData, isLoading: countsLoading } = useQuery({
    queryKey: ['dynamic-reports-counts', 'v4'],
    queryFn: async () => {
      const [usersCount, packagesCount, tripsCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('packages').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
      ]);
      
      return {
        totalUsers: usersCount.count ?? 0,
        totalPackages: packagesCount.count ?? 0,
        totalTrips: tripsCount.count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch aggregated user counts by month using RPC
  const { data: monthlyUsersData, isLoading: usersLoading } = useQuery({
    queryKey: ['dynamic-reports-users-rpc', 'v4'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_monthly_user_counts');
      if (error) throw error;
      return data as MonthlyUserCount[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch aggregated package stats by month using RPC
  const { data: monthlyPackagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['dynamic-reports-packages-rpc', 'v4'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_monthly_package_stats');
      if (error) throw error;
      return data as MonthlyPackageStats[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch aggregated trip stats by month using RPC
  const { data: monthlyTripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['dynamic-reports-trips-rpc', 'v4'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_monthly_trip_stats');
      if (error) throw error;
      return data as MonthlyTripStats[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch completed refunds to net out service fee in growth chart
  const { data: completedRefundOrders, isLoading: refundsLoading } = useQuery({
    queryKey: ['dynamic-reports-refunds', 'v1'],
    queryFn: async () => {
      const allRows: CompletedRefundOrder[] = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from('refund_orders')
          .select('package_id, amount, created_at, completed_at, cancelled_products')
          .eq('status', 'completed')
          .order('id', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        const batch = (data || []) as CompletedRefundOrder[];
        allRows.push(...batch);

        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      return allRows;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch cancelled-but-paid packages to add cancellation counterparts
  const { data: cancelledPaidPackages, isLoading: cancelledPaidLoading } = useQuery({
    queryKey: ['dynamic-reports-cancelled-paid-packages', 'v1'],
    queryFn: async () => {
      const allRows: CancelledPaidPackage[] = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from('packages')
          .select('id, created_at, quote, payment_receipt, recurrente_payment_id')
          .in('status', ['cancelled', 'archived_by_shopper'])
          .order('id', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        const batch = (data || []) as CancelledPaidPackage[];
        allRows.push(...batch);

        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      return allRows;
    },
    staleTime: 5 * 60 * 1000,
  });

  const processedData = useMemo(() => {
    if (!monthlyUsersData || !monthlyPackagesData || !monthlyTripsData || !countsData || !completedRefundOrders || !cancelledPaidPackages) {
      return { monthlyData: [], kpis: getEmptyKPIs() };
    }

    // Create lookup maps for quick access
    const usersMap = new Map(monthlyUsersData.map(u => [u.month, Number(u.user_count)]));
    const packagesMap = new Map(monthlyPackagesData.map(p => [p.month, p]));
    const tripsMap = new Map(monthlyTripsData.map(t => [t.month, t]));

    // Find all months with data
    const allMonths = new Set([
      ...monthlyUsersData.map(u => u.month),
      ...monthlyPackagesData.map(p => p.month),
      ...monthlyTripsData.map(t => t.month),
    ]);

    if (allMonths.size === 0) {
      return { monthlyData: [], kpis: getEmptyKPIs() };
    }

    const refundedPackageIds = new Set(
      completedRefundOrders.map(refund => refund.package_id).filter(Boolean)
    );

    const refundServiceFeeByMonth = completedRefundOrders.reduce((acc, refund) => {
      const monthKey = toMonthKey(refund.completed_at || refund.created_at);
      if (!monthKey) return acc;

      const currentValue = acc.get(monthKey) || 0;
      acc.set(monthKey, currentValue + extractRefundServiceFee(refund));
      return acc;
    }, new Map<string, number>());

    const cancellationServiceFeeByMonth = cancelledPaidPackages.reduce((acc, pkg) => {
      if (refundedPackageIds.has(pkg.id)) return acc;
      if (!hasPaymentEvidence(pkg)) return acc;

      const monthKey = toMonthKey(pkg.created_at);
      if (!monthKey) return acc;

      const quoteValues = getQuoteValues(pkg.quote);
      const currentValue = acc.get(monthKey) || 0;
      acc.set(monthKey, currentValue + quoteValues.serviceFee);
      return acc;
    }, new Map<string, number>());

    const now = new Date();
    // Generate months to display (last N months)
    const monthsToDisplay: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthKey = monthDate.toISOString().substring(0, 7);
      monthsToDisplay.push(monthKey);
    }

    // Use exact total from countsData for accurate accumulated users
    const exactTotalUsers = countsData?.totalUsers ?? 0;

    // Build monthly data points
    const monthlyData: MonthlyDataPoint[] = [];
    
    for (const monthKey of monthsToDisplay) {
      const monthDate = new Date(monthKey + '-01');
      const monthLabel = format(monthDate, 'MMM yy', { locale: es });

      const newUsers = usersMap.get(monthKey) || 0;
      const pkgStats = packagesMap.get(monthKey);
      const tripStats = tripsMap.get(monthKey);

      const totalPackages = pkgStats ? Number(pkgStats.total_count) : 0;
      const completedPackages = pkgStats ? Number(pkgStats.completed_count) : 0;
      const pendingPackages = pkgStats ? Number(pkgStats.pending_count) : 0;
      const cancelledPackages = pkgStats ? Number(pkgStats.cancelled_count) : 0;
      const gmv = pkgStats ? Number(pkgStats.gmv) : 0;
      const serviceFee = pkgStats ? Number(pkgStats.service_fee) : 0;
      const deliveryFee = pkgStats ? Number(pkgStats.delivery_fee) : 0;
      const refundAdjustment = refundServiceFeeByMonth.get(monthKey) || 0;
      const cancellationAdjustment = cancellationServiceFeeByMonth.get(monthKey) || 0;
      const netServiceFee = serviceFee - refundAdjustment - cancellationAdjustment;

      const totalTrips = tripStats ? Number(tripStats.total_count) : 0;
      const approvedTrips = tripStats ? Number(tripStats.approved_count) : 0;
      const completedTrips = tripStats ? Number(tripStats.completed_count) : 0;

      const travelerTips = Math.max(0, gmv - serviceFee - deliveryFee);
      const avgPackageValue = completedPackages > 0 ? gmv / completedPackages : 0;

      monthlyData.push({
        month: monthKey,
        monthLabel,
        newUsers,
        accumulatedUsers: 0, // Will be recalculated below
        totalPackages,
        completedPackages,
        pendingPackages,
        cancelledPackages,
        conversionRate: totalPackages > 0 ? (completedPackages / totalPackages) * 100 : 0,
        totalTrips,
        approvedTrips,
        completedTrips,
        tripApprovalRate: totalTrips > 0 ? (approvedTrips / totalTrips) * 100 : 0,
        gmv,
        favoronRevenue: serviceFee,
        netFavoronRevenue: netServiceFee,
        travelerTips,
        profitMargin: gmv > 0 ? (serviceFee / gmv) * 100 : 0,
        avgPackageValue,
      });
    }

    // Recalculate accumulated users precisely by working backwards from exact total
    let runningTotal = exactTotalUsers;
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      monthlyData[i].accumulatedUsers = runningTotal;
      runningTotal -= monthlyData[i].newUsers;
    }

    // Calculate KPIs
    const totalUsers = countsData?.totalUsers ?? 0;
    const totalPackages = countsData?.totalPackages ?? 0;
    const totalTrips = countsData?.totalTrips ?? 0;
    
    // Aggregate totals from all monthly data (not just displayed months)
    let totalRevenue = 0;
    let totalTips = 0;
    let totalGMV = 0;
    let totalCompletedPackages = 0;
    
    monthlyPackagesData.forEach(pkg => {
      totalGMV += Number(pkg.gmv);
      totalRevenue += Number(pkg.service_fee);
      totalTips += Math.max(0, Number(pkg.gmv) - Number(pkg.service_fee) - Number(pkg.delivery_fee));
      totalCompletedPackages += Number(pkg.completed_count);
    });

    // MoM calculations
    const currentMonth2 = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    
    const momUserGrowth = previousMonth && previousMonth.newUsers > 0
      ? ((currentMonth2?.newUsers || 0) - previousMonth.newUsers) / previousMonth.newUsers * 100
      : 0;
    
    const momPackageGrowth = previousMonth && previousMonth.totalPackages > 0
      ? ((currentMonth2?.totalPackages || 0) - previousMonth.totalPackages) / previousMonth.totalPackages * 100
      : 0;
    
    const momRevenueGrowth = previousMonth && previousMonth.favoronRevenue > 0
      ? ((currentMonth2?.favoronRevenue || 0) - previousMonth.favoronRevenue) / previousMonth.favoronRevenue * 100
      : 0;

    const kpis: KPIData = {
      totalUsers,
      totalPackages,
      totalTrips,
      totalRevenue,
      totalTips,
      completionRate: totalPackages > 0 ? (totalCompletedPackages / totalPackages) * 100 : 0,
      avgPackageValue: totalCompletedPackages > 0 ? totalGMV / totalCompletedPackages : 0,
      momUserGrowth,
      momPackageGrowth,
      momRevenueGrowth,
    };

    return { monthlyData, kpis };
  }, [monthlyUsersData, monthlyPackagesData, monthlyTripsData, countsData, completedRefundOrders, cancelledPaidPackages, months]);

  const isLoading = usersLoading || packagesLoading || tripsLoading || countsLoading || refundsLoading || cancelledPaidLoading;

  return {
    ...processedData,
    isLoading,
    error: null,
  };
};

function getEmptyKPIs(): KPIData {
  return {
    totalUsers: 0,
    totalPackages: 0,
    totalTrips: 0,
    totalRevenue: 0,
    totalTips: 0,
    completionRate: 0,
    avgPackageValue: 0,
    momUserGrowth: 0,
    momPackageGrowth: 0,
    momRevenueGrowth: 0,
  };
}
