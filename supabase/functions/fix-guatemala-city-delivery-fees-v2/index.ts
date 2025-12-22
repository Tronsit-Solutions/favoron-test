import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔍 Starting Guatemala City delivery fee correction with payment protection...');

    // Fetch all packages with delivery method = 'delivery'
    const { data: packages, error: fetchError } = await supabaseClient
      .from('packages')
      .select(`
        id, 
        quote, 
        delivery_method, 
        package_destination,
        status,
        matched_trip_id,
        user_id,
        profiles!inner(trust_level)
      `)
      .eq('delivery_method', 'delivery')
      .not('quote', 'is', null);

    if (fetchError) {
      throw new Error(`Error fetching packages: ${fetchError.message}`);
    }

    console.log(`📦 Found ${packages?.length || 0} packages with delivery method`);

    // Filter packages with Guatemala City destination and incorrect delivery fee (Q60)
    const incorrectPackages = packages?.filter(pkg => {
      const destination = pkg.package_destination?.toLowerCase() || '';
      const isGuatemalaCity = destination.match(
        /guatemala\s*city|ciudad\s*de\s*guatemala|^guatemala$|^guate$|ciudad\s*guatemala/
      );
      
      const deliveryFee = parseFloat(pkg.quote?.deliveryFee || '0');
      
      return isGuatemalaCity && deliveryFee === 60;
    }) || [];

    console.log(`⚠️ Found ${incorrectPackages.length} packages with incorrect Q60 delivery fee in Guatemala City`);

    const stats = {
      total: incorrectPackages.length,
      updated: 0,
      skipped_paid: 0,
      skipped_no_trip: 0,
      errors: [] as any[]
    };

    // Process each package
    for (const pkg of incorrectPackages) {
      try {
        console.log(`\n🔍 Processing package ${pkg.id}...`);

        // Skip if no trip assigned
        if (!pkg.matched_trip_id) {
          console.log(`⏭️ SKIPPING package ${pkg.id} - No trip assigned yet`);
          stats.skipped_no_trip++;
          continue;
        }

        // Check if payment_order exists and is completed
        const { data: paymentOrders, error: paymentError } = await supabaseClient
          .from('payment_orders')
          .select('id, status, completed_at, trip_id')
          .eq('trip_id', pkg.matched_trip_id);

        if (paymentError) {
          console.error(`❌ Error checking payment orders for package ${pkg.id}:`, paymentError);
          stats.errors.push({ package_id: pkg.id, error: paymentError.message });
          continue;
        }

        const hasCompletedPayment = paymentOrders?.some(po => po.status === 'completed');
        
        if (hasCompletedPayment) {
          console.log(`🔒 SKIPPING package ${pkg.id} - Payment already completed`);
          stats.skipped_paid++;
          continue;
        }

        // Check if trip_payment_accumulator has payment completed
        const { data: accumulator, error: accumulatorError } = await supabaseClient
          .from('trip_payment_accumulator')
          .select('payment_completed_at, payment_order_created, trip_id')
          .eq('trip_id', pkg.matched_trip_id)
          .maybeSingle();

        if (accumulatorError) {
          console.error(`❌ Error checking accumulator for package ${pkg.id}:`, accumulatorError);
          stats.errors.push({ package_id: pkg.id, error: accumulatorError.message });
          continue;
        }

        if (accumulator?.payment_completed_at || accumulator?.payment_order_created) {
          console.log(`🔒 SKIPPING package ${pkg.id} - Trip payment already processed`);
          stats.skipped_paid++;
          continue;
        }

        // Calculate correct delivery fee based on trust level
        const trustLevel = pkg.profiles?.trust_level;
        const correctDeliveryFee = trustLevel === 'prime' ? 0 : 25;

        console.log(`✏️ Correcting delivery fee: Q60 → Q${correctDeliveryFee} (trust_level: ${trustLevel})`);

        // Calculate new totals
        const currentQuote = pkg.quote;
        const oldDeliveryFee = parseFloat(currentQuote.deliveryFee || '0');
        const difference = oldDeliveryFee - correctDeliveryFee;

        const newTotalPrice = parseFloat(currentQuote.totalPrice || '0') - difference;

        // Update the package
        const { error: updateError } = await supabaseClient
          .from('packages')
          .update({
            quote: {
              ...currentQuote,
              deliveryFee: correctDeliveryFee,
              totalPrice: newTotalPrice
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', pkg.id);

        if (updateError) {
          console.error(`❌ Error updating package ${pkg.id}:`, updateError);
          stats.errors.push({ package_id: pkg.id, error: updateError.message });
        } else {
          console.log(`✅ Updated package ${pkg.id}: Q${oldDeliveryFee} → Q${correctDeliveryFee}`);
          stats.updated++;
        }
      } catch (error: any) {
        console.error(`❌ Error processing package ${pkg.id}:`, error);
        stats.errors.push({ package_id: pkg.id, error: error.message });
      }
    }

    console.log('\n📊 Final Statistics:');
    console.log(`   Total packages found: ${stats.total}`);
    console.log(`   ✅ Updated: ${stats.updated}`);
    console.log(`   🔒 Skipped (already paid): ${stats.skipped_paid}`);
    console.log(`   ⏭️ Skipped (no trip): ${stats.skipped_no_trip}`);
    console.log(`   ❌ Errors: ${stats.errors.length}`);

    return new Response(
      JSON.stringify({
        success: stats.errors.length === 0,
        stats,
        message: `Corrected ${stats.updated} packages, protected ${stats.skipped_paid} paid packages`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
