import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { useUnreadChatMessages } from '@/hooks/useUnreadChatMessages';

export type Package = Tables<'packages'>;
export type Trip = Tables<'trips'>;

interface AdminData {
  packages: Package[];
  trips: Trip[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  loadMorePackages: () => Promise<void>;
  hasMorePackages: boolean;
  totalPackages: number;
  unreadCounts: { [packageId: string]: number };
  markPackageMessagesAsRead: (packageId: string) => Promise<void>;
}

export const useAdminData = (): AdminData => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packagesOffset, setPackagesOffset] = useState(0);
  const [totalPackages, setTotalPackages] = useState(0);
  const [hasMorePackages, setHasMorePackages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { toast } = useToast();
  const { user, userRole, loading: authLoading } = useAuth();
  const { unreadCounts, markPackageMessagesAsRead } = useUnreadChatMessages();

  const PACKAGES_PER_PAGE = 50;

  // Persistir estado admin para evitar pérdida temporal durante refresh
  const [wasAdmin, setWasAdmin] = useState(() => {
    try {
      return localStorage.getItem('temp_admin_state') === 'true';
    } catch {
      return false;
    }
  });

  const isAdmin = useMemo(() => {
    const currentlyAdmin = userRole?.role === 'admin';
    
    if (currentlyAdmin) {
      setWasAdmin(true);
      try {
        localStorage.setItem('temp_admin_state', 'true');
      } catch {}
    } else if (!authLoading && userRole) {
      setWasAdmin(false);
      try {
        localStorage.removeItem('temp_admin_state');
      } catch {}
    }
    
    return currentlyAdmin;
  }, [userRole, authLoading]);

  const fetchAdminPackages = useCallback(async (offset: number = 0, append: boolean = false) => {
    try {
      console.log('🔄 Admin: Fetching packages with pagination...', { offset, limit: PACKAGES_PER_PAGE, append });
      
      const { data, error } = await supabase
        .rpc('get_admin_packages_paginated', {
          p_limit: PACKAGES_PER_PAGE,
          p_offset: offset,
          p_status: null,
          p_search: null,
          p_trip_id: null
        });

      if (error) {
        console.error('❌ Admin: RPC Error, falling back to direct query...', error);
        
        // Fallback to direct query
        const { data: fallbackData, error: fallbackError, count } = await supabase
          .from('packages')
          .select(`
            *,
            profiles:user_id (
              id, email, first_name, last_name, phone_number, avatar_url, username, trust_level, prime_expires_at
            ),
            trips:matched_trip_id (
              id, from_city, to_city, departure_date, arrival_date, delivery_date,
              profiles:user_id (id, email, first_name, last_name, username, avatar_url)
            )
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + PACKAGES_PER_PAGE - 1);

        if (fallbackError) {
          throw fallbackError;
        }

        setTotalPackages(count || 0);
        setHasMorePackages(offset + PACKAGES_PER_PAGE < (count || 0));

        console.log('✅ Admin: Fallback query succeeded:', {
          count: fallbackData?.length || 0,
          total: count || 0,
          hasMore: offset + PACKAGES_PER_PAGE < (count || 0),
          offset
        });

        return fallbackData || [];
      }

      if (!data || data.length === 0) {
        console.log('✅ Admin: No more packages to fetch');
        setHasMorePackages(false);
        return [];
      }

      // Transform RPC result to match Package type
      const transformedPackages = data.map((row: any) => ({
        ...row,
        profiles: row.user_email ? {
          id: row.user_id,
          first_name: row.user_first_name,
          last_name: row.user_last_name,
          email: row.user_email,
          phone_number: row.user_phone_number,
          avatar_url: row.user_avatar_url,
          username: null,
          trust_level: null,
          prime_expires_at: null
        } : null,
        trips: row.trip_from_city ? {
          id: row.matched_trip_id,
          from_city: row.trip_from_city,
          to_city: row.trip_to_city,
          departure_date: row.trip_departure_date,
          arrival_date: row.trip_arrival_date,
          delivery_date: null,
          profiles: row.trip_user_email ? {
            id: row.trip_user_id,
            first_name: row.trip_user_first_name,
            last_name: row.trip_user_last_name,
            email: row.trip_user_email,
            username: null,
            avatar_url: null
          } : null
        } : null
      }));

      // Get total count from first row
      const total = data[0]?.total_count || 0;
      setTotalPackages(total);
      setHasMorePackages(offset + data.length < total);

      console.log('✅ Admin: Fetched packages:', {
        count: transformedPackages.length,
        total,
        hasMore: offset + data.length < total,
        offset
      });

      return transformedPackages;
    } catch (error: any) {
      console.error('❌ Admin: Package fetch failed:', error);
      setError(`Error cargando paquetes: ${error.message}`);
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes del administrador",
        variant: "destructive",
      });
      return [];
    }
  }, [toast, PACKAGES_PER_PAGE]);

  const fetchAdminTrips = useCallback(async () => {
    try {
      console.log('🔄 Admin: Fetching all trips using secure admin RPC...');
      
      const { data, error } = await supabase
        .rpc('get_admin_trips_with_user');

      if (error) {
        console.error('❌ Admin: Error fetching trips:', error);
        throw error;
      }

      let tripsResult: any[] = data || [];
      console.log('✅ Admin: Fetched trips:', tripsResult.length);

      // Create synthetic profiles and public_profiles, and compute traveler_display_name
      tripsResult = tripsResult.map((t) => {
        const nameFromFull = `${t.first_name || ''} ${t.last_name || ''}`.trim();
        const travelerDisplay = t.user_display_name || nameFromFull || t.username || t.email || `Usuario ${String(t.user_id || '').slice(0, 8)}`;
        return {
          ...t,
          user_display_name: t.user_display_name,
          first_name: t.first_name,
          last_name: t.last_name,
          username: t.username,
          email: t.email,
          phone_number: t.phone_number,
          traveler_display_name: travelerDisplay,
          profiles: {
            id: t.user_id,
            display_name: t.user_display_name,
            first_name: t.first_name,
            last_name: t.last_name,
            username: t.username,
            email: t.email,
            avatar_url: null,
            phone_number: t.phone_number
          },
          public_profiles: {
            id: t.user_id,
            first_name: t.first_name,
            last_name: t.last_name,
            username: t.username,
            avatar_url: null
          }
        };
      });

      console.log('🔍 Admin: Sample trip data for debugging:', tripsResult.slice(0, 2).map(t => ({
        id: t.id.slice(0, 8),
        traveler_display_name: t.traveler_display_name,
        user_display_name: t.user_display_name,
        first_name: t.first_name,
        last_name: t.last_name,
        username: t.username,
        email: t.email,
        phone_number: t.phone_number
      })));

      console.log('✅ Admin: Created synthetic profiles for trips');
      return tripsResult;
    } catch (error: any) {
      console.error('❌ Admin: Trip fetch failed:', error);
      setError(`Error cargando viajes: ${error.message}`);
      toast({
        title: "Error",
        description: "No se pudieron cargar los viajes del administrador",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const loadMorePackages = useCallback(async () => {
    if (isLoadingMore || !hasMorePackages) {
      console.log('⏭️ Admin: Skipping load more', { isLoadingMore, hasMorePackages });
      return;
    }

    console.log('🔄 Admin: Loading more packages...', { currentOffset: packagesOffset });
    setIsLoadingMore(true);

    try {
      const newOffset = packagesOffset + PACKAGES_PER_PAGE;
      const morePackages = await fetchAdminPackages(newOffset, true);
      
      if (morePackages.length > 0) {
        setPackages(prev => [...prev, ...morePackages]);
        setPackagesOffset(newOffset);
      }
    } catch (error: any) {
      console.error('❌ Admin: Load more failed:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar más paquetes",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMorePackages, packagesOffset, fetchAdminPackages, toast, PACKAGES_PER_PAGE]);

  const refreshData = useCallback(async (forceRefresh = false) => {
    const shouldSkip = !user || (authLoading && !wasAdmin);
    
    if (shouldSkip && !forceRefresh) {
      console.log('⏭️ Admin: Skipping refresh', { 
        authLoading, 
        isAdmin, 
        wasAdmin, 
        hasUser: !!user,
        reason: !user ? 'no_user' : 'loading_and_not_was_admin'
      });
      return;
    }

    console.log('🔄 Admin: Starting data refresh...', { isAdmin, wasAdmin, authLoading, forceRefresh });
    setLoading(true);
    setError(null);
    setPackagesOffset(0);
    setHasMorePackages(true);

    try {
      const [packagesData, tripsData] = await Promise.all([
        fetchAdminPackages(0, false),
        fetchAdminTrips()
      ]);

      setPackages(packagesData);
      setTrips(tripsData);
      
      console.log('✅ Admin: Data refresh complete', {
        packages: packagesData.length,
        trips: tripsData.length,
        totalPackages
      });
    } catch (error: any) {
      console.error('❌ Admin: Data refresh failed:', error);
      setError(error.message);
      
      if (!authLoading && (isAdmin || wasAdmin)) {
        console.log('🔄 Admin: Scheduling retry in 2 seconds...');
        setTimeout(() => {
          refreshData();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, wasAdmin, authLoading, user, fetchAdminPackages, fetchAdminTrips, totalPackages]);

  useEffect(() => {
    console.log('🔍 Admin: Effect triggered', {
      isAdmin,
      wasAdmin,
      authLoading,
      user: !!user,
      userRole: userRole?.role
    });

    if ((isAdmin || wasAdmin) && user) {
      console.log('🚀 Admin: Starting initial data load...');
      refreshData();
    } else if (!authLoading && !isAdmin && !wasAdmin && userRole) {
      console.log('⚠️ Admin: User is definitively not admin, clearing data');
      setPackages([]);
      setTrips([]);
      setLoading(false);
    }
  }, [isAdmin, wasAdmin, authLoading, user, refreshData]);

  useEffect(() => {
    const shouldRetry = !loading && 
                       !authLoading && 
                       (isAdmin || wasAdmin) && 
                       user &&
                       packages.length === 0 && 
                       trips.length === 0 && 
                       !error;

    if (shouldRetry) {
      console.log('🔄 Admin: Data appears empty, retrying with enhanced conditions...');
      const retryTimer = setTimeout(() => {
        refreshData();
      }, 1500);
      
      return () => clearTimeout(retryTimer);
    }
  }, [loading, authLoading, isAdmin, wasAdmin, user, packages.length, trips.length, error, refreshData]);

  const optimisticUpdatePackage = useCallback((packageId: string, updates: any) => {
    console.log('🚀 Admin: Optimistic package update:', packageId, updates);
    setPackages(prevPackages => 
      prevPackages.map(pkg => 
        pkg.id === packageId ? { ...pkg, ...updates } : pkg
      )
    );
  }, []);

  const optimisticUpdateTrip = useCallback((tripId: string, updates: any) => {
    console.log('🚀 Admin: Optimistic trip update:', tripId, updates);
    setTrips(prevTrips => 
      prevTrips.map(trip => 
        trip.id === tripId ? { ...trip, ...updates } : trip
      )
    );
  }, []);

  const memoizedResult = useMemo(() => ({
    packages,
    trips,
    loading,
    error,
    refreshData,
    loadMorePackages,
    hasMorePackages,
    totalPackages,
    optimisticUpdatePackage,
    optimisticUpdateTrip,
    unreadCounts,
    markPackageMessagesAsRead
  }), [packages, trips, loading, error, refreshData, loadMorePackages, hasMorePackages, totalPackages, optimisticUpdatePackage, optimisticUpdateTrip, unreadCounts, markPackageMessagesAsRead]);

  console.log('📊 Admin: Returning data', {
    packagesCount: packages.length,
    tripsCount: trips.length,
    loading,
    error: !!error,
    isAdmin
  });

  return memoizedResult;
};
