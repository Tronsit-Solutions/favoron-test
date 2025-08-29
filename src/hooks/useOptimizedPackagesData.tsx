import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCachedData } from '@/hooks/useCachedData';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Package = Tables<'packages'>;
export type PackageInsert = TablesInsert<'packages'>;
export type PackageUpdate = TablesUpdate<'packages'>;

export const useOptimizedPackagesData = () => {
  const { toast } = useToast();
  const { user, userRole, loading: authLoading } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = userRole?.role === 'admin';

  // Memoized query for basic package data
  const fetchBasicPackages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Separate query for profile data (only when needed)
  const fetchProfileData = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return {};
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, username, email, phone_number, bank_name, bank_account_number, bank_account_holder, bank_account_type')
      .in('id', userIds);

    if (error) return {};
    
    return data.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>);
  }, []);

  // Separate query for trip data (only when needed)
  const fetchTripData = useCallback(async (tripIds: string[]) => {
    if (tripIds.length === 0) return {};
    
    const { data, error } = await supabase
      .from('trips')
      .select(`
        id,
        package_receiving_address,
        departure_date,
        arrival_date,
        first_day_packages,
        last_day_packages,
        delivery_date,
        from_city,
        to_city,
        user_id,
        profiles:user_id (
          id,
          first_name,
          last_name,
          username,
          email,
          phone_number
        )
      `)
      .in('id', tripIds);

    if (error) return {};
    
    return data.reduce((acc, trip) => {
      acc[trip.id] = trip;
      return acc;
    }, {} as Record<string, any>);
  }, []);

  // Optimized fetch function using cached data
  const fetchPackagesOptimized = useCallback(async (): Promise<Package[]> => {
    // Don't fetch if auth is still loading
    if (authLoading) {
      console.log('📦 Auth still loading, skipping fetch');
      return [];
    }

    // For non-admin users, require user to be available
    if (!isAdmin && !user) {
      console.log('📦 No user available for non-admin, returning empty');
      return [];
    }

    console.log('📦 Fetching packages', { isAdmin, user: !!user });
    
    try {
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
        console.error('Error fetching packages:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los paquetes",
          variant: "destructive",
        });
        throw error;
      }

      console.log('📦 Fetched packages successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('📦 Package fetch failed:', error);
      return [];
    }
  }, [user, isAdmin, authLoading, toast]);

  // Use cached data with 30-second TTL
  const { 
    data: cachedPackages, 
    loading: cacheLoading, 
    error, 
    refresh: refreshCache,
    invalidate: invalidateCache 
  } = useCachedData(fetchPackagesOptimized, {
    key: isAdmin ? 'packages-admin' : `packages-${user?.id}`,
    ttl: 30000, // 30 seconds
    enabled: !authLoading // Only enable when auth is ready
  });

  // Sync local state with cached data
  useEffect(() => {
    if (cachedPackages) {
      setPackages(cachedPackages);
    }
    setLoading(cacheLoading);
  }, [cachedPackages, cacheLoading]);

  const createPackage = useCallback(async (packageData: PackageInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const insertData = {
        ...packageData,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('packages')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "¡Éxito!",
        description: "Paquete creado correctamente",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo crear el paquete: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const updatePackage = useCallback(async (id: string, updates: PackageUpdate) => {
    try {
      // Si el shopper ya no quiere el paquete, cancelarlo y desactivar re-cotización
      if (updates.rejection_reason === 'no_longer_want') {
        updates = {
          ...updates,
          status: 'cancelled',
          wants_requote: false,
        };
      }

      const { data, error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Actualización optimista
      setPackages(prev => prev.map(pkg => (pkg.id === id ? { ...pkg, ...data } : pkg)));

      // Mensaje apropiado
      if (updates.status === 'cancelled') {
        toast({
          title: 'Paquete cancelado',
          description: 'El paquete se ha movido a tu historial de cancelados.',
        });
      }

      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `No se pudo actualizar el paquete: ${error.message}`,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deletePackage = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setPackages(prev => prev.filter(pkg => pkg.id !== id));
      
      toast({
        title: "Éxito",
        description: "Paquete eliminado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el paquete",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Memoized packages for performance
  const memoizedPackages = useMemo(() => packages, [packages]);

  // No useEffect for auto-fetching - we use cached data instead

  return {
    packages: memoizedPackages,
    loading,
    createPackage,
    updatePackage,
    deletePackage,
    refreshPackages: refreshCache,
    setPackages,
    invalidateCache
  };
};
