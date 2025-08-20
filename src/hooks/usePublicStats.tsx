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
  const [stats, setStats] = useState<PublicStats>({
    total_users: 0,
    total_trips: 0,
    total_packages_completed: 0,
    total_tips_distributed: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPublicStats = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_public_stats');

      if (error) {
        console.error('Error fetching public stats:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las estadísticas",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching public stats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    refreshStats: fetchPublicStats
  };
};