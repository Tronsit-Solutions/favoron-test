import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const { package_id } = await req.json();

    if (!package_id) {
      return new Response(
        JSON.stringify({ error: 'Missing package_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify package belongs to user
    const { data: pkg, error: pkgError } = await userClient
      .from('packages')
      .select('id, user_id, status, recurrente_checkout_id, recurrente_payment_id, item_description')
      .eq('id', package_id)
      .single();

    if (pkgError || !pkg) {
      return new Response(
        JSON.stringify({ error: 'Package not found or access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (pkg.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Package does not belong to authenticated user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Already processed — idempotent
    if (pkg.status === 'pending_purchase' || pkg.recurrente_payment_id) {
      console.log('Package already verified:', package_id);
      return new Response(
        JSON.stringify({ success: true, already_verified: true, status: pkg.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutId = pkg.recurrente_checkout_id;
    if (!checkoutId) {
      return new Response(
        JSON.stringify({ error: 'No checkout ID found for this package' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Recurrente API
    const publicKey = Deno.env.get('RECURRENTE_PUBLIC_KEY');
    const secretKey = Deno.env.get('RECURRENTE_SECRET_KEY');

    if (!publicKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: 'Recurrente API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying checkout with Recurrente API:', checkoutId);

    const recResponse = await fetch(`https://app.recurrente.com/api/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'X-PUBLIC-KEY': publicKey,
        'X-SECRET-KEY': secretKey,
        'Content-Type': 'application/json',
      },
    });

    if (!recResponse.ok) {
      const errText = await recResponse.text();
      console.error('Recurrente API error:', recResponse.status, errText);
      return new Response(
        JSON.stringify({ error: 'Failed to verify with Recurrente', verified: false }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutData = await recResponse.json();
    console.log('Recurrente checkout data:', JSON.stringify(checkoutData));
    console.log('Recurrente API response keys:', Object.keys(checkoutData));
    console.log('Payment ID candidates:', {
      payment_id: checkoutData.payment_id,
      last_payment_id: checkoutData.last_payment_id,
      'payment.id': checkoutData.payment?.id,
      'payments[0].id': checkoutData.payments?.[0]?.id,
      id: checkoutData.id,
    });

    const paidStatuses = ['paid', 'completed', 'succeeded'];
    const isPaid = paidStatuses.includes(checkoutData.status?.toLowerCase());

    if (!isPaid) {
      console.log('Checkout not yet paid, status:', checkoutData.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          checkout_status: checkoutData.status,
          message: 'Payment not yet confirmed' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment verified — update package with service role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Extract payment ID from multiple possible fields — do NOT fallback to checkout ID
    const paymentId = checkoutData.payment_id 
      || checkoutData.last_payment_id
      || checkoutData.payment?.id 
      || checkoutData.payments?.[0]?.id
      || null;
    
    console.log('Resolved payment ID:', paymentId, '(null means no payment ID found in API response)');

    const { error: updateError } = await serviceClient
      .from('packages')
      .update({
        recurrente_payment_id: paymentId,
        status: 'pending_purchase',
        payment_receipt: {
          method: 'card',
          provider: 'recurrente',
          checkout_id: checkoutId,
          payment_id: paymentId,
          paid_at: new Date().toISOString(),
          auto_captured: true,
          auto_approved: true,
          verified_with_api: true,
          verified_status: checkoutData.status,
          verified_via: 'callback_fallback'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', package_id);

    if (updateError) {
      console.error('Failed to update package:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update package status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Package verified and updated to pending_purchase:', package_id);

    // Create notification
    await serviceClient.rpc('create_notification', {
      _user_id: userId,
      _title: '💳 Pago con tarjeta confirmado',
      _message: `¡Perfecto! Tu pago para el pedido "${pkg.item_description}" ha sido confirmado. El viajero procederá con la compra de tu producto y te mantendremos informado del progreso.`,
      _type: 'payment',
      _priority: 'high',
      _metadata: { package_id, payment_method: 'card', auto_approved: true, verified_via: 'callback' }
    });

    return new Response(
      JSON.stringify({ success: true, verified: true, status: 'pending_purchase' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-recurrente-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
