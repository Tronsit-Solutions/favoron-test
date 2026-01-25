import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Twilio Status Webhook
 * 
 * This webhook receives status updates from Twilio for WhatsApp messages.
 * Twilio sends POST requests as form-urlencoded data when message status changes.
 * 
 * Status progression: queued → sent → delivered → read (or failed/undelivered)
 * 
 * Required: Configure this URL as StatusCallback when sending messages
 */

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Twilio sends form-urlencoded data
    const formData = await req.formData();
    
    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const errorCode = formData.get('ErrorCode') as string | null;
    const errorMessage = formData.get('ErrorMessage') as string | null;
    const to = formData.get('To') as string;
    
    console.log('📩 Twilio status webhook received:', {
      messageSid,
      messageStatus,
      errorCode,
      errorMessage,
      to
    });

    if (!messageSid || !messageStatus) {
      console.error('❌ Missing required fields: MessageSid or MessageStatus');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare update data
    const updateData: {
      delivery_status: string;
      delivery_error_code: string | null;
      delivered_at: string | null;
    } = {
      delivery_status: messageStatus,
      delivery_error_code: errorCode || null,
      delivered_at: null
    };

    // Set delivered_at timestamp for terminal success states
    if (messageStatus === 'delivered' || messageStatus === 'read') {
      updateData.delivered_at = new Date().toISOString();
    }

    // Update the log record by twilio_sid
    const { data, error } = await supabase
      .from('whatsapp_notification_logs')
      .update(updateData)
      .eq('twilio_sid', messageSid)
      .select('id, phone_number, template_id');

    if (error) {
      console.error('❌ Error updating notification log:', error);
      return new Response(
        JSON.stringify({ error: 'Database update failed' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No matching log found for SID:', messageSid);
      // Still return 200 to acknowledge receipt (Twilio will retry on non-2xx)
      return new Response(
        JSON.stringify({ success: true, message: 'No matching log found, but acknowledged' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('✅ Status updated successfully:', {
      messageSid,
      status: messageStatus,
      recordId: data[0].id,
      template: data[0].template_id
    });

    // Log failed deliveries for monitoring
    if (messageStatus === 'failed' || messageStatus === 'undelivered') {
      console.error('🚨 Message delivery failed:', {
        messageSid,
        errorCode,
        errorMessage,
        phone: data[0].phone_number,
        template: data[0].template_id
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: true,
        status: messageStatus,
        recordId: data[0].id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ Unexpected error in webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
