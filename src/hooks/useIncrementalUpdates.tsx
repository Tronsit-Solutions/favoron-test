import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface IncrementalUpdateOptions {
  onPackageUpdate?: (packages: any[]) => void;
  onTripUpdate?: (trips: any[]) => void;
  onRefreshData?: () => void;
}

export const useIncrementalUpdates = ({
  onPackageUpdate,
  onTripUpdate,
  onRefreshData
}: IncrementalUpdateOptions = {}) => {
  const { toast } = useToast();

  const updatePackageLocally = useCallback((packageId: string, updates: any, packages: any[]) => {
    console.log('🔄 Updating package locally:', packageId, updates);
    
    const updatedPackages = packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, ...updates } : pkg
    );
    
    onPackageUpdate?.(updatedPackages);
    return updatedPackages;
  }, [onPackageUpdate]);

  const updateTripLocally = useCallback((tripId: string, updates: any, trips: any[]) => {
    console.log('🔄 Updating trip locally:', tripId, updates);
    
    const updatedTrips = trips.map(trip => 
      trip.id === tripId ? { ...trip, ...updates } : trip
    );
    
    onTripUpdate?.(updatedTrips);
    return updatedTrips;
  }, [onTripUpdate]);

  const handleDataRefresh = useCallback(() => {
    console.log('🔄 Soft refresh - updating data incrementally');
    
    // Instead of window.location.reload(), trigger a soft refresh
    if (onRefreshData) {
      onRefreshData();
    } else {
      // Fallback: just show a success message
      toast({
        title: "Datos actualizados",
        description: "Los cambios se han aplicado correctamente.",
      });
    }
  }, [onRefreshData, toast]);

  const optimisticUpdate = useCallback((
    type: 'package' | 'trip',
    id: string,
    updates: any,
    currentData: any[],
    action: string
  ) => {
    console.log(`🚀 Optimistic update for ${type}:`, id, action);
    
    if (type === 'package') {
      return updatePackageLocally(id, updates, currentData);
    } else {
      return updateTripLocally(id, updates, currentData);
    }
  }, [updatePackageLocally, updateTripLocally]);

  return {
    updatePackageLocally,
    updateTripLocally,
    handleDataRefresh,
    optimisticUpdate
  };
};