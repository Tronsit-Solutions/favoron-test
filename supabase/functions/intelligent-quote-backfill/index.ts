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

    // Step 2: Get packages that need potential backfill
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
      .in('user_id', Array.from(primeStartDates.keys()))

    if (packagesError) {
      throw new Error(`Failed to get packages: ${packagesError.message}`)
    }

    console.log(`📦 Found ${packages.length} packages from Prime users to analyze`)

    let updatedCount = 0
    let skippedCount = 0
    const updateResults = []

    // Step 3: Process each package
    for (const pkg of packages) {
      const primeStartDate = primeStartDates.get(pkg.user_id)
      const packageCreatedAt = new Date(pkg.created_at)
      const primeStart = new Date(primeStartDate)
      
      // Only backfill packages created AFTER Prime membership
      if (packageCreatedAt < primeStart) {
        skippedCount++
        console.log(`⏭️ Skipping package ${pkg.id} - created before Prime (${pkg.created_at} < ${primeStartDate})`)
        continue
      }

      const quote = pkg.quote as any
      if (!quote || !quote.price) {
        skippedCount++
        continue
      }

      const currentTrustLevel = pkg.profiles?.trust_level || 'basic'
      if (currentTrustLevel !== 'prime') {
        skippedCount++
        continue
      }

      const basePrice = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price)
      const currentServiceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0)
      const currentTotalPrice = typeof quote.totalPrice === 'string' ? parseFloat(quote.totalPrice) : Number(quote.totalPrice || 0)

      // Recalculate using correct formula for Prime members
      // Service fee: 20% for Prime users
      const correctServiceFee = basePrice * 0.20
      
      // Delivery fee: Q0 for Prime users (regardless of delivery method)
      const deliveryMethod = pkg.delivery_method || 'pickup'
      const deliveryFee = 0 // Prime users always get free delivery
      
      // Total: Price + ServiceFee + DeliveryFee
      const correctTotalPrice = basePrice + correctServiceFee + deliveryFee

      // Check if this package needs updating (tolerance of 0.01 for floating point)
      const serviceFeeNeedsUpdate = Math.abs(currentServiceFee - correctServiceFee) > 0.01
      const totalPriceNeedsUpdate = Math.abs(currentTotalPrice - correctTotalPrice) > 0.01

      if (serviceFeeNeedsUpdate || totalPriceNeedsUpdate) {
        console.log(`🔧 Updating package ${pkg.id}:`, {
          basePrice,
          currentServiceFee,
          correctServiceFee,
          currentTotalPrice,
          correctTotalPrice,
          deliveryMethod,
          deliveryFee
        })

        // Update the quote with correct calculations
        const updatedQuote = {
          ...quote,
          serviceFee: correctServiceFee,
          deliveryFee: deliveryFee,
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
            oldServiceFee: currentServiceFee,
            newServiceFee: correctServiceFee,
            oldTotalPrice: currentTotalPrice,
            newTotalPrice: correctTotalPrice
          })
        }
      } else {
        skippedCount++
        console.log(`✅ Package ${pkg.id} already has correct Prime pricing`)
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