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

      console.log('📈 Public trips fetched:', {
        total: data?.length || 0,
        trips: data?.map(t => ({ 
          id: t.id.slice(0, 8), 
          from: t.from_city, 
          to: t.to_city, 
          arrival: t.arrival_date,
          status: t.status 
        }))
      });

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

    // Set up real-time subscription for trips
    const channel = supabase
      .channel('public-trips-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: 'status=in.(approved,active)'
        },
        (payload) => {
          console.log('🔄 Real-time trip update:', payload);
          // Refresh data when trips change
          fetchPublicTrips();
        }
      )
      .subscribe();

    // Reduced interval fallback: refresh every 30 seconds  
    const interval = setInterval(fetchPublicTrips, 30 * 1000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return {
    trips,
    loading,
    refreshTrips: fetchPublicTrips
  };
};