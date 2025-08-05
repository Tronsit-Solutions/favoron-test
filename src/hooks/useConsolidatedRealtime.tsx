import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UseConsolidatedRealtimeProps {
  onPackageUpdate?: () => void;
  onTripUpdate?: () => void;
  userRole?: 'admin' | 'traveler' | 'shopper';
}

export const useConsolidatedRealtime = ({ 
  onPackageUpdate, 
  onTripUpdate, 
  userRole 
}: UseConsolidatedRealtimeProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const debounceRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Debounced callback function
  const debouncedCallback = useCallback((key: string, callback: () => void, delay = 500) => {
    if (debounceRef.current[key]) {
      clearTimeout(debounceRef.current[key]);
    }
    
    debounceRef.current[key] = setTimeout(() => {
      callback();
      delete debounceRef.current[key];
    }, delay);
  }, []);

  // Notification handler based on user role
  const handleNotification = useCallback((type: 'package' | 'trip', payload: any) => {
    if (!userRole) return;

    if (type === 'package' && payload.eventType === 'INSERT') {
      const newPackage = payload.new;
      
      if (userRole === 'admin') {
        toast({
          title: "Nueva solicitud de paquete",
          description: `${newPackage.item_description} - Requiere revisión`,
        });
      }
    }

    if (type === 'package' && payload.eventType === 'UPDATE') {
      const updatedPackage = payload.new;
      const oldPackage = payload.old;
      
      const documentUploaded = (
        (updatedPackage.purchase_confirmation && !oldPackage.purchase_confirmation) ||
        (updatedPackage.tracking_info && !oldPackage.tracking_info) ||
        (updatedPackage.payment_receipt && !oldPackage.payment_receipt)
      );

      if (documentUploaded && userRole === 'admin') {
        const documentType = updatedPackage.payment_receipt && !oldPackage.payment_receipt 
          ? "comprobante de pago" 
          : "documentos";
        toast({
          title: updatedPackage.payment_receipt && !oldPackage.payment_receipt 
            ? "🔔 Nuevo comprobante de pago" 
            : "Nuevo documento subido",
          description: `El shopper ha subido ${documentType} para el paquete ${updatedPackage.item_description}`,
        });
      }
    }
  }, [userRole, toast]);

  useEffect(() => {
    if (!user) return;

    // Single consolidated channel for all real-time updates
    const channel = supabase
      .channel('consolidated-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packages'
        },
        (payload) => {
          handleNotification('package', payload);
          
          if (onPackageUpdate) {
            debouncedCallback('packages', onPackageUpdate, 300);
          }
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
          handleNotification('trip', payload);
          
          if (onTripUpdate) {
            debouncedCallback('trips', onTripUpdate, 300);
          }
        }
      )
      .subscribe();

    return () => {
      // Clear all pending timeouts
      Object.values(debounceRef.current).forEach(timeout => clearTimeout(timeout));
      debounceRef.current = {};
      
      supabase.removeChannel(channel);
    };
  }, [user, userRole, onPackageUpdate, onTripUpdate, handleNotification, debouncedCallback]);
};