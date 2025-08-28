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

  const CACHE_KEY = 'public_stats_cache';
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  const [stats, setStats] = useState<PublicStats>(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const getCachedStats = (): { data: PublicStats; timestamp: number } | null => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        if (now - parsed.timestamp < CACHE_DURATION) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Error reading cached stats:', error);
    }
    return null;
  };

  const setCachedStats = (data: PublicStats) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error caching stats:', error);
    }
  };

  const fetchPublicStats = async (force = false): Promise<void> => {
    // Check cache first unless force refresh
    if (!force) {
      const cached = getCachedStats();
      if (cached) {
        console.log('📊 Using cached public stats');
        setStats(cached.data);
        setLoading(false);
        return;
      }
    }

    // Prevent duplicate calls
    if (fetching) {
      console.log('🚫 fetchPublicStats already in progress, skipping');
      return;
    }

    try {
      setFetching(true);
      console.log('📊 Fetching public stats from database');
      
      const { data, error } = await supabase.rpc('get_public_stats');

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newStats = data[0];
        const finalStats = {
          total_users: FALLBACK_STATS.total_users + (Number(newStats.total_users) || 0),
          total_trips: FALLBACK_STATS.total_trips + (Number(newStats.total_trips) || 0),
          total_packages_completed: FALLBACK_STATS.total_packages_completed + (Number(newStats.total_packages_completed) || 0),
          total_tips_distributed: FALLBACK_STATS.total_tips_distributed + (Number(newStats.total_tips_distributed) || 0)
        };
        
        console.log('✅ Public stats fetched successfully');
        setStats(finalStats);
        setCachedStats(finalStats);
        setError(null);
      } else {
        console.log('📊 No stats data returned, using fallbacks');
        setStats(FALLBACK_STATS);
        setCachedStats(FALLBACK_STATS);
      }
      setLoading(false);
    } catch (fetchError) {
      console.error('❌ Error fetching public stats:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido');
      setStats(FALLBACK_STATS);
      setLoading(false);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    // Only fetch once on mount, use cache after that
    fetchPublicStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refreshStats: (force = false) => fetchPublicStats(force)
  };
};