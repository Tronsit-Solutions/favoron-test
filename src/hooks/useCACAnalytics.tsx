import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

// Paginated fetch to bypass PGRST_MAX_ROWS (1000) limit
async function fetchAllPaginated<T>(
  queryFn: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await queryFn(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    
    allData = allData.concat((data || []) as T[]);
    hasMore = (data?.length || 0) === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return allData;
}

export interface CACChannelData {
  channel: string;
  channelLabel: string;
  // Shopper metrics
  totalUsers: number;
  activeUsers: number;
  monetizedUsers: number;
  activationRate: number;
  monetizationRate: number;
  overallConversionRate: number;
  totalInvestment: number;
  totalRevenue: number;
  cacPerRegistration: number;
  cacPerActive: number;
  cacPerMonetized: number;
  avgLTV: number;
  ltvCacRatio: number;
  paidPackages: number;
  cacPerPaidOrder: number;
  // Traveler metrics
  travelerUsers: number;
  activeTravelers: number;
  productiveTravelers: number;
  travelerInvestment: number;
  travelerCAC: number;
  packagesDelivered: number;
  shopperInvestment: number;
  shopperCAC: number;
}

export interface MarketingInvestment {
  id: string;
  channel: string;
  month: string;
  investment: number;
  notes: string | null;
  target_audience: 'shoppers' | 'travelers' | 'both';
  created_at: string;
}

export interface IncidentCost {
  id: string;
  month: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export interface ShopperKPIs {
  totalShoppers: number;
  activeShoppers: number;
  monetizedShoppers: number;
  shopperActivationRate: number;
  shopperMonetizationRate: number;
  shopperConversionRate: number;
  shopperInvestment: number;
  shopperRevenue: number;
  shopperCAC: number;
  shopperLTV: number;
  shopperLtvCacRatio: number;
  shopperARPU: number;
  totalPaidPackages: number;
  cacPerPaidOrder: number;
  totalIncidentCosts: number;
  netRevenue: number;
  netLTV: number;
  netLtvCacRatio: number;
}

export interface TravelerKPIs {
  totalTravelers: number;
  activeTravelers: number;
  productiveTravelers: number;
  travelerActivationRate: number;
  travelerProductivityRate: number;
  travelerInvestment: number;
  travelerCAC: number;
  avgPackagesPerTraveler: number;
  totalPackagesDelivered: number;
  costPerDeliveredPackage: number;
  totalTipsDistributed: number;
}

export interface RecurrenceKPIs {
  monetizedShoppers: number;
  oneTimerShoppers: number;
  repeatShoppers: number;
  shopperRepeatRate: number;
  avgOrdersPerRepeatShopper: number;
  totalActiveTravelers: number;
  oneTimeTravelers: number;
  repeatTravelers: number;
  travelerRepeatRate: number;
  avgTripsPerRepeatTraveler: number;
}

export interface GlobalKPIs {
  totalUsers: number;
  totalActiveUsers: number;
  totalMonetizedUsers: number;
  globalActivationRate: number;
  globalMonetizationRate: number;
  globalConversionRate: number;
  totalInvestment: number;
  totalRevenue: number;
  globalCAC: number;
  globalLTV: number;
  ltvCacRatio: number;
  shopperInvestment: number;
  shopperCAC: number;
}

export interface MonthlyCAC {
  month: string;
  newUsers: number;
  activeUsers: number;
  monetizedUsers: number;
  investment: number;
  revenue: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
}

const CHANNEL_LABELS: Record<string, string> = {
  instagram_facebook_ads: "Meta Ads (FB/IG)",
  tiktok: "TikTok",
  friend_referral: "Referidos",
  reels: "Reels",
  other: "Otro",
  null: "Sin respuesta",
};

const normalizeChannel = (source: string | null): string => {
  if (source === 'instagram_ads' || source === 'facebook_ads' || source === 'instagram_facebook_ads') {
    return 'instagram_facebook_ads';
  }
  return source || 'null';
};

const PAID_STATUSES = [
  'payment_confirmed',
  'matched',
  'in_transit',
  'received_by_traveler',
  'pending_office_confirmation',
  'delivered_to_office',
  'completed'
];

const DELIVERED_STATUSES = ['delivered_to_office', 'completed'];

export const useCACAnalytics = (selectedMonth?: string) => {
  const queryClient = useQueryClient();

  const { data: exactUserCount } = useQuery({
    queryKey: ['cac-exact-user-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['cac-users'],
    queryFn: async () => {
      return fetchAllPaginated((from, to) =>
        supabase
          .from('profiles')
          .select('id, acquisition_source, created_at')
          .order('created_at', { ascending: true })
          .range(from, to)
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['cac-packages'],
    queryFn: async () => {
      return fetchAllPaginated((from, to) =>
        supabase
          .from('packages')
          .select('id, user_id, status, quote, created_at, matched_trip_id, admin_assigned_tip')
          .order('created_at', { ascending: true })
          .range(from, to)
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['cac-trips'],
    queryFn: async () => {
      return fetchAllPaginated((from, to) =>
        supabase
          .from('trips')
          .select('id, user_id, status')
          .range(from, to)
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: investmentsData, isLoading: investmentsLoading } = useQuery({
    queryKey: ['marketing-investments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_investments')
        .select('*')
        .order('month', { ascending: false });
      if (error) throw error;
      return data as MarketingInvestment[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: incidentCostsData, isLoading: incidentCostsLoading } = useQuery({
    queryKey: ['incident-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incident_costs')
        .select('*')
        .order('month', { ascending: false });
      if (error) throw error;
      return data as IncidentCost[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const addInvestment = useMutation({
    mutationFn: async (investment: { channel: string; month: string; investment: number; notes?: string; target_audience?: string }) => {
      const { data, error } = await supabase
        .from('marketing_investments')
        .upsert({
          channel: investment.channel,
          month: investment.month,
          investment: investment.investment,
          notes: investment.notes || null,
          target_audience: investment.target_audience || 'both',
        } as any, { onConflict: 'channel,month' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-investments'] }); },
  });

  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marketing_investments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-investments'] }); },
  });

  const updateInvestment = useMutation({
    mutationFn: async ({ id, ...investment }: { id: string; channel: string; month: string; investment: number; notes?: string; target_audience?: string }) => {
      const { data, error } = await supabase
        .from('marketing_investments')
        .update({
          channel: investment.channel,
          month: investment.month,
          investment: investment.investment,
          notes: investment.notes || null,
          target_audience: investment.target_audience || 'both',
        } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketing-investments'] }); },
  });

  const addIncidentCost = useMutation({
    mutationFn: async (data: { month: string; amount: number; description?: string }) => {
      const { data: result, error } = await supabase
        .from('incident_costs')
        .insert({ month: data.month, amount: data.amount, description: data.description || null } as any)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incident-costs'] }); },
  });

  const updateIncidentCost = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; month: string; amount: number; description?: string }) => {
      const { data: result, error } = await supabase
        .from('incident_costs')
        .update({ month: data.month, amount: data.amount, description: data.description || null } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incident-costs'] }); },
  });

  const deleteIncidentCost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incident_costs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incident-costs'] }); },
  });

  const { channelData, globalKPIs, shopperKPIs, travelerKPIs, monthlyData, recurrenceKPIs } = useMemo(() => {
    if (!usersData || !packagesData || !tripsData) {
      return {
        channelData: [],
        globalKPIs: getEmptyGlobalKPIs(),
        shopperKPIs: getEmptyShopperKPIs(),
        travelerKPIs: getEmptyTravelerKPIs(),
        monthlyData: [],
        recurrenceKPIs: getEmptyRecurrenceKPIs(),
      };
    }

    const travelerUserIds = new Set<string>();
    const tripIdToUserId = new Map<string, string>();
    const approvedTripStatuses = ['approved', 'in_progress', 'completed'];
    const activeTravelerIds = new Set<string>();

    tripsData.forEach(trip => {
      travelerUserIds.add(trip.user_id);
      tripIdToUserId.set(trip.id, trip.user_id);
      if (approvedTripStatuses.includes(trip.status)) {
        activeTravelerIds.add(trip.user_id);
      }
    });

    const activeUserIds = new Set<string>();
    const monetizedUserIds = new Set<string>();
    const userRevenue = new Map<string, number>();
    const productiveTravelerIds = new Set<string>();
    let totalPackagesDelivered = 0;
    let totalTips = 0;
    let totalPaidPackages = 0;
    const paidPackagesByUser = new Map<string, number>();

    const travelerPackageCount = new Map<string, number>();

    packagesData.forEach(pkg => {
      activeUserIds.add(pkg.user_id);

      if (PAID_STATUSES.includes(pkg.status)) {
        monetizedUserIds.add(pkg.user_id);
        totalPaidPackages++;
        paidPackagesByUser.set(pkg.user_id, (paidPackagesByUser.get(pkg.user_id) || 0) + 1);
        if (pkg.quote) {
          const quote = pkg.quote as any;
          const serviceFee = parseFloat(quote.serviceFee || 0);
          const current = userRevenue.get(pkg.user_id) || 0;
          userRevenue.set(pkg.user_id, current + serviceFee);
        }
      }

      if (pkg.matched_trip_id && DELIVERED_STATUSES.includes(pkg.status)) {
        const travelerId = tripIdToUserId.get(pkg.matched_trip_id);
        if (travelerId) {
          productiveTravelerIds.add(travelerId);
          totalPackagesDelivered++;
          const count = travelerPackageCount.get(travelerId) || 0;
          travelerPackageCount.set(travelerId, count + 1);
        }
      }

      if (pkg.admin_assigned_tip && pkg.admin_assigned_tip > 0 && DELIVERED_STATUSES.includes(pkg.status)) {
        totalTips += Number(pkg.admin_assigned_tip);
      }
    });

    const userChannelMap = new Map<string, string>();
    usersData.forEach(user => {
      userChannelMap.set(user.id, normalizeChannel(user.acquisition_source));
    });

    const shopperInvByChannel = new Map<string, number>();
    const travelerInvByChannel = new Map<string, number>();
    const totalInvByChannel = new Map<string, number>();
    let totalShopperInvestment = 0;
    let totalTravelerInvestment = 0;

    if (investmentsData) {
      investmentsData.forEach(inv => {
        if (selectedMonth && inv.month !== selectedMonth) return;
        const audience = (inv as any).target_audience || 'both';
        const ch = inv.channel;
        const totalCurrent = totalInvByChannel.get(ch) || 0;
        totalInvByChannel.set(ch, totalCurrent + inv.investment);

        if (audience === 'shoppers') {
          shopperInvByChannel.set(ch, (shopperInvByChannel.get(ch) || 0) + inv.investment);
          totalShopperInvestment += inv.investment;
        } else if (audience === 'travelers') {
          travelerInvByChannel.set(ch, (travelerInvByChannel.get(ch) || 0) + inv.investment);
          totalTravelerInvestment += inv.investment;
        } else {
          shopperInvByChannel.set(ch, (shopperInvByChannel.get(ch) || 0) + inv.investment * 0.5);
          travelerInvByChannel.set(ch, (travelerInvByChannel.get(ch) || 0) + inv.investment * 0.5);
          totalShopperInvestment += inv.investment * 0.5;
          totalTravelerInvestment += inv.investment * 0.5;
        }
      });
    }

    const channelMap = new Map<string, {
      users: Set<string>;
      activeUsers: Set<string>;
      monetizedUsers: Set<string>;
      revenue: number;
      travelerUsers: Set<string>;
      activeTravelers: Set<string>;
      productiveTravelers: Set<string>;
      packagesDelivered: number;
      paidPackages: number;
    }>();

    const ensureChannel = (channel: string) => {
      if (!channelMap.has(channel)) {
        channelMap.set(channel, {
          users: new Set(), activeUsers: new Set(), monetizedUsers: new Set(),
      revenue: 0, travelerUsers: new Set(), activeTravelers: new Set(),
      productiveTravelers: new Set(), packagesDelivered: 0, paidPackages: 0,
        });
      }
      return channelMap.get(channel)!;
    };

    usersData.forEach(user => {
      const channel = normalizeChannel(user.acquisition_source);
      const data = ensureChannel(channel);
      data.users.add(user.id);

      if (activeUserIds.has(user.id)) data.activeUsers.add(user.id);
      if (monetizedUserIds.has(user.id)) {
        data.monetizedUsers.add(user.id);
        data.revenue += userRevenue.get(user.id) || 0;
        data.paidPackages += paidPackagesByUser.get(user.id) || 0;
      }
      if (travelerUserIds.has(user.id)) data.travelerUsers.add(user.id);
      if (activeTravelerIds.has(user.id)) data.activeTravelers.add(user.id);
      if (productiveTravelerIds.has(user.id)) {
        data.productiveTravelers.add(user.id);
        data.packagesDelivered += travelerPackageCount.get(user.id) || 0;
      }
    });

    const result: CACChannelData[] = Array.from(channelMap.entries())
      .map(([channel, data]) => {
        const totalUsers = data.users.size;
        const activeUsers = data.activeUsers.size;
        const monetizedUsers = data.monetizedUsers.size;
        const totalInvestment = totalInvByChannel.get(channel) || 0;
        const totalRevenue = data.revenue;
        const chShopperInv = shopperInvByChannel.get(channel) || 0;
        const chTravelerInv = travelerInvByChannel.get(channel) || 0;

        const activationRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
        const monetizationRate = activeUsers > 0 ? (monetizedUsers / activeUsers) * 100 : 0;
        const overallConversionRate = totalUsers > 0 ? (monetizedUsers / totalUsers) * 100 : 0;
        const cacPerRegistration = totalUsers > 0 && totalInvestment > 0 ? totalInvestment / totalUsers : 0;
        const cacPerActive = activeUsers > 0 && totalInvestment > 0 ? totalInvestment / activeUsers : 0;
        const cacPerMonetized = monetizedUsers > 0 && chShopperInv > 0 ? chShopperInv / monetizedUsers : 0;
        const avgLTV = monetizedUsers > 0 ? totalRevenue / monetizedUsers : 0;
        const ltvCacRatio = cacPerMonetized > 0 ? avgLTV / cacPerMonetized : avgLTV > 0 ? Infinity : 0;

        const travelerUsers = data.travelerUsers.size;
        const activeTravelers = data.activeTravelers.size;
        const productiveTravelers = data.productiveTravelers.size;
        const travelerCAC = productiveTravelers > 0 && chTravelerInv > 0 ? chTravelerInv / productiveTravelers : 0;
        const paidPackages = data.paidPackages;
        const cacPerPaidOrder = paidPackages > 0 && chShopperInv > 0 ? chShopperInv / paidPackages : 0;

        return {
          channel,
          channelLabel: CHANNEL_LABELS[channel] || channel,
          totalUsers, activeUsers, monetizedUsers,
          activationRate, monetizationRate, overallConversionRate,
          totalInvestment, totalRevenue,
          cacPerRegistration, cacPerActive, cacPerMonetized,
          avgLTV, ltvCacRatio,
          paidPackages, cacPerPaidOrder,
          travelerUsers, activeTravelers, productiveTravelers,
          travelerInvestment: chTravelerInv, travelerCAC,
          packagesDelivered: data.packagesDelivered,
          shopperInvestment: chShopperInv,
          shopperCAC: cacPerMonetized,
        };
      })
      .sort((a, b) => b.totalUsers - a.totalUsers);

    const totals = result.reduce(
      (acc, ch) => ({
        totalUsers: acc.totalUsers + ch.totalUsers,
        activeUsers: acc.activeUsers + ch.activeUsers,
        monetizedUsers: acc.monetizedUsers + ch.monetizedUsers,
        investment: acc.investment + ch.totalInvestment,
        revenue: acc.revenue + ch.totalRevenue,
      }),
      { totalUsers: 0, activeUsers: 0, monetizedUsers: 0, investment: 0, revenue: 0 }
    );

    const shopperCAC = totals.monetizedUsers > 0 && totalShopperInvestment > 0
      ? totalShopperInvestment / totals.monetizedUsers : 0;

    const globalKPIs: GlobalKPIs = {
      totalUsers: totals.totalUsers,
      totalActiveUsers: totals.activeUsers,
      totalMonetizedUsers: totals.monetizedUsers,
      globalActivationRate: totals.totalUsers > 0 ? (totals.activeUsers / totals.totalUsers) * 100 : 0,
      globalMonetizationRate: totals.activeUsers > 0 ? (totals.monetizedUsers / totals.activeUsers) * 100 : 0,
      globalConversionRate: totals.totalUsers > 0 ? (totals.monetizedUsers / totals.totalUsers) * 100 : 0,
      totalInvestment: totals.investment,
      totalRevenue: totals.revenue,
      globalCAC: totals.monetizedUsers > 0 && totals.investment > 0 ? totals.investment / totals.monetizedUsers : 0,
      globalLTV: totals.monetizedUsers > 0 ? totals.revenue / totals.monetizedUsers : 0,
      ltvCacRatio: 0,
      shopperInvestment: totalShopperInvestment,
      shopperCAC,
    };
    globalKPIs.ltvCacRatio = globalKPIs.globalCAC > 0
      ? globalKPIs.globalLTV / globalKPIs.globalCAC
      : globalKPIs.globalLTV > 0 ? Infinity : 0;

    const totalIncidentCosts = (incidentCostsData || []).reduce((sum, ic) => sum + Number(ic.amount), 0);
    const netRevenue = totals.revenue - totalIncidentCosts;
    const netLTV = totals.monetizedUsers > 0 ? netRevenue / totals.monetizedUsers : 0;

    const realTotalShoppers = exactUserCount ?? totals.totalUsers;

    const shopperKPIs: ShopperKPIs = {
      totalShoppers: realTotalShoppers,
      activeShoppers: totals.activeUsers,
      monetizedShoppers: totals.monetizedUsers,
      shopperActivationRate: realTotalShoppers > 0 ? (totals.activeUsers / realTotalShoppers) * 100 : 0,
      shopperMonetizationRate: totals.activeUsers > 0 ? (totals.monetizedUsers / totals.activeUsers) * 100 : 0,
      shopperConversionRate: realTotalShoppers > 0 ? (totals.monetizedUsers / realTotalShoppers) * 100 : 0,
      shopperInvestment: totalShopperInvestment,
      shopperRevenue: totals.revenue,
      shopperCAC,
      shopperLTV: totals.monetizedUsers > 0 ? totals.revenue / totals.monetizedUsers : 0,
      shopperLtvCacRatio: shopperCAC > 0
        ? (totals.monetizedUsers > 0 ? totals.revenue / totals.monetizedUsers : 0) / shopperCAC
        : (totals.revenue > 0 ? Infinity : 0),
      shopperARPU: totals.activeUsers > 0 ? totals.revenue / totals.activeUsers : 0,
      totalPaidPackages,
      cacPerPaidOrder: totalPaidPackages > 0 && totalShopperInvestment > 0
        ? totalShopperInvestment / totalPaidPackages : 0,
      totalIncidentCosts,
      netRevenue,
      netLTV,
      netLtvCacRatio: shopperCAC > 0 ? netLTV / shopperCAC : (netLTV > 0 ? Infinity : 0),
    };

    const totalTravelersCount = travelerUserIds.size;
    const activeTravelersCount = activeTravelerIds.size;
    const productiveTravelersCount = productiveTravelerIds.size;
    const travelerCAC = productiveTravelersCount > 0 && totalTravelerInvestment > 0
      ? totalTravelerInvestment / productiveTravelersCount : 0;

    const travelerKPIs: TravelerKPIs = {
      totalTravelers: totalTravelersCount,
      activeTravelers: activeTravelersCount,
      productiveTravelers: productiveTravelersCount,
      travelerActivationRate: totalTravelersCount > 0 ? (activeTravelersCount / totalTravelersCount) * 100 : 0,
      travelerProductivityRate: activeTravelersCount > 0 ? (productiveTravelersCount / activeTravelersCount) * 100 : 0,
      travelerInvestment: totalTravelerInvestment,
      travelerCAC,
      avgPackagesPerTraveler: productiveTravelersCount > 0 ? totalPackagesDelivered / productiveTravelersCount : 0,
      totalPackagesDelivered,
      costPerDeliveredPackage: totalPackagesDelivered > 0 && totalTravelerInvestment > 0
        ? totalTravelerInvestment / totalPackagesDelivered : 0,
      totalTipsDistributed: totalTips,
    };

    const monthlyMap = new Map<string, {
      newUsers: Set<string>; activeUsers: Set<string>; monetizedUsers: Set<string>; revenue: number;
    }>();

    usersData.forEach(user => {
      if (!user.created_at) return;
      const month = user.created_at.substring(0, 7);
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { newUsers: new Set(), activeUsers: new Set(), monetizedUsers: new Set(), revenue: 0 });
      }
      const data = monthlyMap.get(month)!;
      data.newUsers.add(user.id);
      if (activeUserIds.has(user.id)) data.activeUsers.add(user.id);
      if (monetizedUserIds.has(user.id)) {
        data.monetizedUsers.add(user.id);
        data.revenue += userRevenue.get(user.id) || 0;
      }
    });

    const investmentsByMonth = new Map<string, number>();
    if (investmentsData) {
      investmentsData.forEach(inv => {
        const current = investmentsByMonth.get(inv.month) || 0;
        investmentsByMonth.set(inv.month, current + inv.investment);
      });
    }

    const monthlyData: MonthlyCAC[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => {
        const newUsers = data.newUsers.size;
        const activeUsers = data.activeUsers.size;
        const monetizedUsers = data.monetizedUsers.size;
        const investment = investmentsByMonth.get(month) || 0;
        const revenue = data.revenue;
        const cac = monetizedUsers > 0 && investment > 0 ? investment / monetizedUsers : 0;
        const ltv = monetizedUsers > 0 ? revenue / monetizedUsers : 0;
        const ltvCacRatio = cac > 0 ? ltv / cac : ltv > 0 ? Infinity : 0;
        return { month, newUsers, activeUsers, monetizedUsers, investment, revenue, cac, ltv, ltvCacRatio };
      })
      .sort((a, b) => b.month.localeCompare(a.month));

    // Recurrence KPIs
    const repeatShopperCount = Array.from(paidPackagesByUser.values()).filter(c => c >= 2).length;
    const oneTimerShopperCount = monetizedUserIds.size - repeatShopperCount;
    const totalOrdersFromRepeat = Array.from(paidPackagesByUser.entries())
      .filter(([, c]) => c >= 2).reduce((sum, [, c]) => sum + c, 0);

    const tripsByUser = new Map<string, number>();
    tripsData.forEach(trip => {
      if (approvedTripStatuses.includes(trip.status)) {
        tripsByUser.set(trip.user_id, (tripsByUser.get(trip.user_id) || 0) + 1);
      }
    });
    const repeatTravelerCount = Array.from(tripsByUser.values()).filter(c => c >= 2).length;
    const oneTimeTravelerCount = activeTravelerIds.size - repeatTravelerCount;
    const totalTripsFromRepeat = Array.from(tripsByUser.entries())
      .filter(([, c]) => c >= 2).reduce((sum, [, c]) => sum + c, 0);

    const recurrenceKPIs: RecurrenceKPIs = {
      monetizedShoppers: monetizedUserIds.size,
      oneTimerShoppers: oneTimerShopperCount,
      repeatShoppers: repeatShopperCount,
      shopperRepeatRate: monetizedUserIds.size > 0 ? (repeatShopperCount / monetizedUserIds.size) * 100 : 0,
      avgOrdersPerRepeatShopper: repeatShopperCount > 0 ? totalOrdersFromRepeat / repeatShopperCount : 0,
      totalActiveTravelers: activeTravelerIds.size,
      oneTimeTravelers: oneTimeTravelerCount,
      repeatTravelers: repeatTravelerCount,
      travelerRepeatRate: activeTravelerIds.size > 0 ? (repeatTravelerCount / activeTravelerIds.size) * 100 : 0,
      avgTripsPerRepeatTraveler: repeatTravelerCount > 0 ? totalTripsFromRepeat / repeatTravelerCount : 0,
    };

    return { channelData: result, globalKPIs, shopperKPIs, travelerKPIs, monthlyData, recurrenceKPIs };
  }, [usersData, packagesData, tripsData, investmentsData, incidentCostsData, selectedMonth, exactUserCount]);

  return {
    channelData,
    globalKPIs,
    shopperKPIs: shopperKPIs || getEmptyShopperKPIs(),
    travelerKPIs: travelerKPIs || getEmptyTravelerKPIs(),
    recurrenceKPIs: recurrenceKPIs || getEmptyRecurrenceKPIs(),
    monthlyData,
    investments: investmentsData || [],
    incidentCosts: incidentCostsData || [],
    isLoading: usersLoading || packagesLoading || tripsLoading || investmentsLoading || incidentCostsLoading,
    addInvestment,
    deleteInvestment,
    updateInvestment,
    addIncidentCost,
    updateIncidentCost,
    deleteIncidentCost,
  };
};

function getEmptyGlobalKPIs(): GlobalKPIs {
  return {
    totalUsers: 0, totalActiveUsers: 0, totalMonetizedUsers: 0,
    globalActivationRate: 0, globalMonetizationRate: 0, globalConversionRate: 0,
    totalInvestment: 0, totalRevenue: 0, globalCAC: 0, globalLTV: 0, ltvCacRatio: 0,
    shopperInvestment: 0, shopperCAC: 0,
  };
}

function getEmptyShopperKPIs(): ShopperKPIs {
  return {
    totalShoppers: 0, activeShoppers: 0, monetizedShoppers: 0,
    shopperActivationRate: 0, shopperMonetizationRate: 0, shopperConversionRate: 0,
    shopperInvestment: 0, shopperRevenue: 0, shopperCAC: 0, shopperLTV: 0,
    shopperLtvCacRatio: 0, shopperARPU: 0, totalPaidPackages: 0, cacPerPaidOrder: 0,
    totalIncidentCosts: 0, netRevenue: 0, netLTV: 0, netLtvCacRatio: 0,
  };
}

function getEmptyTravelerKPIs(): TravelerKPIs {
  return {
    totalTravelers: 0, activeTravelers: 0, productiveTravelers: 0,
    travelerActivationRate: 0, travelerProductivityRate: 0,
    travelerInvestment: 0, travelerCAC: 0, avgPackagesPerTraveler: 0,
    totalPackagesDelivered: 0, costPerDeliveredPackage: 0, totalTipsDistributed: 0,
  };
}

function getEmptyRecurrenceKPIs(): RecurrenceKPIs {
  return {
    monetizedShoppers: 0, oneTimerShoppers: 0, repeatShoppers: 0,
    shopperRepeatRate: 0, avgOrdersPerRepeatShopper: 0,
    totalActiveTravelers: 0, oneTimeTravelers: 0, repeatTravelers: 0,
    travelerRepeatRate: 0, avgTripsPerRepeatTraveler: 0,
  };
}
