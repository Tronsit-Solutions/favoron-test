import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createOrUpdateTripPaymentAccumulator } from './useCreateTripPaymentAccumulator';

interface QuoteUpdateParams {
  packageId: string;
  newTip: number;
  newServiceFee: number;
  newDeliveryFee: number;
  tripId: string | null;
  travelerId: string | null;
  adminId: string;
  previousQuote: any;
  // Discount fields (optional)
  discountCode?: string;
  discountCodeId?: string;
  discountAmount?: number;
  shopperUserId?: string;
}

export const useQuoteManagement = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateQuoteManually = async ({
    packageId,
    newTip,
    newServiceFee,
    newDeliveryFee,
    tripId,
    travelerId,
    adminId,
    previousQuote,
    discountCode,
    discountCodeId,
    discountAmount,
    shopperUserId
  }: QuoteUpdateParams): Promise<{ success: boolean; error?: string }> => {
    setIsUpdating(true);

    try {
      // Calculate new total
      const newTotal = newTip + newServiceFee + newDeliveryFee;

      // Build updated quote object
      const updatedQuote: Record<string, any> = {
        ...previousQuote,
        price: newTip.toFixed(2),
        serviceFee: newServiceFee.toFixed(2),
        deliveryFee: newDeliveryFee.toFixed(2),
        totalPrice: newTotal.toFixed(2),
        manually_edited: true,
        edited_at: new Date().toISOString(),
        edited_by: adminId
      };

      // Add discount fields if provided
      if (discountCode && discountCodeId && discountAmount && discountAmount > 0) {
        updatedQuote.discountCode = discountCode;
        updatedQuote.discountCodeId = discountCodeId;
        updatedQuote.discountAmount = discountAmount;
        updatedQuote.originalTotalPrice = newTotal.toFixed(2);
        updatedQuote.finalTotalPrice = (newTotal - discountAmount).toFixed(2);
      } else if (!discountCode && previousQuote?.discountCode) {
        // Admin removed discount
        delete updatedQuote.discountCode;
        delete updatedQuote.discountCodeId;
        delete updatedQuote.discountAmount;
        delete updatedQuote.originalTotalPrice;
        delete updatedQuote.finalTotalPrice;
      }

      // Create admin action log entry
      const adminLogEntry = {
        action: 'quote_manually_edited',
        admin_id: adminId,
        timestamp: new Date().toISOString(),
        details: {
          previous_tip: previousQuote?.price || '0',
          new_tip: newTip.toFixed(2),
          previous_service_fee: previousQuote?.serviceFee || '0',
          new_service_fee: newServiceFee.toFixed(2),
          previous_delivery_fee: previousQuote?.deliveryFee || '0',
          new_delivery_fee: newDeliveryFee.toFixed(2),
          previous_total: previousQuote?.totalPrice || '0',
          new_total: newTotal.toFixed(2),
          reason: 'Manual quote adjustment by admin'
        }
      };

      // Get current package data
      const { data: currentPkg, error: fetchError } = await supabase
        .from('packages')
        .select('admin_actions_log, admin_assigned_tip, products_data')
        .eq('id', packageId)
        .single();

      if (fetchError) throw fetchError;

      const currentLog = Array.isArray(currentPkg?.admin_actions_log) 
        ? currentPkg.admin_actions_log 
        : [];

      // Update products_data with new tip (for single product packages)
      let updatedProductsData = currentPkg?.products_data;
      if (updatedProductsData && Array.isArray(updatedProductsData) && updatedProductsData.length === 1) {
        const firstProduct = updatedProductsData[0];
        if (typeof firstProduct === 'object' && firstProduct !== null) {
          updatedProductsData = [{
            ...(firstProduct as Record<string, any>),
            adminAssignedTip: newTip
          }];
        }
      }

      // Update the package with new quote, products_data, and log
      const { error: updateError } = await supabase
        .from('packages')
        .update({
          quote: updatedQuote,
          admin_assigned_tip: newTip,
          products_data: updatedProductsData as any,
          admin_actions_log: [...currentLog, adminLogEntry] as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', packageId);

      if (updateError) throw updateError;

      // Register discount code usage if discount was applied
      if (discountCode && discountCodeId && discountAmount && discountAmount > 0 && shopperUserId) {
        const { error: usageError } = await supabase
          .from('discount_code_usage')
          .insert({
            discount_code_id: discountCodeId,
            package_id: packageId,
            user_id: shopperUserId,
            discount_amount: discountAmount,
          });
        
        if (usageError) {
          console.error('⚠️ Failed to register discount code usage:', usageError);
          // Don't fail the whole operation
        } else {
          console.log('✅ Discount code usage registered');
        }
      }

      // Recalculate trip_payment_accumulator if tripId and travelerId are present
      if (tripId && travelerId) {
        console.log('📊 Recalculating trip payment accumulator after quote edit...');
        const accResult = await createOrUpdateTripPaymentAccumulator(tripId, travelerId);
        
        if (!accResult.success) {
          console.error('⚠️ Failed to update trip payment accumulator:', accResult.error);
          // Don't fail the whole operation, just log warning
          toast({
            title: "Cotización actualizada",
            description: "La cotización se guardó pero hubo un problema actualizando el acumulador de pagos.",
            variant: "default",
          });
        } else {
          console.log('✅ Trip payment accumulator updated successfully');
        }
      }

      toast({
        title: "Cotización actualizada",
        description: `Tip: Q${newTip.toFixed(2)}, Service Fee: Q${newServiceFee.toFixed(2)}, Delivery: Q${newDeliveryFee.toFixed(2)}, Total: Q${newTotal.toFixed(2)}`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating quote:', error);
      toast({
        title: "Error al actualizar cotización",
        description: error.message || "No se pudo guardar los cambios",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateQuoteManually,
    isUpdating
  };
};
