import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    console.log('Starting Guatemala City delivery fee correction...')

    // Get all packages with delivery method = 'delivery' and destination containing Guatemala City
    const { data: packages, error: fetchError } = await supabase
      .from('packages')
      .select('id, package_destination, quote, delivery_method, status')
      .eq('delivery_method', 'delivery')
      .not('quote', 'is', null)
      .or('package_destination.ilike.%guatemala city%,package_destination.ilike.%ciudad de guatemala%')

    if (fetchError) {
      console.error('Error fetching packages:', fetchError)
      throw fetchError
    }

    console.log(`Found ${packages?.length || 0} packages with Guatemala City destination`)

    let updatedCount = 0
    let skippedCount = 0
    const errors: any[] = []

    for (const pkg of packages || []) {
      try {
        const quote = pkg.quote as any
        
        // Skip if no quote or already has correct deliveryFee
        if (!quote || quote.deliveryFee === 25) {
          skippedCount++
          continue
        }

        // Only update if deliveryFee is different from 25
        if (quote.deliveryFee !== 25) {
          const oldDeliveryFee = quote.deliveryFee || 0
          const difference = oldDeliveryFee - 25
          
          // Update quote with correct delivery fee
          const updatedQuote = {
            ...quote,
            deliveryFee: 25,
            totalPrice: (parseFloat(quote.totalPrice) - difference).toFixed(2)
          }

          const { error: updateError } = await supabase
            .from('packages')
            .update({ quote: updatedQuote })
            .eq('id', pkg.id)

          if (updateError) {
            console.error(`Error updating package ${pkg.id}:`, updateError)
            errors.push({ package_id: pkg.id, error: updateError.message })
          } else {
            console.log(`Updated package ${pkg.id}: deliveryFee ${oldDeliveryFee} → 25, totalPrice reduced by ${difference}`)
            updatedCount++
          }
        }
      } catch (err) {
        console.error(`Error processing package ${pkg.id}:`, err)
        errors.push({ package_id: pkg.id, error: err.message })
      }
    }

    const result = {
      success: true,
      message: `Guatemala City delivery fee correction completed`,
      stats: {
        total_found: packages?.length || 0,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    }

    console.log('Backfill result:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Fatal error in backfill:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})