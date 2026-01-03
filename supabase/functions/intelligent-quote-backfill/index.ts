import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Check if a cityArea is "Guatemala" (capital city only)
 * Only "Guatemala" qualifies for reduced delivery fee (Q25)
 * Mixco, Villa Nueva, Petapa, etc. are Q60
 */
const isGuatemalaCityArea = (cityArea?: string): boolean => {
  if (!cityArea) return false;
  const normalized = cityArea.toLowerCase().trim();
  
  // Only exact matches for Guatemala city
  const guatemalaCityNames = [
    'guatemala',
    'guatemala city', 
    'ciudad de guatemala',
    'guate'
  ];
  
  return guatemalaCityNames.some(name => 
    normalized === name || normalized.startsWith(name + ',')
  );
};

/**
 * Get the delivery fee based on delivery method, trust level, and cityArea
 */
const getDeliveryFee = (
  deliveryMethod: string = 'pickup', 
  trustLevel?: string,
  cityArea?: string
): number => {
  if (deliveryMethod === 'pickup') return 0;
  
  const isGuatemala = isGuatemalaCityArea(cityArea);
  
  // Prime: Q0 in Guatemala, Q35 outside
  if (trustLevel === 'prime') {
    return isGuatemala ? 0 : 35;
  }
  
  // Standard: Q25 in Guatemala, Q60 outside
  return isGuatemala ? 25 : 60;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Starting intelligent quote backfill...')

    // Fetch platform fees from DB (with fallbacks)
    let serviceFeeRatePrime = 0.25;
    let serviceFeeRateStandard = 0.50;
    
    const { data: feesData, error: feesError } = await supabaseClient
      .from('favoron_company_information')
      .select('service_fee_rate_prime, service_fee_rate_standard')
      .eq('is_active', true)
      .maybeSingle();
    
    if (!feesError && feesData) {
      serviceFeeRatePrime = feesData.service_fee_rate_prime ?? 0.25;
      serviceFeeRateStandard = feesData.service_fee_rate_standard ?? 0.50;
      console.log(`📊 Using DB rates: Prime=${serviceFeeRatePrime}, Standard=${serviceFeeRateStandard}`);
    } else {
      console.log('⚠️ Using fallback rates: Prime=0.25, Standard=0.50');
    }

    // Step 1: Get Prime membership start dates for each user
    const { data: primeData, error: primeError } = await supabaseClient
      .from('prime_memberships')
      .select('user_id, approved_at')
      .eq('status', 'approved')
      .order('approved_at', { ascending: true })

    if (primeError) {
      throw new Error(`Failed to get Prime data: ${primeError.message}`)
    }

    const primeStartDates = new Map()
    primeData.forEach(pm => {
      if (!primeStartDates.has(pm.user_id) || new Date(pm.approved_at) < new Date(primeStartDates.get(pm.user_id))) {
        primeStartDates.set(pm.user_id, pm.approved_at)
      }
    })

    console.log(`📊 Found ${primeStartDates.size} Prime users with start dates`)

    // Step 2: Get ALL packages that need potential backfill
    const { data: packages, error: packagesError } = await supabaseClient
      .from('packages')
      .select(`
        id, 
        user_id, 
        created_at, 
        quote, 
        delivery_method,
        confirmed_delivery_address,
        profiles!packages_user_id_fkey(trust_level)
      `)
      .not('quote', 'is', null)

    if (packagesError) {
      throw new Error(`Failed to get packages: ${packagesError.message}`)
    }

    console.log(`📦 Found ${packages.length} packages to analyze`)

    let updatedCount = 0
    let skippedCount = 0
    const updateResults = []

    // Step 3: Process each package
    for (const pkg of packages) {
      const quote = pkg.quote as any
      if (!quote || !quote.price) {
        skippedCount++
        continue
      }

      const currentTrustLevel = pkg.profiles?.trust_level || 'basic'
      const basePrice = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price)
      const currentServiceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0)
      const currentDeliveryFee = typeof quote.deliveryFee === 'string' ? parseFloat(quote.deliveryFee) : Number(quote.deliveryFee || 0)
      const currentTotalPrice = typeof quote.totalPrice === 'string' ? parseFloat(quote.totalPrice) : Number(quote.totalPrice || 0)

      // Get cityArea from confirmed_delivery_address for delivery fee calculation
      const confirmedAddress = pkg.confirmed_delivery_address as any
      const cityArea = confirmedAddress?.cityArea

      // Calculate correct fees based on trust level and cityArea
      let correctServiceFee: number
      let correctDeliveryFee: number

      if (currentTrustLevel === 'prime') {
        // Prime users: use DB rate
        correctServiceFee = basePrice * serviceFeeRatePrime
      } else {
        // Standard users: use DB rate
        correctServiceFee = basePrice * serviceFeeRateStandard
      }
      
      // Delivery fee based on cityArea
      correctDeliveryFee = getDeliveryFee(pkg.delivery_method || 'pickup', currentTrustLevel, cityArea)
      
      // Total: Price + ServiceFee + DeliveryFee
      const correctTotalPrice = basePrice + correctServiceFee + correctDeliveryFee

      // Check if this package needs updating (tolerance of 0.01 for floating point)
      const serviceFeeNeedsUpdate = Math.abs(currentServiceFee - correctServiceFee) > 0.01
      const deliveryFeeNeedsUpdate = Math.abs(currentDeliveryFee - correctDeliveryFee) > 0.01
      const totalPriceNeedsUpdate = Math.abs(currentTotalPrice - correctTotalPrice) > 0.01

      if (serviceFeeNeedsUpdate || deliveryFeeNeedsUpdate || totalPriceNeedsUpdate) {
        console.log(`🔧 Updating package ${pkg.id}:`, {
          trustLevel: currentTrustLevel,
          deliveryMethod: pkg.delivery_method,
          cityArea,
          basePrice,
          currentServiceFee,
          correctServiceFee,
          currentDeliveryFee,
          correctDeliveryFee,
          currentTotalPrice,
          correctTotalPrice
        })

        // Update the quote with correct calculations
        const updatedQuote = {
          ...quote,
          serviceFee: correctServiceFee,
          deliveryFee: correctDeliveryFee,
          totalPrice: correctTotalPrice
        }

        const { error: updateError } = await supabaseClient
          .from('packages')
          .update({ quote: updatedQuote })
          .eq('id', pkg.id)

        if (updateError) {
          console.error(`❌ Failed to update package ${pkg.id}:`, updateError)
          updateResults.push({ packageId: pkg.id, status: 'error', error: updateError.message })
        } else {
          updatedCount++
          updateResults.push({ 
            packageId: pkg.id, 
            status: 'updated',
            trustLevel: currentTrustLevel,
            cityArea,
            oldServiceFee: currentServiceFee,
            newServiceFee: correctServiceFee,
            oldDeliveryFee: currentDeliveryFee,
            newDeliveryFee: correctDeliveryFee,
            oldTotalPrice: currentTotalPrice,
            newTotalPrice: correctTotalPrice
          })
        }
      } else {
        skippedCount++
        console.log(`✅ Package ${pkg.id} already has correct pricing`)
      }
    }

    const summary = {
      totalPackagesAnalyzed: packages.length,
      packagesUpdated: updatedCount,
      packagesSkipped: skippedCount,
      primeUsersFound: primeStartDates.size,
      updateResults: updateResults.slice(0, 10) // First 10 results for logging
    }

    console.log('📊 Backfill Summary:', summary)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Intelligent quote backfill completed',
        summary
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      },
    )

  } catch (error) {
    console.error('❌ Backfill error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      },
    )
  }
})