import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UseRealtimePackagesProps {
  onPackageUpdate?: (payload: any) => void;
  userRole?: 'admin' | 'traveler' | 'shopper';
}

export const useRealtimePackages = ({ onPackageUpdate, userRole }: UseRealtimePackagesProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('packages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'packages'
        },
        (payload) => {
          const newPackage = payload.new;
          
          // Show notification based on user role
          if (userRole === 'admin') {
            toast({
              title: "Nueva solicitud de paquete",
              description: `${newPackage.item_description} - Requiere revisión`,
            });
          }

          // Call the callback if provided
          if (onPackageUpdate) {
            onPackageUpdate(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'packages'
        },
        (payload) => {
          const updatedPackage = payload.new;
          const oldPackage = payload.old;
          
          // Check if documents were uploaded
          const documentUploaded = (
            (updatedPackage.purchase_confirmation && !oldPackage.purchase_confirmation) ||
            (updatedPackage.tracking_info && !oldPackage.tracking_info) ||
            (updatedPackage.payment_receipt && !oldPackage.payment_receipt)
          );

          if (documentUploaded) {
            // Show notification based on user role
            if (userRole === 'admin') {
              const documentType = updatedPackage.payment_receipt && !oldPackage.payment_receipt 
                ? "comprobante de pago" 
                : "documentos";
              toast({
                title: updatedPackage.payment_receipt && !oldPackage.payment_receipt 
                  ? "🔔 Nuevo comprobante de pago" 
                  : "Nuevo documento subido",
                description: `El shopper ha subido ${documentType} para el paquete ${updatedPackage.item_description}`,
              });
            } else if (userRole === 'traveler') {
              // Check if this package is matched to the traveler's trip
              if (updatedPackage.matched_trip_id) {
                toast({
                  title: "Documentos actualizados",
                  description: `El shopper ha subido nueva información para tu paquete: ${updatedPackage.item_description}`,
                });
              }
            }
          }

          // Call the callback if provided
          if (onPackageUpdate) {
            onPackageUpdate(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole, onPackageUpdate, toast]);
};