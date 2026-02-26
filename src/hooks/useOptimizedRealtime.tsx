import { useEffect, useCallback, useRef, MutableRefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useModalProtection } from '@/hooks/useModalProtection';
import type { Package } from '@/hooks/useOptimizedPackagesData';

interface UseOptimizedRealtimeProps {
  onPackageUpdate?: (packages: Package[]) => void;
  onTripUpdate?: () => void;
  userRole?: 'admin' | 'traveler' | 'shopper';
  packages?: Package[];
  recentMutationsRef?: MutableRefObject<Record<string, number>>;
}

// Safe merge: apply realtime payload but preserve joined relations
const mergePackagePayload = (existing: any, payloadNew: any): any => ({
  ...existing,
  ...payloadNew,
  // Realtime never includes joined data — preserve what we already have
  profiles: (existing as any).profiles,
  trips: (existing as any).trips,
});

export const useOptimizedRealtime = ({ 
  onPackageUpdate, 
  onTripUpdate, 
  userRole,
  packages = [],
  recentMutationsRef
}: UseOptimizedRealtimeProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { shouldPreventRefresh } = useModalProtection();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const updateQueueRef = useRef<Array<{ type: 'package' | 'trip', payload?: any }>>([]);

  // Keep a fresh ref to packages so closures always see latest
  const packagesRef = useRef(packages);
  packagesRef.current = packages;

  // Optimized notification handler
  const handleNotification = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT' && newRecord?.user_id !== user?.id) {
      if (userRole === 'admin') {
        toast({
          title: "Nueva solicitud de paquete",
          description: `${newRecord.item_description} - Requiere revisión`,
        });
      }
    } else if (eventType === 'UPDATE' && newRecord?.user_id !== user?.id) {
      const documentUploaded = (
        (newRecord.purchase_confirmation && !oldRecord?.purchase_confirmation) ||
        (newRecord.tracking_info && !oldRecord?.tracking_info) ||
        (newRecord.payment_receipt && !oldRecord?.payment_receipt)
      );

      if (documentUploaded && userRole === 'admin') {
        const documentType = newRecord.payment_receipt && !oldRecord?.payment_receipt 
          ? "comprobante de pago" 
          : "documentos";
        toast({
          title: newRecord.payment_receipt && !oldRecord?.payment_receipt 
            ? "🔔 Nuevo comprobante de pago" 
            : "Nuevo documento subido",
          description: `El shopper ha subido ${documentType} para el paquete ${newRecord.item_description}`,
        });
      }
    }
  }, [toast, user?.id, userRole]);

  // Check if a package was recently mutated locally (within 2s)
  const wasRecentlyMutatedLocally = useCallback((packageId: string): boolean => {
    if (!recentMutationsRef?.current) return false;
    const mutatedAt = recentMutationsRef.current[packageId];
    if (!mutatedAt) return false;
    const elapsed = Date.now() - mutatedAt;
    if (elapsed < 2000) return true;
    // Clean up expired entry
    delete recentMutationsRef.current[packageId];
    return false;
  }, [recentMutationsRef]);

  // Process queued updates when modals are closed
  const processUpdateQueue = useCallback(() => {
    if (updateQueueRef.current.length === 0) return;
    
    const queuedUpdates = [...updateQueueRef.current];
    updateQueueRef.current = [];
    const currentPackages = packagesRef.current;
    
    queuedUpdates.forEach(({ type, payload }) => {
      if (type === 'package' && onPackageUpdate && payload?.new) {
        // Skip if recently mutated locally
        if (wasRecentlyMutatedLocally(payload.new.id)) return;

        const updatedPackages = [...currentPackages];
        const existingIndex = currentPackages.findIndex(pkg => pkg.id === payload.new.id);
        
        if (existingIndex >= 0) {
          updatedPackages[existingIndex] = mergePackagePayload(updatedPackages[existingIndex], payload.new);
        } else {
          updatedPackages.unshift(payload.new);
        }
        onPackageUpdate(updatedPackages);
      } else if (type === 'trip' && onTripUpdate) {
        onTripUpdate();
      }
    });
  }, [onPackageUpdate, onTripUpdate, wasRecentlyMutatedLocally]);

  // Debounced callback execution with modal protection
  const debouncedCallback = useCallback((updateType: 'package' | 'trip', payload?: any) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const isCriticalUpdate = payload?.new && (
      (payload.new.payment_receipt && !payload.old?.payment_receipt) ||
      (payload.new.status === 'payment_pending_approval' && payload.old?.status === 'payment_pending') ||
      (payload.new.status !== payload.old?.status && ['in_transit', 'delivered'].includes(payload.new.status))
    );

    debounceTimeoutRef.current = setTimeout(() => {
      if (shouldPreventRefresh() && !isCriticalUpdate) {
        updateQueueRef.current.push({ type: updateType, payload });
        return;
      }

      if (updateType === 'package' && onPackageUpdate) {
        if (payload?.new) {
          // Skip if this user just mutated this package locally
          if (wasRecentlyMutatedLocally(payload.new.id)) {
            console.log('⏭️ Skipping realtime overwrite for recently mutated package:', payload.new.id);
            return;
          }

          const currentPackages = packagesRef.current;
          const updatedPackages = [...currentPackages];
          const existingIndex = currentPackages.findIndex(pkg => pkg.id === payload.new.id);
          
          if (existingIndex >= 0) {
            updatedPackages[existingIndex] = mergePackagePayload(updatedPackages[existingIndex], payload.new);
          } else {
            updatedPackages.unshift(payload.new);
          }
          onPackageUpdate(updatedPackages);
        }
      } else if (updateType === 'trip' && onTripUpdate) {
        onTripUpdate();
      }
    }, isCriticalUpdate ? 100 : 150);
  }, [onPackageUpdate, onTripUpdate, shouldPreventRefresh, wasRecentlyMutatedLocally]);

  // Process queued updates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!shouldPreventRefresh()) {
        processUpdateQueue();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [processUpdateQueue, shouldPreventRefresh]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('optimized-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'packages' },
        (payload) => {
          handleNotification(payload);
          debouncedCallback('package', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        (payload) => {
          debouncedCallback('trip', payload);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [user, handleNotification, debouncedCallback]);
};
