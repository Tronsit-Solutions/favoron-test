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
    
    // Persistir estado admin
    if (currentlyAdmin) {
      setWasAdmin(true);
      try {
        localStorage.setItem('temp_admin_state', 'true');
      } catch {}
    } else if (!authLoading && userRole) {
      // Solo limpiar si auth terminó de cargar y tenemos un rol definitivo
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
      console.log('🔄 Admin: Fetching all trips...');
      
      const { data, error } = await supabase
        .from('trips')
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
          )
        `)
        .order('departure_date', { ascending: true });

      if (error) {
        console.error('❌ Admin: Error fetching trips:', error);
        throw error;
      }

      let tripsResult: any[] = data || [];
      console.log('✅ Admin: Fetched trips:', tripsResult.length);

      // If embedded profiles are missing (likely no FK), fetch profiles in bulk and merge
      const missingProfileUserIds = Array.from(
        new Set(
          tripsResult
            .filter((t) => !t?.profiles)
            .map((t) => t.user_id)
            .filter(Boolean)
        )
      );

      if (missingProfileUserIds.length > 0) {
        console.log('ℹ️ Admin: Fetching missing traveler profiles for trips:', missingProfileUserIds.length);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, avatar_url, email, phone_number')
          .in('id', missingProfileUserIds);
        
        if (profilesError) {
          console.warn('⚠️ Admin: Could not fetch traveler profiles:', profilesError);
        } else if (profilesData) {
          const profilesMap = new Map(profilesData.map((p: any) => [p.id, p]));
          tripsResult = tripsResult.map((t) => ({
            ...t,
            profiles: t.profiles ?? profilesMap.get(t.user_id) ?? null,
          }));
          console.log('✅ Admin: Merged traveler profiles into trips');
        }
      }

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
    // Condición menos restrictiva para permitir carga durante estados temporales
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
      // Fetch both packages and trips in parallel
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
      
      // Retry en caso de error temporal
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

  // Initial data load when admin is authenticated
  useEffect(() => {
    console.log('🔍 Admin: Effect triggered', {
      isAdmin,
      wasAdmin,
      authLoading,
      user: !!user,
      userRole: userRole?.role
    });

    // Cargar datos si es admin actual o era admin anteriormente (durante refresh)
    if ((isAdmin || wasAdmin) && user) {
      console.log('🚀 Admin: Starting initial data load...');
      refreshData();
    } else if (!authLoading && !isAdmin && !wasAdmin && userRole) {
      // Solo limpiar datos cuando estemos seguros de que no es admin
      console.log('⚠️ Admin: User is definitively not admin, clearing data');
      setPackages([]);
      setTrips([]);
      setLoading(false);
    }
  }, [isAdmin, wasAdmin, authLoading, user, refreshData]);

  // Enhanced safety net - retry with better conditions
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
      }, 1500); // Slightly longer delay
      
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