import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify checkout status with Recurrente API
async function verifyCheckoutWithRecurrente(checkoutId: string): Promise<{ verified: boolean; status: string | null; error?: string }> {
  const publicKey = Deno.env.get('RECURRENTE_PUBLIC_KEY');
  const secretKey = Deno.env.get('RECURRENTE_SECRET_KEY');

  if (!publicKey || !secretKey) {
    console.error('Missing Recurrente API keys');
    return { verified: false, status: null, error: 'Missing API keys' };
  }

  try {
    const response = await fetch(`https://app.recurrente.com/api/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'X-PUBLIC-KEY': publicKey,
        'X-SECRET-KEY': secretKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Recurrente API error:', response.status, await response.text());
      return { verified: false, status: null, error: `API returned ${response.status}` };
    }

    const checkoutData = await response.json();
    console.log('Recurrente checkout verification:', JSON.stringify(checkoutData, null, 2));

    // Valid paid statuses from Recurrente
    const paidStatuses = ['paid', 'completed', 'succeeded'];
    const isPaid = paidStatuses.includes(checkoutData.status?.toLowerCase());

    return { 
      verified: isPaid, 
      status: checkoutData.status,
      error: isPaid ? undefined : `Checkout status is ${checkoutData.status}, not paid`
    };
  } catch (error) {
    console.error('Error verifying checkout with Recurrente:', error);
    return { verified: false, status: null, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET requests (Recurrente endpoint verification ping)
  if (req.method === 'GET') {
    console.log('Recurrente webhook GET verification request received');
    return new Response(
      JSON.stringify({ status: 'ok', message: 'Webhook endpoint is active' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Guard against empty body
    const bodyText = await req.text();
    if (!bodyText || bodyText.trim() === '') {
      console.warn('Recurrente webhook received empty body');
      return new Response(
        JSON.stringify({ received: true, warning: 'Empty body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', bodyText.substring(0, 500));
      return new Response(
        JSON.stringify({ received: true, error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Recurrente webhook received:', JSON.stringify(payload));

    const eventType = payload.event_type || payload.type || payload.event;
    const checkoutId = payload.checkout?.id || payload.data?.checkout_id || payload.data?.object?.checkout_id || payload.checkout_id;
    const paymentId = payload.payment?.id || payload.data?.payment_id || payload.data?.object?.id || payload.payment_intent_id;

    console.log('Recurrente webhook received - Event:', eventType);
    console.log('Extracted IDs - Checkout:', checkoutId, 'Payment:', paymentId);

    if (!checkoutId) {
      console.error('No checkout ID in webhook payload');
      return new Response(
        JSON.stringify({ received: true, warning: 'No checkout ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the package by checkout ID
    const { data: packageData, error: fetchError } = await supabase
      .from('packages')
      .select('id, status, user_id, item_description, quote, recurrente_payment_id')
      .eq('recurrente_checkout_id', checkoutId)
      .single();

    if (fetchError || !packageData) {
      console.error('Package not found for checkout:', checkoutId, fetchError);
      return new Response(
        JSON.stringify({ received: true, warning: 'Package not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found package:', packageData.id, 'Current status:', packageData.status, 'Current payment ID:', packageData.recurrente_payment_id);

    // If package already processed but webhook has a different/better payment ID, update it
    if (packageData.status === 'pending_purchase' && paymentId && paymentId !== packageData.recurrente_payment_id) {
      console.log('Package already processed but payment ID differs. Updating from', packageData.recurrente_payment_id, 'to', paymentId);
      const { error: updateIdError } = await supabase
        .from('packages')
        .update({
          recurrente_payment_id: paymentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', packageData.id);
      
      if (updateIdError) {
        console.error('Failed to update payment ID:', updateIdError);
      } else {
        console.log('Payment ID corrected successfully');
      }

      return new Response(
        JSON.stringify({ received: true, processed: 'payment_id_corrected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different event types - include Recurrente's payment_intent events
    if (eventType === 'payment.succeeded' || eventType === 'checkout.completed' || eventType === 'payment_intent.succeeded') {
      
      // SECURITY: Verify the checkout status with Recurrente API before updating
      console.log('Verifying checkout status with Recurrente API...');
      const verification = await verifyCheckoutWithRecurrente(checkoutId);
      
      if (!verification.verified) {
        console.error('Checkout verification failed:', verification.error);
        console.error('Webhook claims payment succeeded but Recurrente API shows:', verification.status);
        
        // Log the suspicious webhook attempt
        console.warn('SECURITY: Potential spoofed webhook detected for checkout:', checkoutId);
        
        return new Response(
          JSON.stringify({ 
            received: true, 
            error: 'Payment verification failed',
            details: 'Checkout status could not be verified with Recurrente API'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Checkout verified as paid with Recurrente API');
      
      // Payment successful and verified - update package status to pending_purchase
      const { error: updateError } = await supabase
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
            verified_status: verification.status
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', packageData.id);

      if (updateError) {
        console.error('Failed to update package status:', updateError);
      } else {
        console.log('Package status updated to pending_purchase (card payment verified and auto-approved)');
        
        // Notify user about successful payment
        const { error: notifyError } = await supabase.rpc('create_notification', {
          _user_id: packageData.user_id,
          _title: '💳 Pago con tarjeta confirmado',
          _message: `Tu pago con tarjeta para "${packageData.item_description}" ha sido confirmado. Procederemos con la compra de tu producto.`,
          _type: 'payment',
          _priority: 'high',
          _metadata: { package_id: packageData.id, payment_method: 'card', auto_approved: true }
        });

        if (notifyError) {
          console.error('Failed to create notification:', notifyError);
        }
      }

    } else if (eventType === 'payment.failed' || eventType === 'checkout.failed' || eventType === 'payment_intent.failed') {
      // Payment failed - log but don't change status
      console.log('Payment failed for package:', packageData.id);
      
      const { error: updateError } = await supabase
        .from('packages')
        .update({
          payment_method: 'bank_transfer', // Reset to bank transfer
          recurrente_checkout_id: null, // Clear the failed checkout
          updated_at: new Date().toISOString()
        })
        .eq('id', packageData.id);

      if (updateError) {
        console.error('Failed to reset package payment method:', updateError);
      }

    } else if (eventType === 'payment.in_progress') {
      // For bank transfers via Recurrente (24h processing)
      console.log('Payment in progress for package:', packageData.id);
    }

    return new Response(
      JSON.stringify({ received: true, processed: eventType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
