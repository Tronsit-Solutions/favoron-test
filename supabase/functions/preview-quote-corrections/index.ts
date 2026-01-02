import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting preview quote corrections...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch platform fees from DB (with fallbacks)
    let serviceFeeRatePrime = 0.20;
    
    const { data: feesData, error: feesError } = await supabase
      .from('favoron_company_information')
      .select('service_fee_rate_prime')
      .eq('is_active', true)
      .maybeSingle();
    
    if (!feesError && feesData) {
      serviceFeeRatePrime = feesData.service_fee_rate_prime ?? 0.20;
      console.log(`📊 Using DB Prime rate: ${serviceFeeRatePrime}`);
    } else {
      console.log('⚠️ Using fallback Prime rate: 0.20');
    }

    // Get Prime memberships with approval dates
    const { data: primeData, error: primeError } = await supabase
      .from('prime_memberships')
      .select('user_id, approved_at')
      .not('approved_at', 'is', null);

    if (primeError) {
      console.error('❌ Error fetching Prime memberships:', primeError);
      throw primeError;
    }

    console.log(`📊 Found ${primeData?.length || 0} Prime members`);

    // Create a map of user_id -> prime approval date
    const primeApprovalMap = new Map();
    primeData?.forEach(prime => {
      primeApprovalMap.set(prime.user_id, prime.approved_at);
    });

    // Get packages from Prime users
    const primeUserIds = Array.from(primeApprovalMap.keys());
    if (primeUserIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No Prime users found',
          corrections: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select(`
        id, 
        user_id, 
        quote, 
        delivery_method, 
        created_at,
        profiles!inner(trust_level)
      `)
      .in('user_id', primeUserIds)
      .not('quote', 'is', null);

    if (packagesError) {
      console.error('❌ Error fetching packages:', packagesError);
      throw packagesError;
    }

    console.log(`📦 Found ${packages?.length || 0} packages from Prime users`);

    const corrections = [];
    let eligibleCount = 0;

    // Preview corrections for each package
    for (const pkg of packages || []) {
      const primeApprovalDate = primeApprovalMap.get(pkg.user_id);
      const packageCreatedAt = new Date(pkg.created_at);
      const primeStartDate = new Date(primeApprovalDate);

      // Skip packages created before Prime membership
      if (packageCreatedAt < primeStartDate) {
        console.log(`⏭️  Skipping package ${pkg.id}: created before Prime (${pkg.created_at} < ${primeApprovalDate})`);
        continue;
      }

      eligibleCount++;

      // Check if user is Prime
      const userTrustLevel = pkg.profiles?.trust_level;
      if (userTrustLevel !== 'prime') {
        console.log(`⚠️  Package ${pkg.id}: User trust level is ${userTrustLevel}, not 'prime'`);
        continue;
      }

      const quote = pkg.quote;
      if (!quote || !quote.price) {
        console.log(`⚠️  Package ${pkg.id}: No valid quote found`);
        continue;
      }

      // Current values
      const currentPrice = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price);
      const currentServiceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0);
      const currentTotalPrice = typeof quote.totalPrice === 'string' ? parseFloat(quote.totalPrice) : Number(quote.totalPrice || 0);

      // Calculate correct values using DB rate
      // Service fee: use DB rate for Prime users
      const correctServiceFee = currentPrice * serviceFeeRatePrime;
      
      // Delivery fee: Q0 for Prime users (regardless of delivery method)
      const correctDeliveryFee = 0;
      
      // Total: Price + ServiceFee + DeliveryFee
      const correctTotalPrice = currentPrice + correctServiceFee + correctDeliveryFee;

      // Check if correction is needed (using small tolerance for floating point)
      const serviceFeeNeedsUpdate = Math.abs(correctServiceFee - currentServiceFee) > 0.01;
      const totalPriceNeedsUpdate = Math.abs(correctTotalPrice - currentTotalPrice) > 0.01;

      if (serviceFeeNeedsUpdate || totalPriceNeedsUpdate) {
        corrections.push({
          packageId: pkg.id,
          userId: pkg.user_id,
          deliveryMethod: pkg.delivery_method || 'pickup',
          createdAt: pkg.created_at,
          primeApprovalDate: primeApprovalDate,
          current: {
            price: currentPrice,
            serviceFee: currentServiceFee,
            totalPrice: currentTotalPrice
          },
          corrected: {
            price: currentPrice, // Price stays the same
            serviceFee: correctServiceFee,
            totalPrice: correctTotalPrice
          },
          changes: {
            serviceFee: serviceFeeNeedsUpdate ? (correctServiceFee - currentServiceFee) : 0,
            totalPrice: totalPriceNeedsUpdate ? (correctTotalPrice - currentTotalPrice) : 0
          }
        });
      }
    }

    console.log(`📋 Preview complete: ${corrections.length} corrections needed out of ${eligibleCount} eligible packages`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalPrimeUsers: primeUserIds.length,
          totalPackagesFromPrimeUsers: packages?.length || 0,
          eligiblePackages: eligibleCount,
          correctionsNeeded: corrections.length
        },
        corrections
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Preview function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});