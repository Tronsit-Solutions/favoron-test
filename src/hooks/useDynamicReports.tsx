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
  avgPackageValue: number;
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
  // Fetch exact counts (not limited by default 1000 row limit)
  const { data: countsData, isLoading: countsLoading } = useQuery({
    queryKey: ['dynamic-reports-counts', 'v3'],
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

  // Fetch users data with higher limit for monthly calculations
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['dynamic-reports-users', months, 'v3'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, created_at')
        .order('created_at', { ascending: true })
        .limit(10000);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch packages data with higher limit
  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['dynamic-reports-packages', months, 'v3'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('id, created_at, status, quote')
        .order('created_at', { ascending: true })
        .limit(10000);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch trips data with higher limit
  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['dynamic-reports-trips', months, 'v3'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('id, created_at, status')
        .order('created_at', { ascending: true })
        .limit(10000);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const processedData = useMemo(() => {
    if (!usersData || !packagesData || !tripsData || !countsData) {
      return { monthlyData: [], kpis: getEmptyKPIs() };
    }

    // Generate monthly data
    const monthlyData: MonthlyDataPoint[] = [];
    
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

    // Use exact total from countsData for accurate accumulated users
    const exactTotalUsers = countsData?.totalUsers ?? usersData.length;

    for (let i = monthsToProcess - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = monthDate.toISOString().substring(0, 7);
      const monthLabel = format(monthDate, 'MMM yy', { locale: es });

      // Users for this month - use ISO string comparison for UTC consistency
      const monthUsers = usersData.filter(u => {
        // Extract YYYY-MM from ISO timestamp to avoid timezone issues
        const userMonth = u.created_at?.substring(0, 7);
        return userMonth === monthKey;
      });
      
      // Debug log para enero 2026
      if (monthKey === '2026-01') {
        console.log('[DEBUG] January 2026:', { monthKey, totalUsersInData: usersData.length, matchingUsers: monthUsers.length });
      }
      const newUsers = monthUsers.length;

      // Packages for this month - use ISO string comparison for UTC consistency
      const monthPackages = packagesData.filter(p => {
        const pkgMonth = p.created_at?.substring(0, 7);
        return pkgMonth === monthKey;
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
          const totalPrice = parseFloat(quote.totalPrice || quote.completePrice || 0);
          const serviceFee = parseFloat(quote.serviceFee || 0);
          const deliveryFee = parseFloat(quote.deliveryFee || 0);
          
          gmv += totalPrice;
          favoronRevenue += serviceFee;
          travelerTips += Math.max(0, totalPrice - serviceFee - deliveryFee);
        }
      });

      // Trips for this month - use ISO string comparison for UTC consistency
      const monthTrips = tripsData.filter(t => {
        const tripMonth = t.created_at?.substring(0, 7);
        return tripMonth === monthKey;
      });
      
      const totalTrips = monthTrips.length;
      const approvedTrips = monthTrips.filter(t => 
        ['approved', 'active', 'completed'].includes(t.status)
      ).length;
      const completedTrips = monthTrips.filter(t => 
        t.status === 'completed'
      ).length;

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
        favoronRevenue,
        travelerTips,
        profitMargin: gmv > 0 ? (favoronRevenue / gmv) * 100 : 0,
        avgPackageValue,
      });
    }

    // Recalculate accumulated users precisely by working backwards from exact total
    let runningTotal = exactTotalUsers;
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      monthlyData[i].accumulatedUsers = runningTotal;
      runningTotal -= monthlyData[i].newUsers;
    }

    // Calculate KPIs - use exact counts from countsData
    const totalUsers = countsData?.totalUsers ?? usersData.length;
    const totalPackages = countsData?.totalPackages ?? packagesData.length;
    const completedPackagesTotal = packagesData.filter(p => 
      ['completed', 'delivered_to_office'].includes(p.status)
    ).length;
    const totalTrips = countsData?.totalTrips ?? tripsData.length;
    
    let totalRevenue = 0;
    let totalTips = 0;
    let totalGMV = 0;
    
    packagesData.forEach(pkg => {
      if (pkg.quote && ['completed', 'delivered_to_office'].includes(pkg.status)) {
        const quote = pkg.quote as any;
        const totalPrice = parseFloat(quote.totalPrice || quote.completePrice || 0);
        const serviceFee = parseFloat(quote.serviceFee || 0);
        const deliveryFee = parseFloat(quote.deliveryFee || 0);
        
        totalGMV += totalPrice;
        totalRevenue += serviceFee;
        totalTips += Math.max(0, totalPrice - serviceFee - deliveryFee);
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
  }, [usersData, packagesData, tripsData, countsData, months]);

  const isLoading = usersLoading || packagesLoading || tripsLoading || countsLoading;

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
