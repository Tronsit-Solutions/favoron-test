import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createOrUpdateTripPaymentAccumulator } from '@/hooks/useCreateTripPaymentAccumulator';
import { usePlatformFeesContext } from '@/contexts/PlatformFeesContext';

export interface AdminTipProduct {
  itemDescription: string;
  estimatedPrice: string;
  itemLink?: string;
  quantity?: string;
  adminAssignedTip: number;
  additionalNotes?: string | null;
}

interface SaveProductTipsOptions {
  tripId?: string | null;
  travelerId?: string | null;
  trustLevel?: string;
}

/**
 * Persists per-product tips into packages.products_data (JSONB),
 * updates the quote with the total tip, and recalculates trip_payment_accumulator.
 */
export const useAdminTips = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { rates } = usePlatformFeesContext();

  const saveProductTips = async (
    packageId: string, 
    products: AdminTipProduct[],
    options?: SaveProductTipsOptions
  ) => {
    // Calculate total tip from all products
    const totalTip = products.reduce((sum, p) => sum + (p.adminAssignedTip || 0), 0);

    // Normalize products to the expected JSON shape
    const normalizedProducts = products.map((p) => ({
      itemDescription: p.itemDescription ?? '',
      estimatedPrice: (p.estimatedPrice ?? '0').toString(),
      itemLink: p.itemLink || null,
      quantity: (p.quantity ?? '1').toString(),
      adminAssignedTip: Number.isFinite(p.adminAssignedTip) ? p.adminAssignedTip : 0,
      additionalNotes: p.additionalNotes ?? null,
    }));

    // Fetch current package data to get quote and log
    const { data: currentPkg, error: fetchError } = await supabase
      .from('packages')
      .select('quote, admin_actions_log, matched_trip_id')
      .eq('id', packageId)
      .single();

    if (fetchError) {
      console.error('Error fetching package:', fetchError);
      throw fetchError;
    }

    // Cast quote to object type
    const currentQuote = (typeof currentPkg?.quote === 'object' && currentPkg?.quote !== null && !Array.isArray(currentPkg?.quote))
      ? currentPkg.quote as Record<string, any>
      : {};
    const currentLog = Array.isArray(currentPkg?.admin_actions_log) 
      ? currentPkg.admin_actions_log 
      : [];

    // Calculate service fee based on trust level using dynamic rates from DB
    const trustLevel = options?.trustLevel || 'basic';
    const serviceRate = trustLevel === 'prime' ? rates.prime : rates.standard;
    const newServiceFee = totalTip * serviceRate;
    const currentDeliveryFee = parseFloat(String(currentQuote.deliveryFee || '0'));
    const newTotalPrice = totalTip + newServiceFee + currentDeliveryFee;

    // Build updated quote
    const updatedQuote: Record<string, any> = {
      ...currentQuote,
      price: totalTip.toFixed(2),
      serviceFee: newServiceFee.toFixed(2),
      totalPrice: newTotalPrice.toFixed(2),
      manually_edited: true,
      edited_at: new Date().toISOString(),
      edited_by: user?.id || null,
    };

    // Create admin log entry
    const adminLogEntry = {
      action: 'product_tips_updated',
      timestamp: new Date().toISOString(),
      admin_id: user?.id || null,
      details: {
        previous_tip: String(currentQuote.price || '0'),
        new_tip: totalTip.toFixed(2),
        previous_service_fee: String(currentQuote.serviceFee || '0'),
        new_service_fee: newServiceFee.toFixed(2),
        products_count: products.length,
      }
    };

    // Update package with products_data, quote, and admin_assigned_tip
    const { error } = await supabase
      .from('packages')
      .update({
        products_data: normalizedProducts as unknown as any,
        quote: updatedQuote as unknown as any,
        admin_assigned_tip: totalTip,
        admin_actions_log: [...currentLog, adminLogEntry] as unknown as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', packageId);

    if (error) {
      throw error;
    }

    // Sync tips to all active package_assignments so quotes use fresh values
    const { error: assignError } = await supabase
      .from('package_assignments')
      .update({
        products_data: normalizedProducts as unknown as any,
        admin_assigned_tip: totalTip,
        updated_at: new Date().toISOString(),
      })
      .eq('package_id', packageId)
      .in('status', ['bid_pending', 'bid_submitted']);

    if (assignError) {
      console.error('Error syncing tips to package_assignments:', assignError);
      // Don't throw - the master package was updated successfully
    }

    // Recalculate trip payment accumulator if we have trip info
    const tripId = options?.tripId || currentPkg?.matched_trip_id;
    const travelerId = options?.travelerId;
    
    if (tripId && travelerId) {
      try {
        await createOrUpdateTripPaymentAccumulator(tripId, travelerId);
        console.log('Trip payment accumulator updated successfully');
      } catch (accError) {
        console.error('Error updating trip payment accumulator:', accError);
        // Don't throw - the tips were saved successfully
      }
    }

    toast({
      title: 'Tips guardados',
      description: `Tip total: Q${totalTip.toFixed(2)} - Quote actualizado`,
    });

    return { totalTip, serviceFee: newServiceFee, totalPrice: newTotalPrice };
  };

  return { saveProductTips };
};
