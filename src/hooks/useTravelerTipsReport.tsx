import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TravelerTipsData {
  totalTravelersWithCompleted: number;
  totalCompletedPackages: number;
  totalTipsDistributed: number;
  avgTipPerPackage: number;
  avgTipPerTraveler: number;
}

export interface TravelerTipsReport {
  data: TravelerTipsData;
  isLoading: boolean;
  error: Error | null;
}

export const useTravelerTipsReport = (): TravelerTipsReport => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['traveler-tips-report'],
    queryFn: async () => {
      // Fetch packages with completed status and valid tips
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('id, quote, matched_trip_id')
        .in('status', ['completed', 'delivered_to_office', 'pending_office_confirmation'])
        .not('quote', 'is', null)
        .not('matched_trip_id', 'is', null);

      if (packagesError) throw packagesError;

      // Get unique trip IDs to fetch traveler info
      const tripIds = [...new Set(packagesData?.map(p => p.matched_trip_id).filter(Boolean) as string[])];
      
      // Fetch trips to get traveler user_ids
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, user_id')
        .in('id', tripIds);

      if (tripsError) throw tripsError;

      // Create a map of trip_id -> user_id
      const tripToUserMap = new Map<string, string>();
      tripsData?.forEach(trip => {
        tripToUserMap.set(trip.id, trip.user_id);
      });

      // Process the data
      const travelersSet = new Set<string>();
      let totalTips = 0;
      let validPackagesCount = 0;

      packagesData?.forEach(pkg => {
        const quote = pkg.quote as Record<string, unknown> | null;
        const price = quote?.price;
        
        if (price !== null && price !== undefined) {
          const tipAmount = parseFloat(String(price)) || 0;
          if (tipAmount > 0) {
            totalTips += tipAmount;
            validPackagesCount++;
            
            // Get traveler user_id from the trip map
            const userId = pkg.matched_trip_id ? tripToUserMap.get(pkg.matched_trip_id) : null;
            if (userId) {
              travelersSet.add(userId);
            }
          }
        }
      });

      const totalTravelers = travelersSet.size;
      const avgTipPerPackage = validPackagesCount > 0 ? totalTips / validPackagesCount : 0;
      const avgTipPerTraveler = totalTravelers > 0 ? totalTips / totalTravelers : 0;

      return {
        totalTravelersWithCompleted: totalTravelers,
        totalCompletedPackages: validPackagesCount,
        totalTipsDistributed: totalTips,
        avgTipPerPackage,
        avgTipPerTraveler,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: data || {
      totalTravelersWithCompleted: 0,
      totalCompletedPackages: 0,
      totalTipsDistributed: 0,
      avgTipPerPackage: 0,
      avgTipPerTraveler: 0,
    },
    isLoading,
    error: error as Error | null,
  };
};
