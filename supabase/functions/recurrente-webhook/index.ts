import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const payload = await req.json();
    
    console.log('Recurrente webhook received:', JSON.stringify(payload));

    const eventType = payload.event_type || payload.type || payload.event;
    const checkoutId = payload.checkout?.id || payload.data?.checkout_id || payload.data?.object?.checkout_id || payload.checkout_id;
    const paymentId = payload.payment?.id || payload.data?.payment_id || payload.data?.object?.id || payload.payment_intent_id;
    const metadata = payload.checkout?.metadata || payload.metadata || payload.data?.object?.metadata || {};

    console.log('Recurrente webhook received - Event:', eventType);
    console.log('Extracted IDs - Checkout:', checkoutId, 'Payment:', paymentId);
    console.log('Full payload:', JSON.stringify(payload, null, 2));

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
      .select('id, status, user_id, item_description, quote')
      .eq('recurrente_checkout_id', checkoutId)
      .single();

    if (fetchError || !packageData) {
      console.error('Package not found for checkout:', checkoutId, fetchError);
      return new Response(
        JSON.stringify({ received: true, warning: 'Package not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found package:', packageData.id);

    // Handle different event types - include Recurrente's payment_intent events
    if (eventType === 'payment.succeeded' || eventType === 'checkout.completed' || eventType === 'payment_intent.succeeded') {
      // Payment successful - update package status
      const { error: updateError } = await supabase
        .from('packages')
        .update({
          recurrente_payment_id: paymentId,
          status: 'payment_pending_approval',
          payment_receipt: {
            method: 'card',
            provider: 'recurrente',
            checkout_id: checkoutId,
            payment_id: paymentId,
            paid_at: new Date().toISOString(),
            auto_captured: true
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', packageData.id);

      if (updateError) {
        console.error('Failed to update package status:', updateError);
      } else {
        console.log('Package status updated to payment_pending_approval');
        
        // Notify admins about the payment
        const { error: notifyError } = await supabase.rpc('create_notification', {
          _user_id: packageData.user_id,
          _title: '💳 Pago con tarjeta recibido',
          _message: `Tu pago con tarjeta para "${packageData.item_description}" ha sido procesado exitosamente. Nuestro equipo lo verificará pronto.`,
          _type: 'payment',
          _priority: 'high',
          _metadata: { package_id: packageData.id, payment_method: 'card' }
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
