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
}

export const useCachedData = <T,>(
  fetchFn: () => Promise<T>,
  options: UseCachedDataOptions
) => {
  const { ttl = 30000, key, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  const fetchData = async (forceRefresh = false) => {
    if (!enabled && !forceRefresh) {
      console.log(`⏭️ Cache disabled for key: ${key}`);
      setLoading(false);
      return null;
    }

    const cache = cacheRef.current;
    const cachedEntry = cache.get(key);
    const now = Date.now();

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
      
      // Cache the result
      cache.set(key, {
        data: result,
        timestamp: now,
        ttl
      });
      
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