import { supabase } from '@/integrations/supabase/client';
import { getActiveTipFromPackage } from '@/utils/tipHelpers';

export const createOrUpdateTripPaymentAccumulator = async (tripId: string, travelerId: string) => {
  try {
    // Obtener todos los paquetes completados del viaje con quotes
    // Incluir todos los estados de entrega: delivered_to_office, ready_for_pickup, ready_for_delivery, completed
    // Excluir paquetes con incidencia del conteo de entregados
    const { data: completedPackages, error: packagesError } = await supabase
      .from('packages')
      .select('id, quote, status, office_delivery, admin_assigned_tip, incident_flag, products_data')
      .eq('matched_trip_id', tripId)
      .in('status', ['completed', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery'])
      .or('incident_flag.is.null,incident_flag.eq.false');

    if (packagesError) throw packagesError;

    // Calcular el monto acumulado de tips sumando el tip base de cada paquete (quote.price)
    let accumulatedAmount = 0;
    let deliveredEligibleCount = 0;
    
    console.log('📊 Processing packages for trip:', tripId);
    completedPackages?.forEach((pkg: any) => {
      const isCompleted = pkg.status === 'completed';
      const isDeliveredToOffice = pkg.status === 'delivered_to_office' && 
        pkg.office_delivery?.admin_confirmation;
      const isReadyForPickup = pkg.status === 'ready_for_pickup';
      const isReadyForDelivery = pkg.status === 'ready_for_delivery';
      
      if (!isCompleted && !isDeliveredToOffice && !isReadyForPickup && !isReadyForDelivery) {
        console.log('⏭️ Skipping package (not delivered):', pkg.id, 'status:', pkg.status);
        return;
      }
      
      deliveredEligibleCount += 1;
      
      // Use getActiveTipFromPackage to exclude cancelled products
      const tip = getActiveTipFromPackage(pkg);
      if (tip > 0) {
        accumulatedAmount += tip;
        console.log('✅ Package counted:', pkg.id, 'status:', pkg.status, 'tip:', tip);
      } else {
        console.log('⚠️ Package has no tip:', pkg.id, 'status:', pkg.status);
      }
    });
    
    console.log('📊 Summary: delivered_count =', deliveredEligibleCount, 'accumulated =', accumulatedAmount);

    // Fetch existing boost info and recalculate percentage boosts if needed
    let existingBoostAmount = 0;
    const { data: existingAcc } = await supabase
      .from('trip_payment_accumulator')
      .select('boost_amount')
      .eq('trip_id', tripId)
      .eq('traveler_id', travelerId)
      .maybeSingle();
    
    if (existingAcc) {
      existingBoostAmount = Number(existingAcc.boost_amount) || 0;
    }

    // If there's a boost_code_usage record, recalculate percentage boosts
    if (accumulatedAmount > 0) {
      const { data: usageRecord } = await supabase
        .from('boost_code_usage')
        .select('id, boost_code_id, boost_amount')
        .eq('trip_id', tripId)
        .eq('traveler_id', travelerId)
        .maybeSingle();

      if (usageRecord) {
        // Check if the boost code is percentage-based
        const { data: boostCode } = await supabase
          .from('boost_codes')
          .select('boost_type, boost_value, max_boost_amount')
          .eq('id', usageRecord.boost_code_id)
          .single();

        if (boostCode?.boost_type === 'percentage') {
          let recalculated = Math.round(accumulatedAmount * boostCode.boost_value) / 100;
          if (boostCode.max_boost_amount && recalculated > boostCode.max_boost_amount) {
            recalculated = boostCode.max_boost_amount;
          }
          recalculated = Math.round(recalculated * 100) / 100;

          if (recalculated !== Number(usageRecord.boost_amount)) {
            console.log('🚀 Recalculating percentage boost:', usageRecord.boost_amount, '->', recalculated);
            existingBoostAmount = recalculated;

            // Update both usage record and accumulator
            await supabase
              .from('boost_code_usage')
              .update({ boost_amount: recalculated })
              .eq('id', usageRecord.id);
          }
        }
      }
    }

    console.log('🚀 Boost amount for trip:', existingBoostAmount);

    // Obtener total de paquetes del viaje con estado igual o posterior a 'in_transit'
    // Excluir paquetes con incidencia del conteo total para no bloquear pagos
    const eligibleStatuses = ['in_transit','received_by_traveler','delivered_to_office','completed','delivered','ready_for_pickup','ready_for_delivery'];
    const { data: inTransitOrLaterPackages, error: eligiblePkgsError } = await supabase
      .from('packages')
      .select('id, status, incident_flag')
      .eq('matched_trip_id', tripId)
      .in('status', eligibleStatuses)
      .or('incident_flag.is.null,incident_flag.eq.false');

    if (eligiblePkgsError) throw eligiblePkgsError;

    const totalPackagesCount = inTransitOrLaterPackages?.length || 0;
    const deliveredPackagesCount = deliveredEligibleCount;
    const allDelivered = totalPackagesCount > 0 && deliveredPackagesCount === totalPackagesCount;
    // Verificar si ya existe un acumulador
    const { data: existingAccumulator, error: checkError } = await supabase
      .from('trip_payment_accumulator')
      .select('*')
      .eq('trip_id', tripId)
      .eq('traveler_id', travelerId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingAccumulator) {
      // Actualizar el acumulador existente
      const { error: updateError } = await supabase
        .from('trip_payment_accumulator')
        .update({
          accumulated_amount: accumulatedAmount,
          delivered_packages_count: deliveredPackagesCount,
          total_packages_count: totalPackagesCount,
          all_packages_delivered: allDelivered,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAccumulator.id);

      if (updateError) throw updateError;
    } else {
      // Crear nuevo acumulador solo si hay tips
      if (accumulatedAmount > 0) {
        const { error: insertError } = await supabase
          .from('trip_payment_accumulator')
          .insert({
            trip_id: tripId,
            traveler_id: travelerId,
            accumulated_amount: accumulatedAmount,
            delivered_packages_count: deliveredPackagesCount,
            total_packages_count: totalPackagesCount,
            all_packages_delivered: allDelivered,
            payment_order_created: false
          });

        if (insertError) throw insertError;
      }
    }

    // Apply pending boost code from trip if not yet applied
    await applyPendingBoostCode(tripId, travelerId);

    return { success: true };
  } catch (error) {
    console.error('Error creating/updating trip payment accumulator:', error);
    return { success: false, error };
  }
};

/**
 * Check if the trip has a boost_code saved but not yet applied (no boost_code_usage record).
 * If so, call validate_boost_code RPC to apply it now that the accumulator exists.
 */
const applyPendingBoostCode = async (tripId: string, travelerId: string) => {
  try {
    // Get the trip's boost_code
    const { data: trip } = await supabase
      .from('trips')
      .select('boost_code')
      .eq('id', tripId)
      .single();

    if (!trip?.boost_code) return;

    // Check if already applied
    const { data: existingUsage } = await supabase
      .from('boost_code_usage')
      .select('id')
      .eq('trip_id', tripId)
      .eq('traveler_id', travelerId)
      .maybeSingle();

    if (existingUsage) {
      console.log('🚀 Boost code already applied for trip:', tripId);
      return;
    }

    // Apply the boost code via RPC
    console.log('🚀 Applying pending boost code:', trip.boost_code, 'for trip:', tripId);
    const { data: result, error } = await supabase.rpc('validate_boost_code', {
      _code: trip.boost_code,
      _trip_id: tripId,
      _traveler_id: travelerId,
    });

    if (error) {
      console.warn('🚀 Failed to apply pending boost code:', error);
    } else {
      const boostResult = result as any;
      if (boostResult?.valid) {
        console.log('🚀 Pending boost code applied successfully:', boostResult.boost_amount);
      } else {
        console.warn('🚀 Pending boost code invalid:', boostResult?.error);
      }
    }
  } catch (err) {
    console.warn('🚀 Error applying pending boost code:', err);
  }
};