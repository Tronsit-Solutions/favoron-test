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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { 
      tripId, 
      travelerId, 
      amount, 
      bankAccountHolder, 
      bankAccountNumber, 
      bankAccountType, 
      bankName 
    } = await req.json()

    console.log('📦 Creating manual payment order:', { tripId, travelerId, amount })

    // Step 1: Create or update trip_payment_accumulator
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, quote, status, office_delivery')
      .eq('matched_trip_id', tripId)
      .in('status', ['completed', 'delivered_to_office'])
      .not('quote', 'is', null)

    if (packagesError) {
      throw packagesError
    }

    let accumulatedAmount = 0
    let deliveredPackagesCount = 0

    packages?.forEach((pkg: any) => {
      const isCompleted = pkg.status === 'completed'
      const isDeliveredToOffice = pkg.status === 'delivered_to_office' && 
        pkg.office_delivery?.admin_confirmation
      
      if (isCompleted || isDeliveredToOffice) {
        deliveredPackagesCount++
        const tip = Number(pkg.quote?.price ?? 0)
        if (tip > 0) {
          accumulatedAmount += tip
        }
      }
    })

    console.log('📊 Calculated accumulator:', { accumulatedAmount, deliveredPackagesCount })

    // Get total packages count
    const { data: allPackages, error: allPackagesError } = await supabase
      .from('packages')
      .select('id, status')
      .eq('matched_trip_id', tripId)
      .in('status', ['in_transit', 'received_by_traveler', 'delivered_to_office', 'completed', 'delivered'])

    if (allPackagesError) {
      throw allPackagesError
    }

    const totalPackagesCount = allPackages?.length || 0
    const allDelivered = totalPackagesCount > 0 && deliveredPackagesCount === totalPackagesCount

    // Upsert trip_payment_accumulator
    const { error: accumulatorError } = await supabase
      .from('trip_payment_accumulator')
      .upsert({
        trip_id: tripId,
        traveler_id: travelerId,
        accumulated_amount: accumulatedAmount,
        delivered_packages_count: deliveredPackagesCount,
        total_packages_count: totalPackagesCount,
        all_packages_delivered: allDelivered,
        payment_order_created: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'trip_id,traveler_id'
      })

    if (accumulatorError) {
      throw accumulatorError
    }

    console.log('✅ Accumulator created/updated')

    // Step 2: Call RPC to create payment order
    const { data: paymentOrderId, error: rpcError } = await supabase.rpc(
      'create_payment_order_with_snapshot',
      {
        _trip_id: tripId,
        _traveler_id: travelerId,
        _amount: amount,
        _bank_account_holder: bankAccountHolder,
        _bank_account_number: bankAccountNumber,
        _bank_account_type: bankAccountType,
        _bank_name: bankName
      }
    )

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      throw rpcError
    }

    console.log('✅ Payment order created:', paymentOrderId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentOrderId,
        accumulatedAmount,
        deliveredPackagesCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating manual payment order:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
