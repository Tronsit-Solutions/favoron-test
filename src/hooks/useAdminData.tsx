import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { useUnreadChatMessages } from '@/hooks/useUnreadChatMessages';

export type Package = Tables<'packages'>;
export type Trip = Tables<'trips'>;

// Lightweight package for admin list views - heavy JSONB fields are optional and loaded on-demand
export type LightweightPackage = Package & {
  profiles?: any; // Enriched from separate query
};

interface AdminData {
  packages: LightweightPackage[];
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
  const [packages, setPackages] = useState<LightweightPackage[]>([]);
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
    
    console.log('🔑 Admin check:', {
      userRole,
      currentlyAdmin,
      authLoading,
      wasAdmin,
      userId: user?.id
    });
    
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
  }, [userRole, authLoading, user, wasAdmin]);

  const fetchAdminPackages = useCallback(async (offset: number = 0, append: boolean = false) => {
    try {
      console.log('🔄 Admin: Fetching packages (DIRECT QUERY)...', { offset, limit: PACKAGES_PER_PAGE, append });
      
      // Optimized query: only essential lightweight fields (no heavy JSONB)
      const { data: packagesData, error: packagesError, count } = await supabase
        .from('packages')
        .select(`
          id, user_id, status, item_description, estimated_price,
          purchase_origin, package_destination, matched_trip_id,
          created_at, updated_at, delivery_deadline, quote_expires_at,
          matched_assignment_expires_at, label_number, incident_flag,
          delivery_method, quote, rejection_reason, wants_requote,
          admin_rejection, quote_rejection, traveler_rejection,
          admin_actions_log, internal_notes, admin_assigned_tip,
          confirmed_delivery_address, traveler_address, matched_trip_dates
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + PACKAGES_PER_PAGE - 1);

      if (packagesError) {
        console.error('❌ Admin: Packages query error:', packagesError);
        throw packagesError;
      }

      setTotalPackages(count || 0);
      setHasMorePackages(offset + PACKAGES_PER_PAGE < (count || 0));

      console.log('✅ Admin: Fetched packages successfully:', {
        count: packagesData?.length || 0,
        total: count || 0,
        hasMore: offset + PACKAGES_PER_PAGE < (count || 0),
        offset
      });

      // Get unique user IDs from packages (shoppers)
      if (packagesData && packagesData.length > 0) {
        const userIds = [...new Set(packagesData.map(pkg => pkg.user_id))];
        console.log('🔄 Admin: Fetching shopper profiles...', { userIds: userIds.length });
        
        // Fetch shopper profiles in a separate query
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email, phone_number, country_code, trust_level, prime_expires_at')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ Admin: Error fetching profiles:', profilesError);
        } else {
          // Create a map for quick lookup
          const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
          
          // Attach profiles to packages
          const enrichedPackages = packagesData.map(pkg => ({
            ...pkg,
            profiles: profilesMap.get(pkg.user_id) || null
          })) as LightweightPackage[];
          
          console.log('✅ Admin: Enriched packages with shopper profiles');
          return enrichedPackages;
        }
      }

      return (packagesData || []) as LightweightPackage[];
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

  const fetchMatchedPackages = useCallback(async () => {
    try {
      console.log('🔄 Admin: Fetching ALL matched packages...');
      
      // Load ALL packages with a matched_trip_id - ONLY lightweight fields
      // Heavy JSONB fields (products_data, payment_receipt, etc.) loaded on-demand
      const { data: matchedData, error: matchedError } = await supabase
        .from('packages')
        .select(`
          id,
          user_id,
          status,
          item_description,
          estimated_price,
          purchase_origin,
          package_destination,
          matched_trip_id,
          created_at,
          updated_at,
          delivery_deadline,
          quote_expires_at,
          matched_assignment_expires_at,
          label_number,
          incident_flag,
          delivery_method,
          quote,
          rejection_reason,
          wants_requote,
          admin_rejection,
          quote_rejection,
          traveler_rejection,
          admin_actions_log,
          internal_notes,
          admin_assigned_tip,
          confirmed_delivery_address,
          traveler_address,
          matched_trip_dates
        `)
        .not('matched_trip_id', 'is', null)
        .order('created_at', { ascending: false });

      if (matchedError) {
        console.error('❌ Admin: Matched packages query error:', matchedError);
        throw matchedError;
      }

      console.log('✅ Admin: Fetched matched packages:', matchedData?.length || 0);

      // Enrich with profiles if we have packages
      if (matchedData && matchedData.length > 0) {
        const userIds = [...new Set(matchedData.map(pkg => pkg.user_id))];
        console.log('🔄 Admin: Fetching profiles for matched packages...', { userIds: userIds.length });
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email, phone_number, country_code, trust_level, prime_expires_at')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ Admin: Error fetching profiles for matched packages:', profilesError);
        } else {
          const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
          
          const enrichedPackages = matchedData.map(pkg => ({
            ...pkg,
            profiles: profilesMap.get(pkg.user_id) || null
          })) as LightweightPackage[];
          
          console.log('✅ Admin: Enriched matched packages with profiles');
          return enrichedPackages;
        }
      }

      return (matchedData || []) as LightweightPackage[];
    } catch (error: any) {
      console.error('❌ Admin: Matched packages fetch failed:', error);
      return [];
    }
  }, []);

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
    console.log('📍 refreshData called with:', { 
      forceRefresh, 
      user: !!user, 
      authLoading, 
      isAdmin, 
      wasAdmin,
      userRole: userRole?.role 
    });
    
    const shouldSkip = !user || (authLoading && !wasAdmin);
    
    if (shouldSkip && !forceRefresh) {
      console.log('⏭️ Admin: Skipping refresh', { 
        authLoading, 
        isAdmin, 
        wasAdmin, 
        hasUser: !!user,
        userRole: userRole?.role,
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
      const [paginatedPackages, matchedPkgs, tripsData] = await Promise.all([
        fetchAdminPackages(0, false),
        fetchMatchedPackages(),
        fetchAdminTrips()
      ]);

      // Merge packages: use Map to avoid duplicates (matched packages might be in first 50)
      const allPackagesMap = new Map<string, any>();
      [...paginatedPackages, ...matchedPkgs].forEach(pkg => {
        allPackagesMap.set(pkg.id, pkg);
      });
      
      const mergedPackages = Array.from(allPackagesMap.values());

      setPackages(mergedPackages);
      setTrips(tripsData);
      
      console.log('✅ Admin: Data refresh complete', {
        paginated: paginatedPackages.length,
        matched: matchedPkgs.length,
        merged: mergedPackages.length,
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
  }, [isAdmin, wasAdmin, authLoading, user, fetchAdminPackages, fetchMatchedPackages, fetchAdminTrips, totalPackages]);

  useEffect(() => {
    console.log('🔍 Admin: Effect triggered', {
      isAdmin,
      wasAdmin,
      authLoading,
      user: !!user,
      userId: user?.id,
      userRole: userRole?.role,
      shouldLoad: (isAdmin || wasAdmin) && user
    });

    // FORCE LOAD si el user existe y alguna vez fue admin o es admin actual
    if ((isAdmin || wasAdmin) && user) {
      console.log('🚀 Admin: Starting initial data load...');
      refreshData();
    } else if (!authLoading && !isAdmin && !wasAdmin && userRole) {
      console.log('⚠️ Admin: User is definitively not admin, clearing data');
      setPackages([]);
      setTrips([]);
      setLoading(false);
    } else if (!authLoading && user && !userRole) {
      console.log('⚠️ Admin: User has no role assigned yet');
    }
  }, [isAdmin, wasAdmin, authLoading, user, userRole, refreshData]);

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
