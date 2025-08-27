import { supabase } from '@/integrations/supabase/client';

export const createOrUpdateTripPaymentAccumulator = async (tripId: string, travelerId: string) => {
  try {
    // Obtener todos los paquetes completados del viaje con quotes
    const { data: completedPackages, error: packagesError } = await supabase
      .from('packages')
      .select('id, quote, status, office_delivery')
      .eq('matched_trip_id', tripId)
      .in('status', ['completed', 'delivered_to_office'])
      .not('quote', 'is', null);

    if (packagesError) throw packagesError;

    // Calcular el monto acumulado de tips sumando el tip base de cada paquete (quote.price)
    let accumulatedAmount = 0;
    let deliveredEligibleCount = 0;
    completedPackages?.forEach((pkg: any) => {
      // Considerar paquetes completamente finalizados o entregados en oficina con confirmación de admin
      const isDelivered = pkg.status === 'completed' || (pkg.status === 'delivered_to_office' && pkg.office_delivery && pkg.office_delivery.admin_confirmation);
      if (isDelivered) {
        deliveredEligibleCount += 1;
      } else {
        return;
      }

      if (pkg.quote) {
        const quote = pkg.quote as any;
        const tip = Number(quote?.price ?? 0);
        if (tip > 0) {
          accumulatedAmount += tip;
        }
      }
    });

    // Obtener total de paquetes del viaje
    const { data: allPackages, error: allPackagesError } = await supabase
      .from('packages')
      .select('id')
      .eq('matched_trip_id', tripId);

    if (allPackagesError) throw allPackagesError;

    const totalPackagesCount = allPackages?.length || 0;
    const deliveredPackagesCount = deliveredEligibleCount;

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
            payment_order_created: false
          });

        if (insertError) throw insertError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating/updating trip payment accumulator:', error);
    return { success: false, error };
  }
};