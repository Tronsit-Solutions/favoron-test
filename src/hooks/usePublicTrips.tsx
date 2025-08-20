
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
      
      // Fetch solo campos públicos via función segura que evita exponer datos sensibles
      const { data, error } = await supabase.rpc('get_public_trips');

      if (error) {
        console.error('Error fetching public trips (RPC):', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los viajes disponibles",
          variant: "destructive",
        });
        return;
      }

      console.log('📈 Public trips fetched (RPC):', {
        total: data?.length || 0,
        trips: (data as PublicTrip[] | null)?.map(t => ({ 
          id: t.id.slice(0, 8), 
          from: t.from_city, 
          to: t.to_city, 
          arrival: t.arrival_date,
          status: t.status 
        }))
      });

      setTrips((data as PublicTrip[]) || []);
    } catch (error) {
      console.error('Error fetching public trips (RPC):', error);
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

    // Para landing público: evitamos realtime sobre la tabla (respeta RLS y podría incluir campos sensibles).
    // Usamos un refresco periódico ligero cada 30s.
    const interval = setInterval(fetchPublicTrips, 30 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    trips,
    loading,
    refreshTrips: fetchPublicTrips
  };
};
