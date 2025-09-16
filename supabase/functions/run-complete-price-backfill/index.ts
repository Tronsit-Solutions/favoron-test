import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔧 Starting completePrice backfill...');

    // First, get all packages with quotes
    const { data: packages, error: fetchError } = await supabase
      .from('packages')
      .select('id, quote')
      .not('quote', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${packages?.length || 0} packages with quotes`);

    let updatedCount = 0;
    let alreadyHasCount = 0;
    let errorCount = 0;

    // Process each package
    for (const pkg of packages || []) {
      try {
        if (!pkg.quote || typeof pkg.quote !== 'object') {
          console.log(`⚠️ Skipping package ${pkg.id}: invalid quote`);
          errorCount++;
          continue;
        }

        const quote = pkg.quote as any;
        
        // Check if completePrice already exists
        if (quote.completePrice !== undefined && quote.completePrice !== null) {
          console.log(`✅ Package ${pkg.id} already has completePrice: ${quote.completePrice}`);
          alreadyHasCount++;
          continue;
        }

        // Parse price components safely
        const price = typeof quote.price === 'string' ? parseFloat(quote.price) || 0 : Number(quote.price || 0);
        const serviceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) || 0 : Number(quote.serviceFee || 0);
        const deliveryFee = typeof quote.deliveryFee === 'string' ? parseFloat(quote.deliveryFee) || 0 : Number(quote.deliveryFee || 0);

        // Calculate completePrice
        const completePrice = price + serviceFee + deliveryFee;

        // Update quote with completePrice
        const updatedQuote = {
          ...quote,
          completePrice: completePrice
        };

        console.log(`🔧 Updating package ${pkg.id}: completePrice = ${completePrice} (${price} + ${serviceFee} + ${deliveryFee})`);

        const { error: updateError } = await supabase
          .from('packages')
          .update({ quote: updatedQuote })
          .eq('id', pkg.id);

        if (updateError) {
          console.error(`❌ Error updating package ${pkg.id}:`, updateError);
          errorCount++;
          continue;
        }

        console.log(`✅ Successfully updated package ${pkg.id}`);
        updatedCount++;

      } catch (error) {
        console.error(`💥 Error processing package ${pkg.id}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: 'CompletePrice backfill completed',
      statistics: {
        totalPackages: packages?.length || 0,
        updatedPackages: updatedCount,
        alreadyHadCompletePrice: alreadyHasCount,
        errors: errorCount
      }
    };

    console.log('📋 Final results:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Critical error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});