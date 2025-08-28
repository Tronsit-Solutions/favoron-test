
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PublicTrip {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
  departure_date: string;
  status: string;
}

export const usePublicTrips = () => {
  const [trips, setTrips] = useState<PublicTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchPublicTrips = async (forceRefresh = false): Promise<void> => {
    // Allow forced refresh even if fetching
    if (fetching && !forceRefresh) {
      console.log('🚫 fetchPublicTrips already in progress, skipping');
      return;
    }

    try {
      setFetching(true);
      console.log('✈️ Fetching public trips', forceRefresh ? '(forced)' : '');
      
      const { data, error } = await supabase.rpc('get_public_trips');

      if (error) {
        throw error;
      }

      console.log('✅ Public trips fetched successfully:', {
        total: data?.length || 0
      });

      setTrips((data as PublicTrip[]) || []);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (fetchError) {
      console.error('❌ Error fetching public trips:', fetchError);
      
      // Keep existing data on error, don't reset to empty
      setLoading(false);
      
      // Only show toast for forced refreshes or first load
      if (forceRefresh || trips.length === 0) {
        toast({
          title: "Error de conexión",
          description: "No se pudieron actualizar los viajes. Reintentando...",
          variant: "destructive",
        });
      }
    } finally {
      setFetching(false);
    }
  };

  // Manual refresh that ignores fetching state
  const refreshTrips = () => fetchPublicTrips(true);

  useEffect(() => {
    fetchPublicTrips();

    // More frequent updates for better real-time feel
    const interval = setInterval(() => fetchPublicTrips(), 20 * 1000); // Every 20 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    trips,
    loading,
    fetching,
    lastUpdate,
    refreshTrips
  };
};
