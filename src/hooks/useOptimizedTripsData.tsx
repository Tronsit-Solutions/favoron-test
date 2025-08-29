import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useCachedData } from './useCachedData';

export type Trip = Tables<'trips'>;
export type TripInsert = TablesInsert<'trips'>;
export type TripUpdate = TablesUpdate<'trips'>;

export const useOptimizedTripsData = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, userRole, loading: authLoading } = useAuth();

  const isAdmin = userRole?.role === 'admin';

  // Cached fetch function for trips
  const fetchTripsOptimized = useCallback(async () => {
    // Don't fetch if auth is still loading
    if (authLoading) {
      console.log('✈️ Auth still loading, skipping fetch');
      return [];
    }

    // For non-admin users, require user to be available
    if (!isAdmin && !user) {
      console.log('✈️ No user available for non-admin, returning empty');
      return [];
    }

    console.log('✈️ Fetching trips', { isAdmin, user: !!user });

    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          profiles (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('departure_date', { ascending: true });

      if (error) {
        console.error('✈️ Error fetching trips:', error);
        throw error;
      }

      console.log('✈️ Fetched trips successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('✈️ Trip fetch failed:', error);
      return [];
    }
  }, [user, isAdmin, authLoading]);

  // Use cached data with 30-second TTL
  const {
    data: cachedTrips,
    loading: cacheLoading,
    refresh: refreshCache
  } = useCachedData(fetchTripsOptimized, {
    key: isAdmin ? 'trips-admin' : `trips-${user?.id}`,
    ttl: 30000, // 30 seconds
    enabled: !authLoading // Only enable when auth is ready
  });

  // Update local state when cache changes
  useEffect(() => {
    if (cachedTrips) {
      setTrips(cachedTrips);
    }
    setLoading(cacheLoading);
  }, [cachedTrips, cacheLoading]);

  const createTrip = useCallback(async (tripData: TripInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('trips')
        .insert({
          ...tripData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Optimistic update
      setTrips(prev => [data, ...prev]);
      
      toast({
        title: "¡Éxito!",
        description: "Viaje creado correctamente",
      });
      
      // Refresh cache
      refreshCache();
      
      return data;
    } catch (error: any) {
      console.error('Error creating trip:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el viaje",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, refreshCache]);

  const updateTrip = useCallback(async (id: string, updates: TripUpdate) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Optimistic update
      setTrips(prev => prev.map(trip => 
        trip.id === id ? { ...trip, ...data } : trip
      ));
      
      // Refresh cache
      refreshCache();
      
      return data;
    } catch (error: any) {
      console.error('Error updating trip:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el viaje",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, refreshCache]);

  const deleteTrip = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setTrips(prev => prev.filter(trip => trip.id !== id));
      
      toast({
        title: "Éxito",
        description: "Viaje eliminado correctamente",
      });
      
      // Refresh cache
      refreshCache();
    } catch (error: any) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el viaje",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, refreshCache]);

  // Memoized return value
  const returnValue = useMemo(() => ({
    trips,
    loading,
    createTrip,
    updateTrip,
    deleteTrip,
    refreshTrips: refreshCache
  }), [trips, loading, createTrip, updateTrip, deleteTrip, refreshCache]);

  return returnValue;
};