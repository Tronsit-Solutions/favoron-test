import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface AssignmentStats {
  responded: number;   // bid_submitted + bid_won + bid_lost + bid_expired with quote
  noResponse: number;  // bid_expired without quote
  pending: number;     // bid_pending
  cancelled: number;   // bid_cancelled
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
  const tripIds = useMemo(() => trips.map(t => t.tripId), [trips]);
  const userIds = useMemo(() => [...new Set(trips.map(t => t.userId))], [trips]);

  // Fetch assignment data for all trip IDs
  const { data: assignmentsData } = useQuery({
    queryKey: ["trip-assignment-stats", tripIds],
    queryFn: async () => {
      if (tripIds.length === 0) return [];
      const { data, error } = await supabase
        .from("package_assignments")
        .select("trip_id, status, quote")
        .in("trip_id", tripIds);
      if (error) throw error;
      return data || [];
    },
    enabled: tripIds.length > 0,
  });

  // Fetch traveler history: completed trips
  const { data: travelerTripsData } = useQuery({
    queryKey: ["traveler-completed-trips", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("trips")
        .select("user_id, status")
        .in("user_id", userIds)
        .in("status", ["completed_paid"]);
      if (error) throw error;
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  // Fetch traveler history: delivered packages (via matched_trip_id -> trip.user_id)
  const { data: deliveredPackagesData } = useQuery({
    queryKey: ["traveler-delivered-packages", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      // Get all trips for these users, then count packages
      const { data: userTrips, error: tripsError } = await supabase
        .from("trips")
        .select("id, user_id")
        .in("user_id", userIds);
      if (tripsError) throw tripsError;
      if (!userTrips || userTrips.length === 0) return [];

      const allTripIds = userTrips.map(t => t.id);
      const { data: pkgs, error: pkgsError } = await supabase
        .from("packages")
        .select("matched_trip_id, status")
        .in("matched_trip_id", allTripIds)
        .in("status", ["completed", "completed_paid", "delivered_to_office"]);
      if (pkgsError) throw pkgsError;

      // Map trip_id -> user_id
      const tripToUser = new Map(userTrips.map(t => [t.id, t.user_id]));
      
      // Count per user
      const counts: Record<string, number> = {};
      (pkgs || []).forEach(pkg => {
        const uid = tripToUser.get(pkg.matched_trip_id!);
        if (uid) counts[uid] = (counts[uid] || 0) + 1;
      });
      return counts;
    },
    enabled: userIds.length > 0,
  });

  const statsMap = useMemo(() => {
    const map: Record<string, TripStats> = {};
    
    // Build assignments per trip
    const assignmentsByTrip: Record<string, AssignmentStats> = {};
    (assignmentsData || []).forEach(a => {
      if (!assignmentsByTrip[a.trip_id]) {
        assignmentsByTrip[a.trip_id] = { responded: 0, noResponse: 0, pending: 0, cancelled: 0 };
      }
      const stats = assignmentsByTrip[a.trip_id];
      if (['bid_submitted', 'bid_won', 'bid_lost'].includes(a.status)) {
        stats.responded++;
      } else if (a.status === 'bid_expired') {
        if (a.quote) stats.responded++;
        else stats.noResponse++;
      } else if (a.status === 'bid_pending') {
        stats.pending++;
      } else if (a.status === 'bid_cancelled') {
        stats.cancelled++;
      }
    });

    // Build traveler history per user
    const completedTripsPerUser: Record<string, number> = {};
    (travelerTripsData || []).forEach(t => {
      completedTripsPerUser[t.user_id] = (completedTripsPerUser[t.user_id] || 0) + 1;
    });

    const deliveredPkgPerUser = (deliveredPackagesData as Record<string, number>) || {};

    // Combine
    trips.forEach(({ tripId, userId }) => {
      map[tripId] = {
        assignments: assignmentsByTrip[tripId] || { responded: 0, noResponse: 0, pending: 0, cancelled: 0 },
        travelerHistory: {
          completedTrips: completedTripsPerUser[userId] || 0,
          deliveredPackages: deliveredPkgPerUser[userId] || 0,
        },
      };
    });

    return map;
  }, [assignmentsData, travelerTripsData, deliveredPackagesData, trips]);

  return statsMap;
};
