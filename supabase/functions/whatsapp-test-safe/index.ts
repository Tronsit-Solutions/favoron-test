import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get allowlist from environment - only these numbers can receive test messages
const ALLOWED_TEST_NUMBER = Deno.env.get('WHATSAPP_TEST_TO') || '';
const DEFAULT_TEMPLATE_SID = Deno.env.get('WHATSAPP_TEST_TEMPLATE_SID') || '';

// Normalize phone number for comparison
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Ensure it starts with +
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

// Check if number is in allowlist
function isNumberAllowed(to: string): boolean {
  const normalizedTo = normalizePhoneNumber(to);
  const normalizedAllowed = normalizePhoneNumber(ALLOWED_TEST_NUMBER.replace('whatsapp:', ''));
  
  console.log(`[ALLOWLIST CHECK] Requested: ${normalizedTo}, Allowed: ${normalizedAllowed}`);
  
  return normalizedTo === normalizedAllowed;
}

// Send WhatsApp message using Content Template
async function sendWhatsAppTemplate(
  to: string,
  contentSid: string,
  contentVariables: Record<string, string>
): Promise<{ success: boolean; data?: any; error?: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM');

  if (!accountSid || !authToken || !fromNumber) {
    console.error('[CONFIG ERROR] Missing Twilio credentials');
    return { success: false, error: 'Missing Twilio configuration' };
  }

  // Format the destination number
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${normalizePhoneNumber(to)}`;
  const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

  console.log(`[TWILIO] Sending template message`);
  console.log(`[TWILIO] From: ${formattedFrom}`);
  console.log(`[TWILIO] To: ${formattedTo}`);
  console.log(`[TWILIO] ContentSid: ${contentSid}`);
  console.log(`[TWILIO] ContentVariables: ${JSON.stringify(contentVariables)}`);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('From', formattedFrom);
  formData.append('To', formattedTo);
  formData.append('ContentSid', contentSid);
  formData.append('ContentVariables', JSON.stringify(contentVariables));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[TWILIO ERROR] Status: ${response.status}`, data);
      return { 
        success: false, 
        error: data.message || `Twilio API error: ${response.status}` 
      };
    }

    console.log(`[TWILIO SUCCESS] Message SID: ${data.sid}, Status: ${data.status}`);
    return { success: true, data };
  } catch (error) {
    console.error('[TWILIO EXCEPTION]', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('='.repeat(50));
  console.log('[whatsapp-test-safe] Request received');
  console.log(`[CONFIG] Allowed number: ${ALLOWED_TEST_NUMBER}`);
  console.log(`[CONFIG] Default template: ${DEFAULT_TEMPLATE_SID}`);

  try {
    const { to, contentSid, contentVariables } = await req.json();

    // Validate required fields
    if (!to) {
      console.error('[VALIDATION ERROR] Missing "to" field');
      return new Response(
        JSON.stringify({ error: 'Missing required field: to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Check allowlist
    if (!isNumberAllowed(to)) {
      console.warn(`[SECURITY BLOCKED] Attempted to send to unauthorized number: ${to}`);
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden: This number is not in the test allowlist',
          allowed: ALLOWED_TEST_NUMBER.replace('whatsapp:', ''),
          requested: to
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ALLOWLIST] Number approved, proceeding with send');

    // Use provided contentSid or default
    const templateSid = contentSid || DEFAULT_TEMPLATE_SID;
    
    if (!templateSid) {
      console.error('[VALIDATION ERROR] No template SID provided and no default configured');
      return new Response(
        JSON.stringify({ error: 'Missing contentSid and no default template configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default content variables if not provided
    const variables = contentVariables || { "1": "Test message from Favoron" };

    // Send the message
    const result = await sendWhatsAppTemplate(to, templateSid, variables);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'WhatsApp template message sent successfully',
        messageSid: result.data?.sid,
        status: result.data?.status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[HANDLER ERROR]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
