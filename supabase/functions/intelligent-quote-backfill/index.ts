import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

      // Calculate correct fees based on trust level and delivery method
      let correctServiceFee: number
      let correctDeliveryFee: number

      if (currentTrustLevel === 'prime') {
        // Prime users: 20% service fee, Q0 delivery fee
        correctServiceFee = basePrice * 0.20
        correctDeliveryFee = 0
      } else {
        // Standard users: 40% service fee, Q25 delivery fee only for delivery
        correctServiceFee = basePrice * 0.40
        const deliveryMethod = pkg.delivery_method || 'pickup'
        correctDeliveryFee = deliveryMethod === 'delivery' ? 25 : 0
      }
      
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