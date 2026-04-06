import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface AssignmentStats {
  responded: number;
  noResponse: number;
  pending: number;
  cancelled: number;
}

export interface TravelerHistory {
  completedTrips: number;
  deliveredPackages: number;
}

export interface TripStats {
  assignments: AssignmentStats;
  travelerHistory: TravelerHistory;
}

export const useTripAssignmentStats = (
  trips: { tripId: string; userId: string }[]
) => {
  const userIds = useMemo(() => [...new Set(trips.map(t => t.userId))], [trips]);

  // Single RPC call replaces 3 separate queries + client-side counting
  const { data: batchStats } = useQuery({
    queryKey: ["traveler-stats-batch", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase.rpc('get_traveler_stats_batch', {
        p_user_ids: userIds
      });
      if (error) throw error;
      return data || [];
    },
    enabled: userIds.length > 0,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });

  const statsMap = useMemo(() => {
    const map: Record<string, TripStats> = {};

    // Build a user_id -> stats lookup from the RPC result
    const userStatsMap = new Map<string, {
      completedTrips: number;
      deliveredPackages: number;
      responded: number;
      noResponse: number;
      pending: number;
      cancelled: number;
    }>();

    (batchStats || []).forEach((row: any) => {
      userStatsMap.set(row.user_id, {
        completedTrips: Number(row.completed_trips) || 0,
        deliveredPackages: Number(row.delivered_packages) || 0,
        responded: Number(row.assignments_responded) || 0,
        noResponse: Number(row.assignments_no_response) || 0,
        pending: Number(row.assignments_pending) || 0,
        cancelled: Number(row.assignments_cancelled) || 0,
      });
    });

    // Map each trip to its traveler's stats
    trips.forEach(({ tripId, userId }) => {
      const userStats = userStatsMap.get(userId);
      map[tripId] = {
        assignments: {
          responded: userStats?.responded || 0,
          noResponse: userStats?.noResponse || 0,
          pending: userStats?.pending || 0,
          cancelled: userStats?.cancelled || 0,
        },
        travelerHistory: {
          completedTrips: userStats?.completedTrips || 0,
          deliveredPackages: userStats?.deliveredPackages || 0,
        },
      };
    });

    return map;
  }, [batchStats, trips]);

  return statsMap;
};
