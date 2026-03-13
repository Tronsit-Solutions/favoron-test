import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicStats {
  total_users: number;
  total_trips: number;
  total_packages_completed: number;
  total_tips_distributed: number;
}

export const usePublicStats = () => {
  // Fallback values in case the cached stats can't be loaded
  const FALLBACK_STATS: PublicStats = {
    total_users: 1876,
    total_trips: 351,
    total_packages_completed: 412,
    total_tips_distributed: 40539
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
      console.log('📊 Fetching cached public stats from database');
      
      // Use the fast cached function instead of counting records
      const { data, error } = await supabase.rpc('get_cached_public_stats');

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // Values from the snapshot already include historical data
        const finalStats: PublicStats = {
          total_users: Number(data[0].total_users) || FALLBACK_STATS.total_users,
          total_trips: Number(data[0].total_trips) || FALLBACK_STATS.total_trips,
          total_packages_completed: Number(data[0].total_packages_completed) || FALLBACK_STATS.total_packages_completed,
          total_tips_distributed: Number(data[0].total_tips_distributed) || FALLBACK_STATS.total_tips_distributed
        };
        
        console.log('✅ Cached public stats loaded successfully');
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