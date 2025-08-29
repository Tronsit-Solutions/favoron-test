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

  const isAdmin = useMemo(() => {
    return userRole?.role === 'admin';
  }, [userRole]);

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
            email,
            phone_number,
            avatar_url
          ),
          trips:matched_trip_id(
            id,
            from_city,
            to_city,
            departure_date,
            arrival_date,
            profiles:user_id(
              id,
              first_name,
              last_name,
              username,
              email,
              phone_number,
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
            email,
            phone_number,
            avatar_url
          )
        `)
        .order('departure_date', { ascending: true });

      if (error) {
        console.error('❌ Admin: Error fetching trips:', error);
        throw error;
      }

      console.log('✅ Admin: Fetched trips:', data?.length || 0);
      return data || [];
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
    if (!isAdmin || authLoading) {
      console.log('⏭️ Admin: Skipping refresh - not admin or auth loading');
      return;
    }

    console.log('🔄 Admin: Starting data refresh...');
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
    } finally {
      setLoading(false);
    }
  }, [isAdmin, authLoading, fetchAdminPackages, fetchAdminTrips]);

  // Initial data load when admin is authenticated
  useEffect(() => {
    console.log('🔍 Admin: Effect triggered', {
      isAdmin,
      authLoading,
      user: !!user,
      userRole: userRole?.role
    });

    if (!authLoading && isAdmin && user) {
      console.log('🚀 Admin: Starting initial data load...');
      refreshData();
    } else if (!authLoading && !isAdmin) {
      console.log('⚠️ Admin: User is not admin, clearing data');
      setPackages([]);
      setTrips([]);
      setLoading(false);
    }
  }, [isAdmin, authLoading, user, refreshData]);

  // Additional safety net - retry if data is empty but should have data
  useEffect(() => {
    if (!loading && isAdmin && packages.length === 0 && trips.length === 0 && !error) {
      console.log('🔄 Admin: Data appears empty, retrying in 1 second...');
      const retryTimer = setTimeout(() => {
        refreshData();
      }, 1000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [loading, isAdmin, packages.length, trips.length, error, refreshData]);

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