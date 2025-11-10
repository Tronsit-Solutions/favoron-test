import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  const fromWhatsApp = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
  const toWhatsApp = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  console.log(`📞 Sending WhatsApp from ${fromWhatsApp} to ${toWhatsApp}`);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const body = new URLSearchParams({
    From: fromWhatsApp,
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Test WhatsApp function called');
    
    const { phone_number, title, message } = await req.json();
    
    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: 'phone_number is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('📱 Sending test WhatsApp to:', phone_number);
    
    const formattedMessage = `*${title || "Test Notification from Favoron"}*\n\n${message || "This is a test WhatsApp message."}\n\n_Test message from Favoron_`;
    
    const twilioResponse = await sendWhatsAppMessage(phone_number, formattedMessage);

    console.log("✅ WhatsApp sent successfully:", twilioResponse.sid);

    return new Response(JSON.stringify({ 
      success: true, 
      message_sid: twilioResponse.sid,
      to: phone_number
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
