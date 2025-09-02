import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';

export type Package = Tables<'packages'>;
export type Trip = Tables<'trips'>;

interface AdminData {
  packages: Package[];
  trips: Trip[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useAdminData = (): AdminData => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, userRole, loading: authLoading } = useAuth();

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

  const fetchAdminPackages = useCallback(async () => {
    try {
      console.log('🔄 Admin: Fetching all packages...');
      
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          profiles:user_id(
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            email,
            phone_number
          ),
          trips:matched_trip_id(
            id,
            from_city,
            to_city,
            departure_date,
            arrival_date,
            delivery_date,
            profiles:user_id(
              id,
              first_name,
              last_name,
              username,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Admin: Error fetching packages:', error);
        throw error;
      }

      console.log('✅ Admin: Fetched packages:', data?.length || 0);
      return data || [];
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
  }, [toast]);

  const fetchAdminTrips = useCallback(async () => {
    try {
      console.log('🔄 Admin: Fetching all trips using trips_with_user...');
      
      const { data, error } = await supabase
        .from('trips_with_user')
        .select(`
          id,
          user_id,
          from_city,
          to_city,
          departure_date,
          arrival_date,
          delivery_date,
          first_day_packages,
          last_day_packages,
          available_space,
          package_receiving_address,
          messenger_pickup_info,
          created_at,
          updated_at,
          status,
          delivery_method,
          from_country,
          user_display_name,
          first_name,
          last_name,
          username,
          email,
          phone_number
        `)
        .order('departure_date', { ascending: true });

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

  const refreshData = useCallback(async () => {
    const shouldSkip = !user || (authLoading && !wasAdmin);
    
    if (shouldSkip) {
      console.log('⏭️ Admin: Skipping refresh', { 
        authLoading, 
        isAdmin, 
        wasAdmin, 
        hasUser: !!user,
        reason: !user ? 'no_user' : 'loading_and_not_was_admin'
      });
      return;
    }

    console.log('🔄 Admin: Starting data refresh...', { isAdmin, wasAdmin, authLoading });
    setLoading(true);
    setError(null);

    try {
      const [packagesData, tripsData] = await Promise.all([
        fetchAdminPackages(),
        fetchAdminTrips()
      ]);

      setPackages(packagesData);
      setTrips(tripsData);
      
      console.log('✅ Admin: Data refresh complete', {
        packages: packagesData.length,
        trips: tripsData.length
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
  }, [isAdmin, wasAdmin, authLoading, user, fetchAdminPackages, fetchAdminTrips]);

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

  const memoizedResult = useMemo(() => ({
    packages,
    trips,
    loading,
    error,
    refreshData
  }), [packages, trips, loading, error, refreshData]);

  console.log('📊 Admin: Returning data', {
    packagesCount: packages.length,
    tripsCount: trips.length,
    loading,
    error: !!error,
    isAdmin
  });

  return memoizedResult;
};
