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
  const { toast } = useToast();

  const fetchPublicTrips = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('trips')
        .select('id, from_city, to_city, arrival_date, departure_date, status')
        .in('status', ['approved', 'active'])
        .order('departure_date', { ascending: true });

      if (error) {
        console.error('Error fetching public trips:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los viajes disponibles",
          variant: "destructive",
        });
        return;
      }

      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching public trips:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los viajes disponibles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicTrips();

    // Refresh every 5 minutes
    const interval = setInterval(fetchPublicTrips, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    trips,
    loading,
    refreshTrips: fetchPublicTrips
  };
};