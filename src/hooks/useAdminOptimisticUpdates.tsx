import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AdminOptimisticUpdatesOptions {
  onPackageUpdate?: (updater: (packages: any[]) => any[]) => void;
  onTripUpdate?: (updater: (trips: any[]) => any[]) => void;
  refreshData?: () => Promise<void>;
}

export const useAdminOptimisticUpdates = ({
  onPackageUpdate,
  onTripUpdate,
  refreshData
}: AdminOptimisticUpdatesOptions = {}) => {
  const { toast } = useToast();

  const optimisticMatchUpdate = useCallback((
    packageId: string, 
    tripId: string, 
    adminTip: number,
    productsWithTips?: any[]
  ) => {
    console.log('🚀 Admin: Applying optimistic match update');
    
    if (onPackageUpdate) {
      onPackageUpdate(prevPackages => 
        prevPackages.map(pkg => 
          pkg.id === packageId ? {
            ...pkg,
            status: 'matched',
            matched_trip_id: tripId,
            admin_assigned_tip: adminTip,
            products_data: productsWithTips?.length ? 
              productsWithTips.map(product => ({
                ...product,
                adminAssignedTip: product.adminAssignedTip || 0
              })) : pkg.products_data,
            matched_assignment_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          } : pkg
        )
      );
    }
  }, [onPackageUpdate]);

  const optimisticStatusUpdate = useCallback((
    type: 'package' | 'trip',
    id: string, 
    status: string
  ) => {
    console.log(`🚀 Admin: Applying optimistic ${type} status update:`, { id, status });
    
    if (type === 'package' && onPackageUpdate) {
      onPackageUpdate(prevPackages => 
        prevPackages.map(pkg => 
          pkg.id === id ? {
            ...pkg,
            status,
            updated_at: new Date().toISOString()
          } : pkg
        )
      );
    } else if (type === 'trip' && onTripUpdate) {
      onTripUpdate(prevTrips => 
        prevTrips.map(trip => 
          trip.id === id ? {
            ...trip,
            status,
            updated_at: new Date().toISOString()
          } : trip
        )
      );
    }
  }, [onPackageUpdate, onTripUpdate]);

  const optimisticDiscardUpdate = useCallback((packageId: string) => {
    console.log('🚀 Admin: Applying optimistic discard update');
    
    if (onPackageUpdate) {
      onPackageUpdate(prevPackages => 
        prevPackages.map(pkg => 
          pkg.id === packageId ? {
            ...pkg,
            status: 'cancelled',
            updated_at: new Date().toISOString()
          } : pkg
        )
      );
    }
  }, [onPackageUpdate]);

  const ensureDataConsistency = useCallback(async (delay = 1000) => {
    console.log('🔄 Admin: Ensuring data consistency...');
    
    if (refreshData) {
      setTimeout(async () => {
        try {
          await refreshData();
        } catch (error) {
          console.error('Failed to refresh admin data:', error);
        }
      }, delay);
    }
  }, [refreshData]);

  return {
    optimisticMatchUpdate,
    optimisticStatusUpdate,
    optimisticDiscardUpdate,
    ensureDataConsistency
  };
};