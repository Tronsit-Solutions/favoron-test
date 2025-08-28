
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
  const { toast } = useToast();

  const fetchPublicTrips = async (): Promise<void> => {
    // Prevent duplicate calls
    if (fetching) {
      console.log('🚫 fetchPublicTrips already in progress, skipping');
      return;
    }

    try {
      setFetching(true);
      console.log('✈️ Fetching public trips');
      
      const { data, error } = await supabase.rpc('get_public_trips');

      if (error) {
        throw error;
      }

      console.log('✅ Public trips fetched successfully:', {
        total: data?.length || 0
      });

      setTrips((data as PublicTrip[]) || []);
      setLoading(false);
    } catch (fetchError) {
      console.error('❌ Error fetching public trips:', fetchError);
      
      // Use fallback data on error
      setTrips([]);
      setLoading(false);
      
      // Only show toast once
      if (!toast) return;
      toast({
        title: "Conectando...",
        description: "Reintentando conexión automáticamente.",
        variant: "default",
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPublicTrips();

    // Reduce frequency to prevent overload
    const interval = setInterval(fetchPublicTrips, 60 * 1000); // Every 60 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []); // Remove toast dependency to prevent multiple executions

  return {
    trips,
    loading,
    refreshTrips: fetchPublicTrips
  };
};
