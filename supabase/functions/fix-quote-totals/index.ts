import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🚀 Starting quote totals fix...')

    // Fetch all packages with quotes
    const { data: packages, error: fetchError } = await supabase
      .from('packages')
      .select('id, quote')
      .not('quote', 'is', null)

    if (fetchError) {
      throw new Error(`Failed to fetch packages: ${fetchError.message}`)
    }

    console.log(`📦 Found ${packages?.length || 0} packages with quotes`)

    let updatedCount = 0
    let skippedCount = 0

    for (const pkg of packages || []) {
      const quote = pkg.quote as any
      
      if (!quote || typeof quote !== 'object') {
        console.log(`⚠️ Package ${pkg.id}: Invalid quote object`)
        skippedCount++
        continue
      }

      const price = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price || 0)
      const serviceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0)
      const deliveryFee = typeof quote.deliveryFee === 'string' ? parseFloat(quote.deliveryFee) : Number(quote.deliveryFee || 0)
      
      // Calculate correct totalPrice as simple sum
      const correctTotal = price + serviceFee + deliveryFee
      const currentTotal = typeof quote.totalPrice === 'string' ? parseFloat(quote.totalPrice) : Number(quote.totalPrice || 0)

      // Check if update is needed (tolerance of 0.01)
      if (Math.abs(correctTotal - currentTotal) > 0.01) {
        const updatedQuote = {
          ...quote,
          totalPrice: correctTotal
        }

        const { error: updateError } = await supabase
          .from('packages')
          .update({ quote: updatedQuote })
          .eq('id', pkg.id)

        if (updateError) {
          console.error(`❌ Failed to update package ${pkg.id}:`, updateError.message)
          skippedCount++
        } else {
          console.log(`✅ Updated package ${pkg.id}: ${currentTotal} → ${correctTotal}`)
          updatedCount++
        }
      } else {
        console.log(`✓ Package ${pkg.id}: Already correct (${currentTotal})`)
        skippedCount++
      }
    }

    const summary = {
      total_packages: packages?.length || 0,
      updated_packages: updatedCount,
      skipped_packages: skippedCount,
      success: true
    }

    console.log('📊 Summary:', summary)

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Error in fix-quote-totals:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})