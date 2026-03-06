import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useCachedData } from './useCachedData';
import { normalizeToMiddayUTC } from '@/lib/formatters';
import { createHistoryEntry, appendTripHistoryEntry } from '@/utils/tripHistoryHelpers';

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
          id, from_city, to_city, from_country, to_country, arrival_date, delivery_date,
          first_day_packages, last_day_packages, delivery_method, messenger_pickup_info,
          package_receiving_address, status, created_at, updated_at, user_id,
          available_space, last_mile_delivered, rejection_reason, admin_rejection,
          client_request_id, delivery_point_id, trip_history_log, traveler_feedback_completed,
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

      // Normalize date fields to midday UTC
      const normalizedData = { ...tripData };
      if (normalizedData.arrival_date) {
        normalizedData.arrival_date = normalizeToMiddayUTC(new Date(normalizedData.arrival_date)).toISOString();
      }
      if (normalizedData.first_day_packages) {
        normalizedData.first_day_packages = normalizeToMiddayUTC(new Date(normalizedData.first_day_packages)).toISOString();
      }
      if (normalizedData.last_day_packages) {
        normalizedData.last_day_packages = normalizeToMiddayUTC(new Date(normalizedData.last_day_packages)).toISOString();
      }
      if (normalizedData.delivery_date) {
        normalizedData.delivery_date = normalizeToMiddayUTC(new Date(normalizedData.delivery_date)).toISOString();
      }

      const payload = {
        ...normalizedData,
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

      // Log trip creation to history
      const entry = createHistoryEntry(
        'trip_created',
        user.id,
        'Viajero',
        {
          from_city: data.from_city,
          to_city: data.to_city,
          arrival_date: data.arrival_date,
          delivery_date: data.delivery_date,
          available_space: data.available_space,
          delivery_method: data.delivery_method,
        }
      );
      appendTripHistoryEntry(data.id, entry);
      
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
      // Normalize date fields to midday UTC
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.arrival_date) {
        normalizedUpdates.arrival_date = normalizeToMiddayUTC(new Date(normalizedUpdates.arrival_date)).toISOString();
      }
      if (normalizedUpdates.first_day_packages) {
        normalizedUpdates.first_day_packages = normalizeToMiddayUTC(new Date(normalizedUpdates.first_day_packages)).toISOString();
      }
      if (normalizedUpdates.last_day_packages) {
        normalizedUpdates.last_day_packages = normalizeToMiddayUTC(new Date(normalizedUpdates.last_day_packages)).toISOString();
      }
      if (normalizedUpdates.delivery_date) {
        normalizedUpdates.delivery_date = normalizeToMiddayUTC(new Date(normalizedUpdates.delivery_date)).toISOString();
      }

      const { data, error } = await supabase
        .from('trips')
        .update(normalizedUpdates)
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