import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "./useNotifications";
import { formatDateUTC } from "@/lib/formatters";

export type TripChangeType = 'receiving_window' | 'delivery_date' | 'address';

const ACTIVE_PACKAGE_STATUSES = [
  'matched',
  'quote_sent',
  'quote_accepted',
  'payment_pending_approval',
  'pending_purchase',
  'in_transit',
  'received_by_traveler',
  'pending_office_confirmation',
  'delivered_to_office'
];

export function useTripEditNotifications() {
  const { createNotification } = useNotifications();

  const getChangeMessage = (
    changeType: TripChangeType,
    tripDetails: {
      from_city?: string;
      to_city?: string;
      first_day_packages?: string;
      last_day_packages?: string;
      delivery_date?: string;
      package_receiving_address?: any;
    }
  ): string => {
    switch (changeType) {
      case 'receiving_window':
        return `El viajero ha actualizado las fechas para recibir paquetes: del ${formatDateUTC(new Date(tripDetails.first_day_packages!))} al ${formatDateUTC(new Date(tripDetails.last_day_packages!))}. Revisa los detalles de tu pedido.`;
      
      case 'delivery_date':
        return `El viajero ha modificado la fecha de entrega en oficina a ${formatDateUTC(new Date(tripDetails.delivery_date!))}. Tu paquete será entregado ese día.`;
      
      case 'address':
        const city = tripDetails.package_receiving_address?.cityArea || tripDetails.from_city;
        return `El viajero ha actualizado la dirección donde recibirá tus productos en ${city}. Revisa los nuevos detalles en tu dashboard.`;
      
      default:
        return 'El viajero ha actualizado información importante de tu pedido.';
    }
  };

  const notifyShoppersOfTripChange = async (
    tripId: string,
    changeType: TripChangeType,
    tripDetails: any
  ): Promise<{ notifiedCount: number; error?: string }> => {
    try {
      // Find active packages for this trip
      const { data: activePackages, error: packagesError } = await supabase
        .from('packages')
        .select('id, user_id, item_description')
        .eq('matched_trip_id', tripId)
        .in('status', ACTIVE_PACKAGE_STATUSES);

      if (packagesError) {
        console.error('Error fetching active packages:', packagesError);
        return { notifiedCount: 0, error: packagesError.message };
      }

      if (!activePackages || activePackages.length === 0) {
        return { notifiedCount: 0 };
      }

      // Get unique shopper IDs and their package IDs
      const shopperPackagesMap = new Map<string, string[]>();
      activePackages.forEach(p => {
        const existing = shopperPackagesMap.get(p.user_id) || [];
        shopperPackagesMap.set(p.user_id, [...existing, p.id]);
      });

      const message = getChangeMessage(changeType, tripDetails);
      let notifiedCount = 0;

      // Send notification to each unique shopper with their package IDs in metadata
      for (const [shopperId, packageIds] of shopperPackagesMap.entries()) {
        try {
          await createNotification(
            shopperId,
            '⚠️ Actualización importante del viaje',
            message,
            'trip',
            'high', // High priority = email + WhatsApp
            '/dashboard',
            {
              tripId,
              changeType,
              packageIds,
              changedAt: new Date().toISOString(),
              seenOnCard: false
            }
          );
          notifiedCount++;
        } catch (notifyError) {
          console.error(`Error notifying shopper ${shopperId}:`, notifyError);
        }
      }

      return { notifiedCount };
    } catch (error: any) {
      console.error('Error in notifyShoppersOfTripChange:', error);
      return { notifiedCount: 0, error: error.message };
    }
  };

  const hasActivePackages = async (tripId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('packages')
      .select('id')
      .eq('matched_trip_id', tripId)
      .in('status', ACTIVE_PACKAGE_STATUSES)
      .limit(1);

    if (error) {
      console.error('Error checking active packages:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  };

  return {
    notifyShoppersOfTripChange,
    hasActivePackages,
    getChangeMessage
  };
}
