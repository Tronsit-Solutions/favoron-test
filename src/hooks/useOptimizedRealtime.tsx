import { useEffect, useCallback, useRef } from 'react';
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
}

export const useOptimizedRealtime = ({ 
  onPackageUpdate, 
  onTripUpdate, 
  userRole,
  packages = []
}: UseOptimizedRealtimeProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { shouldPreventRefresh } = useModalProtection();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const isPageVisibleRef = useRef(true);
  const updateQueueRef = useRef<Array<{ type: 'package' | 'trip', payload?: any }>>([]);

  // Visibility tracking disabled to prevent auto-refresh on tab changes
  // isPageVisibleRef always remains true to prevent tab-based auto-refreshes

  // Optimized notification handler
  const handleNotification = useCallback((payload: any) => {
    // Show notifications regardless of tab visibility to prevent auto-refresh behavior

    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT' && newRecord?.user_id !== user?.id) {
      if (userRole === 'admin') {
        toast({
          title: "Nueva solicitud de paquete",
          description: `${newRecord.item_description} - Requiere revisión`,
        });
      }
    } else if (eventType === 'UPDATE' && newRecord?.user_id !== user?.id) {
      // Check for document uploads
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

  // Process queued updates when modals are closed
  const processUpdateQueue = useCallback(() => {
    if (updateQueueRef.current.length === 0) return;
    
    const queuedUpdates = [...updateQueueRef.current];
    updateQueueRef.current = [];
    
    queuedUpdates.forEach(({ type, payload }) => {
      if (type === 'package' && onPackageUpdate && payload?.new) {
        const updatedPackages = packages.map(pkg => 
          pkg.id === payload.new.id ? { ...pkg, ...payload.new } : pkg
        );
        if (!packages.find(pkg => pkg.id === payload.new.id)) {
          updatedPackages.push(payload.new);
        }
        onPackageUpdate(updatedPackages);
      } else if (type === 'trip' && onTripUpdate) {
        onTripUpdate();
      }
    });
  }, [onPackageUpdate, onTripUpdate, packages]);

  // Debounced callback execution with modal protection
  const debouncedCallback = useCallback((updateType: 'package' | 'trip', payload?: any) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      // If modals are open, queue the update instead of applying it immediately
      if (shouldPreventRefresh()) {
        updateQueueRef.current.push({ type: updateType, payload });
        return;
      }

      if (updateType === 'package' && onPackageUpdate) {
        // Instead of refetching all data, update the specific package
        if (payload?.new) {
          const updatedPackages = packages.map(pkg => 
            pkg.id === payload.new.id ? { ...pkg, ...payload.new } : pkg
          );
          // Add new packages if they don't exist
          if (!packages.find(pkg => pkg.id === payload.new.id)) {
            updatedPackages.push(payload.new);
          }
          onPackageUpdate(updatedPackages);
        }
      } else if (updateType === 'trip' && onTripUpdate) {
        onTripUpdate();
      }
    }, 500); // 500ms debounce
  }, [onPackageUpdate, onTripUpdate, packages, shouldPreventRefresh]);

  // Expose function to process queued updates
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
        {
          event: '*',
          schema: 'public',
          table: 'packages'
        },
        (payload) => {
          handleNotification(payload);
          debouncedCallback('package', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
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