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

    console.log('🔧 Starting completePrice backfill for quotes...');

    // Fetch all packages that have a quote
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
    let skippedCount = 0;

    for (const pkg of packages || []) {
      if (!pkg.quote || typeof pkg.quote !== 'object') {
        console.log(`⚠️ Skipping package ${pkg.id}: invalid quote object`);
        skippedCount++;
        continue;
      }

      const quote = pkg.quote as any;
      
      // Check if completePrice already exists
      if (quote.completePrice !== undefined) {
        console.log(`⚠️ Skipping package ${pkg.id}: completePrice already exists`);
        skippedCount++;
        continue;
      }

      // Extract price components with safe parsing
      const price = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price || 0);
      const serviceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0);
      const deliveryFee = typeof quote.deliveryFee === 'string' ? parseFloat(quote.deliveryFee) : Number(quote.deliveryFee || 0);

      // Calculate completePrice
      const completePrice = price + serviceFee + deliveryFee;

      // Update the quote with completePrice
      const updatedQuote = {
        ...quote,
        completePrice: completePrice
      };

      const { error: updateError } = await supabase
        .from('packages')
        .update({ quote: updatedQuote })
        .eq('id', pkg.id);

      if (updateError) {
        console.error(`❌ Error updating package ${pkg.id}:`, updateError);
        continue;
      }

      console.log(`✅ Updated package ${pkg.id}: completePrice = ${completePrice} (${price} + ${serviceFee} + ${deliveryFee})`);
      updatedCount++;
    }

    const result = {
      message: 'CompletePrice backfill completed successfully',
      totalPackages: packages?.length || 0,
      updatedPackages: updatedCount,
      skippedPackages: skippedCount
    };

    console.log('📋 Final results:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in completePrice backfill:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});