import { useState, useEffect, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface UseCachedDataOptions {
  ttl?: number; // Time to live in milliseconds (default: 30 seconds)
  key: string;
  enabled?: boolean; // Whether the hook should be active
  minRefetchInterval?: number; // Minimum time between refetches (prevents tab-switch spam)
}

export const useCachedData = <T,>(
  fetchFn: () => Promise<T>,
  options: UseCachedDataOptions
) => {
  const { ttl = 30000, key, enabled = true, minRefetchInterval = 60000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const lastFetchRef = useRef<number>(0);

  const fetchData = async (forceRefresh = false) => {
    if (!enabled && !forceRefresh) {
      console.log(`⏭️ Cache disabled for key: ${key}`);
      setLoading(false);
      return null;
    }

    const cache = cacheRef.current;
    const cachedEntry = cache.get(key);
    const now = Date.now();

    // Prevent refetch if too recent (protects against tab-switch spam)
    if (!forceRefresh && data && (now - lastFetchRef.current) < minRefetchInterval) {
      setLoading(false);
      return data;
    }

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && cachedEntry && (now - cachedEntry.timestamp) < cachedEntry.ttl) {
      setData(cachedEntry.data);
      setLoading(false);
      return cachedEntry.data;
    }

    try {
      // Don't reset data to null - keep previous data visible during refresh
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      
      // Cache the result and update last fetch time
      cache.set(key, {
        data: result,
        timestamp: now,
        ttl
      });
      lastFetchRef.current = now;
      
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = () => {
    cacheRef.current.delete(key);
  };

  const refreshData = () => fetchData(true);

  useEffect(() => {
    if (enabled) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [key, enabled]);

  return {
    data,
    loading,
    error,
    refresh: refreshData,
    invalidate: invalidateCache
  };
};