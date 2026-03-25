import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Replicate getActiveTipFromPackage logic from client-side tipHelpers.ts
 * Cannot import client utilities in edge functions, so we inline the logic.
 * 
 * Priority:
 * 1. Sum of adminAssignedTip from non-cancelled products in products_data
 * 2. Fallback to admin_assigned_tip (package-level)
 * 3. Fallback to quote.price
 */
function getActiveTipFromPackage(pkg: any): number {
  if (!pkg) return 0;

  // If products_data exists, sum only active (non-cancelled) products' tips
  let productsArray: any[] = [];
  try {
    if (pkg.products_data) {
      if (typeof pkg.products_data === 'string') {
        productsArray = JSON.parse(pkg.products_data);
      } else if (Array.isArray(pkg.products_data)) {
        productsArray = pkg.products_data;
      }
    }
  } catch {
    productsArray = [];
  }

  if (productsArray.length > 0) {
    const activeProducts = productsArray.filter((p: any) => !p.cancelled);
    const sum = activeProducts.reduce((acc: number, p: any) => acc + (Number(p.adminAssignedTip) || 0), 0);
    if (sum > 0) return sum;
  }

  // Fallback: admin_assigned_tip > quote.price
  if (Number(pkg.admin_assigned_tip) > 0) return Number(pkg.admin_assigned_tip);
  const price = Number(pkg.quote?.price ?? 0);
  return Number.isFinite(price) ? price : 0;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tripId } = await req.json();

    if (!tripId) {
      throw new Error('Trip ID is required');
    }

    console.log('🔄 Recalculating trip payment accumulator for trip:', tripId);

    // Get traveler ID from trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('user_id')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      throw new Error(`Trip not found: ${tripError?.message}`);
    }

    const travelerId = trip.user_id;
    console.log('👤 Traveler ID:', travelerId);

    // Get all delivered packages for this trip with quotes
    // Include ALL post-delivery states: completed, delivered_to_office, ready_for_pickup, ready_for_delivery
    // Exclude packages with incident_flag
    const { data: completedPackages, error: packagesError } = await supabase
      .from('packages')
      .select('id, quote, status, office_delivery, incident_flag, products_data, admin_assigned_tip')
      .eq('matched_trip_id', tripId)
      .in('status', ['completed', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery'])
      .or('incident_flag.is.null,incident_flag.eq.false');

    if (packagesError) {
      throw packagesError;
    }

    console.log('📦 Found packages:', completedPackages?.length || 0);

    // Calculate accumulated amount and delivered count
    let accumulatedAmount = 0;
    let deliveredEligibleCount = 0;

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

    console.log('📊 Delivered packages:', deliveredEligibleCount, 'Amount:', accumulatedAmount);

    // Get total packages count (in_transit or later)
    // Include ready_for_pickup and ready_for_delivery in eligible statuses
    const eligibleStatuses = ['in_transit', 'received_by_traveler', 'delivered_to_office', 'completed', 'delivered', 'ready_for_pickup', 'ready_for_delivery'];
    // Exclude packages with incident_flag
    const { data: inTransitOrLaterPackages, error: eligiblePkgsError } = await supabase
      .from('packages')
      .select('id, status, incident_flag')
      .eq('matched_trip_id', tripId)
      .in('status', eligibleStatuses)
      .or('incident_flag.is.null,incident_flag.eq.false');

    if (eligiblePkgsError) {
      throw eligiblePkgsError;
    }

    const totalPackagesCount = inTransitOrLaterPackages?.length || 0;
    const allDelivered = totalPackagesCount > 0 && deliveredEligibleCount === totalPackagesCount;

    console.log('📊 Total packages:', totalPackagesCount, 'All delivered:', allDelivered);

    // Check if accumulator exists
    const { data: existingAccumulator, error: checkError } = await supabase
      .from('trip_payment_accumulator')
      .select('*')
      .eq('trip_id', tripId)
      .eq('traveler_id', travelerId)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    // Recalculate percentage boost if applicable
    let boostAmount = existingAccumulator?.boost_amount ?? 0;
    if (accumulatedAmount > 0) {
      const { data: usageRecord } = await supabase
        .from('boost_code_usage')
        .select('id, boost_code_id, boost_amount')
        .eq('trip_id', tripId)
        .eq('traveler_id', travelerId)
        .maybeSingle();

      if (usageRecord) {
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
            boostAmount = recalculated;
            await supabase
              .from('boost_code_usage')
              .update({ boost_amount: recalculated })
              .eq('id', usageRecord.id);
          }
        }
      }
    }

    if (existingAccumulator) {
      console.log('🔄 Updating existing accumulator:', existingAccumulator.id);
      // Update existing accumulator
      const { error: updateError } = await supabase
        .from('trip_payment_accumulator')
        .update({
          accumulated_amount: accumulatedAmount,
          boost_amount: boostAmount,
          delivered_packages_count: deliveredEligibleCount,
          total_packages_count: totalPackagesCount,
          all_packages_delivered: allDelivered,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAccumulator.id);

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Accumulator updated successfully');
    } else {
      console.log('➕ Creating new accumulator');
      // Create new accumulator
      if (accumulatedAmount > 0) {
        const { error: insertError } = await supabase
          .from('trip_payment_accumulator')
          .insert({
            trip_id: tripId,
            traveler_id: travelerId,
            accumulated_amount: accumulatedAmount,
            delivered_packages_count: deliveredEligibleCount,
            total_packages_count: totalPackagesCount,
            all_packages_delivered: allDelivered,
            payment_order_created: false
          });

        if (insertError) {
          throw insertError;
        }

        console.log('✅ Accumulator created successfully');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tripId,
        travelerId,
        deliveredPackagesCount: deliveredEligibleCount,
        totalPackagesCount,
        accumulatedAmount,
        allDelivered,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error recalculating trip payment accumulator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
