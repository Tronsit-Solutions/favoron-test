
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

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchPublicTrips = async (retryCount = 0): Promise<void> => {
    const maxRetries = 3;
    const baseDelay = 1000;

    try {
      console.log(`✈️ Fetching public trips (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      const { data, error } = await supabase.rpc('get_public_trips');

      if (error) {
        throw new Error(`RPC Error: ${error.message}`);
      }

      console.log('✅ Public trips fetched successfully:', {
        total: data?.length || 0,
        trips: (data as PublicTrip[] | null)?.slice(0, 3).map(t => ({ 
          id: t.id.slice(0, 8), 
          from: t.from_city, 
          to: t.to_city, 
          status: t.status 
        }))
      });

      setTrips((data as PublicTrip[]) || []);
    } catch (fetchError) {
      console.error(`❌ Error fetching public trips (attempt ${retryCount + 1}):`, fetchError);
      
      if (retryCount < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`🔄 Retrying in ${delayMs}ms...`);
        await delay(delayMs);
        return fetchPublicTrips(retryCount + 1);
      } else {
        // Only show toast for final failure
        toast({
          title: "Conectando...",
          description: "Los viajes se actualizarán automáticamente cuando se restablezca la conexión.",
          variant: "default",
        });
      }
    } finally {
      if (retryCount === 0) { // Only set loading false on initial call
        setLoading(false);
      }
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
    refreshTrips: () => fetchPublicTrips(0)
  };
};
