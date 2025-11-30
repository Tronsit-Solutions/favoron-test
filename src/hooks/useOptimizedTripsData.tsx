import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useCachedData } from './useCachedData';

export type Trip = Tables<'trips'>;
export type TripInsert = TablesInsert<'trips'>;
export type TripUpdate = TablesUpdate<'trips'>;

export const useOptimizedTripsData = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUserId();
  }, []);

  // Cached fetch function for trips
  const fetchTripsOptimized = useCallback(async () => {
    // Get current user directly from supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('✈️ No user available, returning empty');
      return [];
    }

    console.log('✈️ Fetching trips for user:', user.id);

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
        .eq('user_id', user.id)
        .order('arrival_date', { ascending: true });

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
  }, []);

  // Use cached data with 30-second TTL
  const {
    data: cachedTrips,
    loading: cacheLoading,
    refresh: refreshCache
  } = useCachedData(fetchTripsOptimized, {
    key: `trips-optimized-${userId || 'anonymous'}`,
    ttl: 30000, // 30 seconds
    enabled: !!userId // Only enable when we have a user ID
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

      const payload = {
        ...tripData,
        user_id: user.id,
        client_request_id: (tripData as any).client_request_id || null
      };

      const { data, error } = await supabase
        .from('trips')
        .insert(payload)
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
      
      // Check if it's a phone number requirement error
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Phone number is required')) {
        toast({
          title: "WhatsApp requerido",
          description: "Necesitas un número de WhatsApp válido para registrar viajes. Ve a tu perfil para agregarlo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error?.message || "No se pudo crear el viaje",
          variant: "destructive",
        });
      }
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