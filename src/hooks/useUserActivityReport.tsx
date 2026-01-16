import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserActivityData {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  // Package stats
  totalPackages: number;
  completedPackages: number;
  cancelledPackages: number;
  pendingPackages: number;
  // Trip stats  
  totalTrips: number;
  completedTrips: number;
  tripsWithPackages: number;
  tripsWithoutCompletedPackages: number;
  // Classification
  userType: 'shopper_only' | 'traveler_only' | 'both' | 'inactive_traveler';
  hasActivity: boolean;
}

export interface UserActivitySummary {
  totalActiveUsers: number;
  shoppersOnly: number;
  travelersOnly: number;
  bothRoles: number;
  inactiveTravelers: number;
}

export const useUserActivityReport = () => {
  // Fetch profiles
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['user-activity-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(10000);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch packages
  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['user-activity-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('id, user_id, status, matched_trip_id')
        .limit(20000);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch trips
  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['user-activity-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('id, user_id, status')
        .limit(10000);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = profilesLoading || packagesLoading || tripsLoading;

  // Process data
  const processedData: UserActivityData[] = [];
  const summary: UserActivitySummary = {
    totalActiveUsers: 0,
    shoppersOnly: 0,
    travelersOnly: 0,
    bothRoles: 0,
    inactiveTravelers: 0,
  };

  if (profiles && packages && trips) {
    // Create lookup maps
    const packagesByUser = new Map<string, typeof packages>();
    const tripsByUser = new Map<string, typeof trips>();
    const packagesPerTrip = new Map<string, { total: number; completed: number }>();

    // Group packages by user
    packages.forEach(pkg => {
      if (!packagesByUser.has(pkg.user_id)) {
        packagesByUser.set(pkg.user_id, []);
      }
      packagesByUser.get(pkg.user_id)!.push(pkg);

      // Track packages per trip
      if (pkg.matched_trip_id) {
        if (!packagesPerTrip.has(pkg.matched_trip_id)) {
          packagesPerTrip.set(pkg.matched_trip_id, { total: 0, completed: 0 });
        }
        const tripStats = packagesPerTrip.get(pkg.matched_trip_id)!;
        tripStats.total++;
        if (pkg.status === 'completed') {
          tripStats.completed++;
        }
      }
    });

    // Group trips by user
    trips.forEach(trip => {
      if (!tripsByUser.has(trip.user_id)) {
        tripsByUser.set(trip.user_id, []);
      }
      tripsByUser.get(trip.user_id)!.push(trip);
    });

    // Process each profile
    profiles.forEach(profile => {
      const userPackages = packagesByUser.get(profile.id) || [];
      const userTrips = tripsByUser.get(profile.id) || [];

      // Package stats
      const totalPackages = userPackages.length;
      const completedPackages = userPackages.filter(p => p.status === 'completed').length;
      const cancelledPackages = userPackages.filter(p => 
        p.status === 'cancelled' || p.status === 'rejected'
      ).length;
      const pendingPackages = totalPackages - completedPackages - cancelledPackages;

      // Trip stats
      const totalTrips = userTrips.length;
      const completedTrips = userTrips.filter(t => t.status === 'completed').length;
      
      // Count trips that had packages assigned
      let tripsWithPackages = 0;
      let tripsWithCompletedPackages = 0;
      
      userTrips.forEach(trip => {
        const tripPackageStats = packagesPerTrip.get(trip.id);
        if (tripPackageStats && tripPackageStats.total > 0) {
          tripsWithPackages++;
          if (tripPackageStats.completed > 0) {
            tripsWithCompletedPackages++;
          }
        }
      });

      const tripsWithoutCompletedPackages = totalTrips - tripsWithCompletedPackages;

      // Determine user type
      const hasShopped = totalPackages > 0;
      const hasTraveled = totalTrips > 0;
      const hasCompletedAnyFavoron = tripsWithCompletedPackages > 0;

      let userType: UserActivityData['userType'];
      
      if (hasShopped && hasTraveled) {
        userType = 'both';
      } else if (hasShopped) {
        userType = 'shopper_only';
      } else if (hasTraveled) {
        // Traveler who never completed a favoron
        userType = hasCompletedAnyFavoron ? 'traveler_only' : 'inactive_traveler';
      } else {
        // No activity at all - skip
        return;
      }

      const hasActivity = hasShopped || hasTraveled;

      if (hasActivity) {
        processedData.push({
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          created_at: profile.created_at,
          totalPackages,
          completedPackages,
          cancelledPackages,
          pendingPackages,
          totalTrips,
          completedTrips,
          tripsWithPackages,
          tripsWithoutCompletedPackages,
          userType,
          hasActivity,
        });

        // Update summary
        summary.totalActiveUsers++;
        if (userType === 'shopper_only') summary.shoppersOnly++;
        else if (userType === 'traveler_only') summary.travelersOnly++;
        else if (userType === 'both') summary.bothRoles++;
        else if (userType === 'inactive_traveler') summary.inactiveTravelers++;
      }
    });
  }

  return {
    data: processedData,
    summary,
    isLoading,
  };
};
