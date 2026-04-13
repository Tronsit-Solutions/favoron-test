import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RECURRENTE_API_URL = 'https://app.recurrente.com/api/checkouts/';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User-context client (respects RLS)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error('Invalid auth token:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log('Authenticated user:', userId);

    // 2. Parse request body
    const { package_id, amount, success_url, cancel_url, item_description } = await req.json();

    if (!package_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: package_id, amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify package ownership via user-context client (RLS enforced)
    const { data: pkg, error: pkgError } = await userClient
      .from('packages')
      .select('id, user_id')
      .eq('id', package_id)
      .single();

    if (pkgError || !pkg) {
      console.error('Package not found or access denied:', package_id, pkgError?.message);
      return new Response(
        JSON.stringify({ error: 'Package not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (pkg.user_id !== userId) {
      console.error('Package ownership mismatch:', { packageUserId: pkg.user_id, authUserId: userId });
      return new Response(
        JSON.stringify({ error: 'Package does not belong to authenticated user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Package ownership verified:', { package_id, userId });

    // 4. Check Recurrente API keys
    const publicKey = Deno.env.get('RECURRENTE_PUBLIC_KEY');
    const secretKey = Deno.env.get('RECURRENTE_SECRET_KEY');

    if (!publicKey || !secretKey) {
      console.error('Missing Recurrente API keys');
      return new Response(
        JSON.stringify({ error: 'Recurrente API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Service role client for package updates (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Save previous checkout ID in payment_receipt for audit trail before clearing
    const { data: currentPkg } = await serviceClient
      .from('packages')
      .select('recurrente_checkout_id, payment_receipt')
      .eq('id', package_id)
      .single();

    const previousCheckoutIds: string[] = [];
    if (currentPkg?.payment_receipt && typeof currentPkg.payment_receipt === 'object') {
      const existing = (currentPkg.payment_receipt as Record<string, unknown>).previous_checkout_ids;
      if (Array.isArray(existing)) previousCheckoutIds.push(...existing);
    }
    if (currentPkg?.recurrente_checkout_id) {
      previousCheckoutIds.push(currentPkg.recurrente_checkout_id);
    }

    const { error: clearError } = await serviceClient
      .from('packages')
      .update({
        recurrente_checkout_id: null,
        payment_receipt: previousCheckoutIds.length > 0
          ? { previous_checkout_ids: previousCheckoutIds }
          : null
      })
      .eq('id', package_id);

    if (clearError) {
      console.warn('Failed to clear previous checkout:', clearError);
    }

    // 6. Create checkout in Recurrente
    const amountInCents = Math.round(amount * 100);

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
        user_id: userId,
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
        body: recurrenteData,
        package_id,
        amount
      });
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout', details: recurrenteData }),
        { status: recurrenteResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutId = recurrenteData.id;
    const checkoutUrl = recurrenteData.checkout_url;

    if (!checkoutId || !checkoutUrl) {
      console.error('Invalid Recurrente response:', recurrenteData);
      return new Response(
        JSON.stringify({ error: 'Invalid response from Recurrente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Update package with service role client
    const { error: updateError } = await serviceClient
      .from('packages')
      .update({
        recurrente_checkout_id: checkoutId,
        payment_method: 'card',
        updated_at: new Date().toISOString()
      })
      .eq('id', package_id);

    if (updateError) {
      console.error('Failed to update package:', updateError);
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
