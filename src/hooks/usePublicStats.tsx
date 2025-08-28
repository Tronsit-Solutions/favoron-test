import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PublicStats {
  total_users: number;
  total_trips: number;
  total_packages_completed: number;
  total_tips_distributed: number;
}

export const usePublicStats = () => {
  // Historical values as fallbacks
  const FALLBACK_STATS = {
    total_users: 188,
    total_trips: 110,
    total_packages_completed: 202,
    total_tips_distributed: 30000
  };

  const [stats, setStats] = useState<PublicStats>(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchPublicStats = async (retryCount = 0): Promise<void> => {
    const maxRetries = 3;
    const baseDelay = 1000;

    try {
      console.log(`📊 Fetching public stats (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      const { data, error } = await supabase.rpc('get_public_stats');

      if (error) {
        throw new Error(`RPC Error: ${error.message}`);
      }

      if (data && data.length > 0) {
        const newStats = data[0];
        console.log('✅ Public stats fetched successfully:', newStats);
        setStats({
          total_users: FALLBACK_STATS.total_users + (Number(newStats.total_users) || 0),
          total_trips: FALLBACK_STATS.total_trips + (Number(newStats.total_trips) || 0),
          total_packages_completed: FALLBACK_STATS.total_packages_completed + (Number(newStats.total_packages_completed) || 0),
          total_tips_distributed: FALLBACK_STATS.total_tips_distributed + (Number(newStats.total_tips_distributed) || 0)
        });
        setError(null);
      } else {
        console.log('📊 No stats data returned, using fallbacks');
        setStats(FALLBACK_STATS);
      }
    } catch (fetchError) {
      console.error(`❌ Error fetching public stats (attempt ${retryCount + 1}):`, fetchError);
      
      if (retryCount < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`🔄 Retrying in ${delayMs}ms...`);
        await delay(delayMs);
        return fetchPublicStats(retryCount + 1);
      } else {
        setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido');
        setStats(FALLBACK_STATS);
        
        // Only show toast for final failure, not intermediate retries
        toast({
          title: "Conectando...",
          description: "Usando datos locales. Las estadísticas se actualizarán automáticamente.",
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
    fetchPublicStats();

    // Refresh every 5 minutes
    const interval = setInterval(fetchPublicStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    loading,
    error,
    refreshStats: () => fetchPublicStats(0)
  };
};