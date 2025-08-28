import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const isPageVisibleRef = useRef(true);

  // Handle visibility change to reduce unnecessary updates when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Optimized notification handler
  const handleNotification = useCallback((payload: any) => {
    // Only show notifications when page is visible or for high priority items
    if (!isPageVisibleRef.current && payload.new?.status !== 'matched') return;

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

  // Debounced callback execution
  const debouncedCallback = useCallback((updateType: 'package' | 'trip', payload?: any) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
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
  }, [onPackageUpdate, onTripUpdate, packages]);

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