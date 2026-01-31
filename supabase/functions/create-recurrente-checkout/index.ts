import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RECURRENTE_API_URL = 'https://app.recurrente.com/api/checkouts/';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get('RECURRENTE_PUBLIC_KEY');
    const secretKey = Deno.env.get('RECURRENTE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!publicKey || !secretKey) {
      console.error('Missing Recurrente API keys');
      return new Response(
        JSON.stringify({ error: 'Recurrente API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { package_id, user_id, amount, success_url, cancel_url, item_description } = await req.json();

    console.log('Creating Recurrente checkout:', { package_id, user_id, amount, item_description });

    if (!package_id || !user_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: package_id, user_id, amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client early to clear previous checkout
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Clear any previous checkout to avoid webhook conflicts
    const { error: clearError } = await supabase
      .from('packages')
      .update({ recurrente_checkout_id: null })
      .eq('id', package_id);

    if (clearError) {
      console.warn('Failed to clear previous checkout:', clearError);
      // Continue anyway - this is not critical
    }

    // Convert amount to cents (Recurrente uses cents)
    const amountInCents = Math.round(amount * 100);

    // Create checkout in Recurrente
    const checkoutPayload = {
      items: [{
        name: item_description || `Pago Paquete Favorón`,
        currency: 'GTQ',
        amount_in_cents: amountInCents,
        quantity: 1,
        charge_type: 'one_time'
      }],
      success_url: success_url || 'https://preview--favoron.lovable.app/dashboard?payment=success',
      cancel_url: cancel_url || 'https://preview--favoron.lovable.app/dashboard?payment=cancelled',
      metadata: {
        package_id,
        user_id,
        source: 'favoron_web_app'
      }
    };

    console.log('Sending to Recurrente:', JSON.stringify(checkoutPayload));

    const recurrenteResponse = await fetch(RECURRENTE_API_URL, {
      method: 'POST',
      headers: {
        'X-PUBLIC-KEY': publicKey,
        'X-SECRET-KEY': secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    const recurrenteData = await recurrenteResponse.json();

    console.log('Recurrente response:', JSON.stringify(recurrenteData));

    if (!recurrenteResponse.ok) {
      console.error('Recurrente rejection:', {
        status: recurrenteResponse.status,
        statusText: recurrenteResponse.statusText,
        body: recurrenteData,
        package_id,
        amount
      });
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout', details: recurrenteData }),
        { status: recurrenteResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract checkout ID and URL from response
    const checkoutId = recurrenteData.id;
    const checkoutUrl = recurrenteData.checkout_url;

    if (!checkoutId || !checkoutUrl) {
      console.error('Invalid Recurrente response:', recurrenteData);
      return new Response(
        JSON.stringify({ error: 'Invalid response from Recurrente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update package with Recurrente checkout ID
    const { error: updateError } = await supabase
      .from('packages')
      .update({
        recurrente_checkout_id: checkoutId,
        payment_method: 'card',
        updated_at: new Date().toISOString()
      })
      .eq('id', package_id);

    if (updateError) {
      console.error('Failed to update package:', updateError);
      // Don't fail the request, the checkout was created successfully
    }

    console.log('Checkout created successfully:', { checkoutId, checkoutUrl });

    return new Response(
      JSON.stringify({
        checkout_id: checkoutId,
        checkout_url: checkoutUrl,
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-recurrente-checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
