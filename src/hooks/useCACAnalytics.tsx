import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface CACChannelData {
  channel: string;
  channelLabel: string;
  // Usuarios
  totalUsers: number;
  activeUsers: number;
  monetizedUsers: number;
  // Tasas
  activationRate: number;
  monetizationRate: number;
  overallConversionRate: number;
  // Financieros
  totalInvestment: number;
  totalRevenue: number;
  // CAC
  cacPerRegistration: number;
  cacPerActive: number;
  cacPerMonetized: number;
  // LTV
  avgLTV: number;
  ltvCacRatio: number;
}

export interface MarketingInvestment {
  id: string;
  channel: string;
  month: string;
  investment: number;
  notes: string | null;
  created_at: string;
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

// Normaliza canales históricos de IG/FB al canal unificado Meta
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

export const useCACAnalytics = (selectedMonth?: string) => {
  const queryClient = useQueryClient();

  // Fetch all users with acquisition source
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['cac-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, acquisition_source, created_at')
        .order('created_at', { ascending: true })
        .limit(10000);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all packages to determine active and monetized users
  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['cac-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('id, user_id, status, quote, created_at')
        .order('created_at', { ascending: true })
        .limit(20000);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch marketing investments
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

  // Add investment mutation
  const addInvestment = useMutation({
    mutationFn: async (investment: { channel: string; month: string; investment: number; notes?: string }) => {
      const { data, error } = await supabase
        .from('marketing_investments')
        .upsert({
          channel: investment.channel,
          month: investment.month,
          investment: investment.investment,
          notes: investment.notes || null,
        }, { onConflict: 'channel,month' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-investments'] });
    },
  });

  // Delete investment mutation
  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_investments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-investments'] });
    },
  });

  // Update investment mutation
  const updateInvestment = useMutation({
    mutationFn: async ({ id, ...investment }: { id: string; channel: string; month: string; investment: number; notes?: string }) => {
      const { data, error } = await supabase
        .from('marketing_investments')
        .update({
          channel: investment.channel,
          month: investment.month,
          investment: investment.investment,
          notes: investment.notes || null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-investments'] });
    },
  });

  // Process data to calculate CAC metrics
  const { channelData, globalKPIs, monthlyData } = useMemo(() => {
    if (!usersData || !packagesData) {
      return { channelData: [], globalKPIs: getEmptyGlobalKPIs(), monthlyData: [] };
    }

    // Create sets for active and monetized users
    const activeUserIds = new Set<string>();
    const monetizedUserIds = new Set<string>();
    const userRevenue = new Map<string, number>();

    packagesData.forEach(pkg => {
      // Any user with a package is active
      activeUserIds.add(pkg.user_id);

      // Users with paid packages are monetized
      if (PAID_STATUSES.includes(pkg.status)) {
        monetizedUserIds.add(pkg.user_id);
        
        // Calculate revenue from service fees
        if (pkg.quote) {
          const quote = pkg.quote as any;
          const serviceFee = parseFloat(quote.serviceFee || 0);
          const current = userRevenue.get(pkg.user_id) || 0;
          userRevenue.set(pkg.user_id, current + serviceFee);
        }
      }
    });

    // Group data by channel
    const channelMap = new Map<string, {
      users: Set<string>;
      activeUsers: Set<string>;
      monetizedUsers: Set<string>;
      revenue: number;
    }>();

    // Initialize channels and count users
    usersData.forEach(user => {
      const channel = normalizeChannel(user.acquisition_source);
      
      if (!channelMap.has(channel)) {
        channelMap.set(channel, {
          users: new Set(),
          activeUsers: new Set(),
          monetizedUsers: new Set(),
          revenue: 0,
        });
      }
      
      const data = channelMap.get(channel)!;
      data.users.add(user.id);
      
      if (activeUserIds.has(user.id)) {
        data.activeUsers.add(user.id);
      }
      
      if (monetizedUserIds.has(user.id)) {
        data.monetizedUsers.add(user.id);
        data.revenue += userRevenue.get(user.id) || 0;
      }
    });

    // Get investments by channel (sum all months or filter by selected month)
    const investmentsByChannel = new Map<string, number>();
    if (investmentsData) {
      investmentsData.forEach(inv => {
        if (!selectedMonth || inv.month === selectedMonth) {
          const current = investmentsByChannel.get(inv.channel) || 0;
          investmentsByChannel.set(inv.channel, current + inv.investment);
        }
      });
    }

    // Build channel data array
    const result: CACChannelData[] = Array.from(channelMap.entries())
      .map(([channel, data]) => {
        const totalUsers = data.users.size;
        const activeUsers = data.activeUsers.size;
        const monetizedUsers = data.monetizedUsers.size;
        const totalInvestment = investmentsByChannel.get(channel) || 0;
        const totalRevenue = data.revenue;

        const activationRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
        const monetizationRate = activeUsers > 0 ? (monetizedUsers / activeUsers) * 100 : 0;
        const overallConversionRate = totalUsers > 0 ? (monetizedUsers / totalUsers) * 100 : 0;

        const cacPerRegistration = totalUsers > 0 && totalInvestment > 0 ? totalInvestment / totalUsers : 0;
        const cacPerActive = activeUsers > 0 && totalInvestment > 0 ? totalInvestment / activeUsers : 0;
        const cacPerMonetized = monetizedUsers > 0 && totalInvestment > 0 ? totalInvestment / monetizedUsers : 0;

        const avgLTV = monetizedUsers > 0 ? totalRevenue / monetizedUsers : 0;
        const ltvCacRatio = cacPerMonetized > 0 ? avgLTV / cacPerMonetized : avgLTV > 0 ? Infinity : 0;

        return {
          channel,
          channelLabel: CHANNEL_LABELS[channel] || channel,
          totalUsers,
          activeUsers,
          monetizedUsers,
          activationRate,
          monetizationRate,
          overallConversionRate,
          totalInvestment,
          totalRevenue,
          cacPerRegistration,
          cacPerActive,
          cacPerMonetized,
          avgLTV,
          ltvCacRatio,
        };
      })
      .sort((a, b) => b.totalUsers - a.totalUsers);

    // Calculate global KPIs
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
    };

    globalKPIs.ltvCacRatio = globalKPIs.globalCAC > 0 
      ? globalKPIs.globalLTV / globalKPIs.globalCAC 
      : globalKPIs.globalLTV > 0 ? Infinity : 0;

    // Calculate monthly data
    const monthlyMap = new Map<string, {
      newUsers: Set<string>;
      activeUsers: Set<string>;
      monetizedUsers: Set<string>;
      revenue: number;
    }>();

    // Group users by registration month
    usersData.forEach(user => {
      if (!user.created_at) return;
      const month = user.created_at.substring(0, 7); // YYYY-MM
      
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          newUsers: new Set(),
          activeUsers: new Set(),
          monetizedUsers: new Set(),
          revenue: 0,
        });
      }
      
      const data = monthlyMap.get(month)!;
      data.newUsers.add(user.id);
      
      if (activeUserIds.has(user.id)) {
        data.activeUsers.add(user.id);
      }
      
      if (monetizedUserIds.has(user.id)) {
        data.monetizedUsers.add(user.id);
        data.revenue += userRevenue.get(user.id) || 0;
      }
    });

    // Get investments by month (sum all channels)
    const investmentsByMonth = new Map<string, number>();
    if (investmentsData) {
      investmentsData.forEach(inv => {
        const current = investmentsByMonth.get(inv.month) || 0;
        investmentsByMonth.set(inv.month, current + inv.investment);
      });
    }

    // Build monthly data array
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

        return {
          month,
          newUsers,
          activeUsers,
          monetizedUsers,
          investment,
          revenue,
          cac,
          ltv,
          ltvCacRatio,
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month)); // Most recent first

    return { channelData: result, globalKPIs, monthlyData };
  }, [usersData, packagesData, investmentsData, selectedMonth]);

  return {
    channelData,
    globalKPIs,
    monthlyData,
    investments: investmentsData || [],
    isLoading: usersLoading || packagesLoading || investmentsLoading,
    addInvestment,
    deleteInvestment,
    updateInvestment,
  };
};

function getEmptyGlobalKPIs(): GlobalKPIs {
  return {
    totalUsers: 0,
    totalActiveUsers: 0,
    totalMonetizedUsers: 0,
    globalActivationRate: 0,
    globalMonetizationRate: 0,
    globalConversionRate: 0,
    totalInvestment: 0,
    totalRevenue: 0,
    globalCAC: 0,
    globalLTV: 0,
    ltvCacRatio: 0,
  };
}
