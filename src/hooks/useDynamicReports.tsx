import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";

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
  travelerTips: number;
  profitMargin: number;
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

export const useDynamicReports = (months: number = 12) => {
  // Fetch users data
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['dynamic-reports-users', months],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, created_at')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch packages data
  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['dynamic-reports-packages', months],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('id, created_at, status, quote')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch trips data
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['dynamic-reports-trips', months],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('id, created_at, status')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const processedData = useMemo(() => {
    if (!usersData || !packagesData || !tripsData) {
      return { monthlyData: [], kpis: getEmptyKPIs() };
    }

    // Generate last N months
    const monthlyData: MonthlyDataPoint[] = [];
    let accumulatedUsers = 0;
    
    // Find earliest data point
    const allDates = [
      ...usersData.map(u => u.created_at),
      ...packagesData.map(p => p.created_at),
      ...tripsData.map(t => t.created_at)
    ].filter(Boolean);
    
    if (allDates.length === 0) {
      return { monthlyData: [], kpis: getEmptyKPIs() };
    }

    const earliestDate = new Date(Math.min(...allDates.map(d => new Date(d).getTime())));
    const now = new Date();
    
    // Calculate number of months between earliest and now
    const monthsDiff = (now.getFullYear() - earliestDate.getFullYear()) * 12 + 
                       (now.getMonth() - earliestDate.getMonth()) + 1;
    
    const monthsToProcess = Math.min(monthsDiff, months);

    // Count users before the first month for accumulated total
    const firstProcessMonth = subMonths(now, monthsToProcess - 1);
    const usersBeforeFirstMonth = usersData.filter(u => {
      const createdAt = new Date(u.created_at);
      return createdAt < startOfMonth(firstProcessMonth);
    }).length;
    accumulatedUsers = usersBeforeFirstMonth;

    for (let i = monthsToProcess - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM yy', { locale: es });

      // Users for this month
      const monthUsers = usersData.filter(u => {
        const createdAt = new Date(u.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });
      const newUsers = monthUsers.length;
      accumulatedUsers += newUsers;

      // Packages for this month
      const monthPackages = packagesData.filter(p => {
        const createdAt = new Date(p.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });
      
      const totalPackages = monthPackages.length;
      const completedPackages = monthPackages.filter(p => 
        ['completed', 'delivered_to_office'].includes(p.status)
      ).length;
      const pendingPackages = monthPackages.filter(p => 
        ['pending_approval', 'approved', 'matched', 'awaiting_quote', 'quote_pending'].includes(p.status)
      ).length;
      const cancelledPackages = monthPackages.filter(p => 
        ['rejected', 'cancelled', 'admin_rejected'].includes(p.status)
      ).length;
      
      // Calculate financials from completed packages
      let gmv = 0;
      let favoronRevenue = 0;
      let travelerTips = 0;
      
      monthPackages.forEach(pkg => {
        if (pkg.quote && ['completed', 'delivered_to_office'].includes(pkg.status)) {
          const quote = pkg.quote as any;
          gmv += parseFloat(quote.total_customer_price_gtq || quote.totalCustomerPriceGTQ || 0);
          favoronRevenue += parseFloat(quote.favoron_service_fee_gtq || quote.favoronServiceFeeGTQ || 0);
          travelerTips += parseFloat(quote.traveler_tip_gtq || quote.travelerTipGTQ || 0);
        }
      });

      // Trips for this month
      const monthTrips = tripsData.filter(t => {
        const createdAt = new Date(t.created_at);
        return createdAt >= monthStart && createdAt <= monthEnd;
      });
      
      const totalTrips = monthTrips.length;
      const approvedTrips = monthTrips.filter(t => 
        ['approved', 'active', 'completed'].includes(t.status)
      ).length;
      const completedTrips = monthTrips.filter(t => 
        t.status === 'completed'
      ).length;

      monthlyData.push({
        month: monthKey,
        monthLabel,
        newUsers,
        accumulatedUsers,
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
        favoronRevenue,
        travelerTips,
        profitMargin: gmv > 0 ? (favoronRevenue / gmv) * 100 : 0,
      });
    }

    // Calculate KPIs
    const totalUsers = usersData.length;
    const totalPackages = packagesData.length;
    const completedPackagesTotal = packagesData.filter(p => 
      ['completed', 'delivered_to_office'].includes(p.status)
    ).length;
    const totalTrips = tripsData.length;
    
    let totalRevenue = 0;
    let totalTips = 0;
    let totalGMV = 0;
    
    packagesData.forEach(pkg => {
      if (pkg.quote && ['completed', 'delivered_to_office'].includes(pkg.status)) {
        const quote = pkg.quote as any;
        totalGMV += parseFloat(quote.total_customer_price_gtq || quote.totalCustomerPriceGTQ || 0);
        totalRevenue += parseFloat(quote.favoron_service_fee_gtq || quote.favoronServiceFeeGTQ || 0);
        totalTips += parseFloat(quote.traveler_tip_gtq || quote.travelerTipGTQ || 0);
      }
    });

    // MoM calculations
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];
    
    const momUserGrowth = previousMonth && previousMonth.newUsers > 0
      ? ((currentMonth?.newUsers || 0) - previousMonth.newUsers) / previousMonth.newUsers * 100
      : 0;
    
    const momPackageGrowth = previousMonth && previousMonth.totalPackages > 0
      ? ((currentMonth?.totalPackages || 0) - previousMonth.totalPackages) / previousMonth.totalPackages * 100
      : 0;
    
    const momRevenueGrowth = previousMonth && previousMonth.favoronRevenue > 0
      ? ((currentMonth?.favoronRevenue || 0) - previousMonth.favoronRevenue) / previousMonth.favoronRevenue * 100
      : 0;

    const kpis: KPIData = {
      totalUsers,
      totalPackages,
      totalTrips,
      totalRevenue,
      totalTips,
      completionRate: totalPackages > 0 ? (completedPackagesTotal / totalPackages) * 100 : 0,
      avgPackageValue: completedPackagesTotal > 0 ? totalGMV / completedPackagesTotal : 0,
      momUserGrowth,
      momPackageGrowth,
      momRevenueGrowth,
    };

    return { monthlyData, kpis };
  }, [usersData, packagesData, tripsData, months]);

  const isLoading = usersLoading || packagesLoading || tripsLoading;

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
