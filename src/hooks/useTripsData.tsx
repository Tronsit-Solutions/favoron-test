import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Trip = Tables<'trips'>;
export type TripInsert = TablesInsert<'trips'>;
export type TripUpdate = TablesUpdate<'trips'>;

export const useTripsData = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          profiles!trips_user_id_fkey (
            id,
            first_name,
            last_name,
            username,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error: any) {
      console.error('Error fetching trips:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los viajes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTrip = async (tripData: TripInsert) => {
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
      
      setTrips(prev => [data, ...prev]);
      toast({
        title: "¡Éxito!",
        description: "Viaje creado correctamente",
      });
      
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
  };

  const updateTrip = async (id: string, updates: TripUpdate) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTrips(prev => prev.map(trip => 
        trip.id === id ? { ...trip, ...data } : trip
      ));
      
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
  };

  const deleteTrip = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTrips(prev => prev.filter(trip => trip.id !== id));
      toast({
        title: "Éxito",
        description: "Viaje eliminado correctamente",
      });
    } catch (error: any) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el viaje",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return {
    trips,
    loading,
    createTrip,
    updateTrip,
    deleteTrip,
    refreshTrips: fetchTrips
  };
};