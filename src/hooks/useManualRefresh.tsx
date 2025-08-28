import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseManualRefreshOptions {
  onRefresh?: () => Promise<void> | void;
  refreshThreshold?: number; // milliseconds
  showSuccessToast?: boolean;
}

export const useManualRefresh = ({
  onRefresh,
  refreshThreshold = 5000, // 5 seconds between manual refreshes
  showSuccessToast = true
}: UseManualRefreshOptions = {}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { toast } = useToast();

  const canRefresh = useCallback(() => {
    if (!lastRefresh) return true;
    return Date.now() - lastRefresh.getTime() > refreshThreshold;
  }, [lastRefresh, refreshThreshold]);

  const refresh = useCallback(async () => {
    if (isRefreshing || !canRefresh()) {
      return;
    }

    try {
      setIsRefreshing(true);
      await onRefresh?.();
      setLastRefresh(new Date());
      
      if (showSuccessToast) {
        toast({
          title: "Datos actualizados",
          description: "La información se ha actualizado correctamente.",
        });
      }
    } catch (error) {
      console.error('Manual refresh error:', error);
      toast({
        title: "Error al actualizar",
        description: "No se pudieron actualizar los datos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, canRefresh, onRefresh, showSuccessToast, toast]);

  const getTimeSinceLastRefresh = useCallback(() => {
    if (!lastRefresh) return null;
    return Date.now() - lastRefresh.getTime();
  }, [lastRefresh]);

  return {
    refresh,
    isRefreshing,
    canRefresh: canRefresh(),
    lastRefresh,
    getTimeSinceLastRefresh
  };
};