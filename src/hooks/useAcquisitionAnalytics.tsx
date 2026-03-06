import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

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

export interface AcquisitionChannelData {
  channel: string;
  channelLabel: string;
  totalUsers: number;
  totalPackages: number;
  paidPackages: number;
  monetizedUsers: number;
  conversionRate: number;
  totalServiceFee: number;
  totalRevenue: number;
  avgRevenuePerUser: number;
}

const CHANNEL_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram_ads: "Instagram Ads",
  facebook_ads: "Facebook Ads",
  instagram_facebook_ads: "Instagram/Facebook Ads",
  friend_referral: "Referidos",
  reels: "Reels",
  other: "Otro",
  null: "Sin respuesta",
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

export const useAcquisitionAnalytics = () => {
  // Fetch users with acquisition source
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['acquisition-users'],
    queryFn: async () => {
      return fetchAllPaginated((from, to) =>
        supabase
          .from('profiles')
          .select('id, acquisition_source')
          .range(from, to)
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch packages with user_id and quote
  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['acquisition-packages'],
    queryFn: async () => {
      return fetchAllPaginated((from, to) =>
        supabase
          .from('packages')
          .select('id, user_id, status, quote')
          .range(from, to)
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const acquisitionData = useMemo(() => {
    if (!usersData || !packagesData) {
      return [];
    }

    // Group users by acquisition source
    const channelMap = new Map<string, {
      users: Set<string>;
      monetizedUsers: Set<string>;
      packages: number;
      paidPackages: number;
      serviceFee: number;
      revenue: number;
    }>();

    // Initialize channel map with users
    usersData.forEach(user => {
      const channel = user.acquisition_source || 'null';
      if (!channelMap.has(channel)) {
        channelMap.set(channel, {
          users: new Set(),
          monetizedUsers: new Set(),
          packages: 0,
          paidPackages: 0,
          serviceFee: 0,
          revenue: 0,
        });
      }
      channelMap.get(channel)!.users.add(user.id);
    });

    // Create user to channel mapping for quick lookup
    const userChannelMap = new Map<string, string>();
    usersData.forEach(user => {
      userChannelMap.set(user.id, user.acquisition_source || 'null');
    });

    // Process packages
    packagesData.forEach(pkg => {
      const channel = userChannelMap.get(pkg.user_id);
      if (!channel || !channelMap.has(channel)) return;

      const channelData = channelMap.get(channel)!;
      channelData.packages++;

      if (PAID_STATUSES.includes(pkg.status)) {
        channelData.paidPackages++;
        
        if (pkg.quote) {
          const quote = pkg.quote as any;
          const serviceFee = parseFloat(quote.serviceFee || 0);
          const totalPrice = parseFloat(quote.totalPrice || quote.completePrice || 0);
          
          channelData.serviceFee += serviceFee;
          channelData.revenue += totalPrice;
        }
      }
    });

    // Convert to array and calculate metrics
    const result: AcquisitionChannelData[] = Array.from(channelMap.entries())
      .map(([channel, data]) => ({
        channel,
        channelLabel: CHANNEL_LABELS[channel] || channel,
        totalUsers: data.users.size,
        totalPackages: data.packages,
        paidPackages: data.paidPackages,
        conversionRate: data.users.size > 0 
          ? (data.paidPackages / data.users.size) * 100 
          : 0,
        totalServiceFee: data.serviceFee,
        totalRevenue: data.revenue,
        avgRevenuePerUser: data.users.size > 0 
          ? data.serviceFee / data.users.size 
          : 0,
      }))
      .sort((a, b) => b.totalServiceFee - a.totalServiceFee);

    return result;
  }, [usersData, packagesData]);

  // Calculate summary KPIs
  const summaryKPIs = useMemo(() => {
    if (acquisitionData.length === 0) {
      return {
        bestConversionChannel: null,
        bestVolumeChannel: null,
        bestRevenueChannel: null,
        totalServiceFee: 0,
      };
    }

    const bestConversion = [...acquisitionData].sort((a, b) => b.conversionRate - a.conversionRate)[0];
    const bestVolume = [...acquisitionData].sort((a, b) => b.totalUsers - a.totalUsers)[0];
    const bestRevenue = [...acquisitionData].sort((a, b) => b.totalServiceFee - a.totalServiceFee)[0];
    const totalServiceFee = acquisitionData.reduce((acc, d) => acc + d.totalServiceFee, 0);

    return {
      bestConversionChannel: bestConversion?.channelLabel || null,
      bestConversionRate: bestConversion?.conversionRate || 0,
      bestVolumeChannel: bestVolume?.channelLabel || null,
      bestVolumeCount: bestVolume?.totalUsers || 0,
      bestRevenueChannel: bestRevenue?.channelLabel || null,
      bestRevenueAmount: bestRevenue?.totalServiceFee || 0,
      totalServiceFee,
    };
  }, [acquisitionData]);

  return {
    acquisitionData,
    summaryKPIs,
    isLoading: usersLoading || packagesLoading,
  };
};
