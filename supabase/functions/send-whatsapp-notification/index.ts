import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppNotificationRequest {
  user_id: string;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  action_url?: string;
}

const isValidOrigin = (origin: string | null): boolean => {
  const allowedOrigins = [
    'https://favoron.app',
    'https://dfhoduirmqbarjnspbdh.supabase.co'
  ];
  return origin ? allowedOrigins.some(allowed => origin.includes(allowed)) : false;
};

const sendWhatsAppMessage = async (
  to: string,
  message: string
): Promise<any> => {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM");

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials not configured");
  }

  // Format phone number for WhatsApp
  const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const body = new URLSearchParams({
    From: fromNumber,
    To: toWhatsApp,
    Body: message,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

const formatWhatsAppMessage = (
  title: string,
  message: string,
  actionUrl?: string
): string => {
  let formattedMessage = `*${title}*\n\n${message}`;
  
  if (actionUrl) {
    formattedMessage += `\n\n🔗 Ver detalles: ${actionUrl}`;
  }
  
  formattedMessage += `\n\n_Mensaje automático de Favoron_`;
  
  return formattedMessage;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📱 WhatsApp notification function called');
    
    const origin = req.headers.get('origin');
    if (!isValidOrigin(origin)) {
      console.warn('⚠️ Invalid origin:', origin);
      return new Response(
        JSON.stringify({ error: 'Invalid origin' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, title, message, type, priority, action_url }: WhatsAppNotificationRequest = await req.json();

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, message' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile with WhatsApp preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('country_code, phone_number, whatsapp_notifications, whatsapp_notification_preferences')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('👤 User profile:', {
      country_code: profile.country_code,
      phone_number: profile.phone_number,
      whatsapp_enabled: profile.whatsapp_notifications,
      preferences: profile.whatsapp_notification_preferences
    });

    // Check if user has WhatsApp notifications enabled
    if (!profile.whatsapp_notifications) {
      console.log('⏭️ WhatsApp notifications disabled for user');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'WhatsApp notifications disabled' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has both country code and phone number
    if (!profile.country_code || !profile.phone_number) {
      console.log('⏭️ No phone number registered for user');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'No phone number' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check notification type preferences
    if (type && profile.whatsapp_notification_preferences) {
      const typeEnabled = profile.whatsapp_notification_preferences[type];
      if (typeEnabled === false) {
        console.log(`⏭️ WhatsApp notifications disabled for type: ${type}`);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: `Type ${type} disabled` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Combine country code and phone number
    const fullPhoneNumber = `${profile.country_code}${profile.phone_number}`;
    
    // Format and send WhatsApp message
    const formattedMessage = formatWhatsAppMessage(title, message, action_url);
    console.log('📤 Sending WhatsApp message to:', fullPhoneNumber);
    
    const twilioResponse = await sendWhatsAppMessage(fullPhoneNumber, formattedMessage);
    console.log('✅ WhatsApp message sent successfully:', twilioResponse.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_sid: twilioResponse.sid,
        to: fullPhoneNumber
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ Error sending WhatsApp notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
