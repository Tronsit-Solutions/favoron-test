import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OptimisticUpdatesOptions {
  onPackageUpdate?: (packages: any[]) => void;
  onTripUpdate?: (trips: any[]) => void;
  onRefreshData?: () => void;
}

export const useOptimisticUpdates = ({
  onPackageUpdate,
  onTripUpdate,
  onRefreshData
}: OptimisticUpdatesOptions = {}) => {
  const { toast } = useToast();

  const updatePackageLocally = useCallback((packageId: string, updates: any, packages: any[]) => {
    console.log('🔄 Optimistic package update:', packageId, updates);
    
    const updatedPackages = packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, ...updates } : pkg
    );
    
    onPackageUpdate?.(updatedPackages);
    return updatedPackages;
  }, [onPackageUpdate]);

  const updateTripLocally = useCallback((tripId: string, updates: any, trips: any[]) => {
    console.log('🔄 Optimistic trip update:', tripId, updates);
    
    const updatedTrips = trips.map(trip => 
      trip.id === tripId ? { ...trip, ...updates } : trip
    );
    
    onTripUpdate?.(updatedTrips);
    return updatedTrips;
  }, [onTripUpdate]);

  const applyOptimisticMatch = useCallback((
    packageId: string, 
    tripId: string, 
    adminTip: number,
    packages: any[],
    trips: any[]
  ) => {
    console.log('🚀 Applying optimistic match update:', { packageId, tripId, adminTip });
    
    // Update package with match info
    const updatedPackages = packages.map(pkg => 
      pkg.id === packageId ? { 
        ...pkg, 
        status: 'matched',
        matched_trip_id: tripId,
        admin_assigned_tip: adminTip,
        matched_assignment_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      } : pkg
    );
    
    onPackageUpdate?.(updatedPackages);
    return { updatedPackages, updatedTrips: trips };
  }, [onPackageUpdate]);

  const handleDataRefresh = useCallback(() => {
    console.log('🔄 Triggering data refresh after optimistic update');
    
    if (onRefreshData) {
      onRefreshData();
    } else {
      toast({
        title: "Datos actualizados",
        description: "Los cambios se han aplicado correctamente.",
      });
    }
  }, [onRefreshData, toast]);

  return {
    updatePackageLocally,
    updateTripLocally,
    applyOptimisticMatch,
    handleDataRefresh
  };
};