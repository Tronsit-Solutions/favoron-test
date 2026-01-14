import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template SIDs mapping - add more templates here as they get approved
// 🧪 TESTING MODE - Solo enviar a números en whitelist
const TESTING_MODE = true;
const ALLOWED_TEST_NUMBERS = [
  "+34699591457", // Número de prueba autorizado
];

const TEMPLATE_SIDS: Record<string, string | undefined> = {
  welcome: Deno.env.get("TWILIO_CONTENT_SID_WELCOME"),
  quote_received: Deno.env.get("TWILIO_CONTENT_SID_QUOTE_RECEIVED"),
  package_assigned: Deno.env.get("TWILIO_CONTENT_SID_PACKAGE_ASSIGNED"),
};

// Verificar si el número está en la whitelist
const isNumberAllowed = (phone: string): boolean => {
  if (!TESTING_MODE) return true;
  const normalized = normalizePhoneNumber(phone);
  return ALLOWED_TEST_NUMBERS.some(allowed => 
    normalized === allowed || normalized.replace(/\s/g, '') === allowed
  );
};

interface WhatsAppTemplateRequest {
  user_id?: string;
  phone_number?: string;
  template_id?: string; // Optional - if not provided, will skip gracefully
  variables?: Record<string, string>;
  // Legacy fields (for backwards compatibility - will be skipped)
  title?: string;
  message?: string;
  type?: string;
  priority?: string;
}

// Normalize phone number to E.164 format
const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");
  
  // Ensure it starts with +
  if (!cleaned.startsWith("+")) {
    // Assume Guatemala if 8 digits
    if (cleaned.length === 8) {
      cleaned = "+502" + cleaned;
    } else if (cleaned.startsWith("502") && cleaned.length === 11) {
      cleaned = "+" + cleaned;
    } else {
      cleaned = "+" + cleaned;
    }
  }
  
  return cleaned;
};

// Send WhatsApp using Content Template API
const sendWhatsAppTemplate = async (
  to: string,
  contentSid: string,
  contentVariables: Record<string, string>
): Promise<{ success: boolean; data?: any; error?: string; errorCode?: number }> => {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM");

  if (!accountSid || !authToken || !fromNumber) {
    console.error("❌ Missing Twilio credentials");
    return { success: false, error: "Missing Twilio credentials" };
  }

  const normalizedTo = normalizePhoneNumber(to);
  const fromWhatsApp = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;
  const toWhatsApp = `whatsapp:${normalizedTo}`;
  
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  console.log("📤 Sending WhatsApp template:", {
    from: fromWhatsApp,
    to: toWhatsApp,
    contentSid,
    variables: contentVariables,
  });

  const body = new URLSearchParams({
    From: fromWhatsApp,
    To: toWhatsApp,
    ContentSid: contentSid,
    ContentVariables: JSON.stringify(contentVariables),
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorCode = data.code || response.status;
      const errorMessage = getTwilioErrorMessage(errorCode, data.message);
      console.error("❌ Twilio error:", { 
        status: response.status, 
        code: errorCode, 
        message: data.message,
        moreInfo: data.more_info 
      });
      return { success: false, error: errorMessage, errorCode };
    }

    console.log("✅ WhatsApp sent successfully:", { sid: data.sid, status: data.status });
    return { success: true, data };
  } catch (error: any) {
    console.error("❌ Network error sending WhatsApp:", error);
    return { success: false, error: error.message };
  }
};

// Get human-readable error message for common Twilio errors
const getTwilioErrorMessage = (errorCode: number, defaultMessage: string): string => {
  const errorMessages: Record<number, string> = {
    20003: "Credenciales inválidas (Account SID o Auth Token)",
    21211: "Número de teléfono inválido",
    21608: "Número no registrado en WhatsApp o formato inválido",
    63007: "Usuario bloqueó el número de WhatsApp",
    63016: "Template no aprobado o ventana de 24h expirada",
    63018: "Límite de mensajes alcanzado para este número",
  };
  return errorMessages[errorCode] || defaultMessage;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, phone_number, template_id, variables } = await req.json() as WhatsAppTemplateRequest;

    console.log("📱 WhatsApp notification request:", { user_id, phone_number, template_id, variables });

    // Handle legacy API calls gracefully (without template_id)
    // These are calls that haven't been migrated yet - skip them without error
    if (!template_id) {
      console.log("⏭️ Legacy API call detected (no template_id), skipping:", { 
        user_id, 
        title: (req as any).title,
        type: (req as any).type 
      });
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true, 
          reason: "Legacy API call - WhatsApp templates pending migration" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate template exists
    const contentSid = TEMPLATE_SIDS[template_id];
    if (!contentSid) {
      console.error("❌ Template not found:", template_id);
      return new Response(
        JSON.stringify({ success: false, error: `Template '${template_id}' not configured` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get phone number (from request or from user profile)
    let targetPhone = phone_number;
    let userFullName: string | null = null;

    if (user_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("phone_number, country_code, whatsapp_notifications, first_name, last_name")
        .eq("id", user_id)
        .single();

      if (profileError || !profile) {
        console.error("❌ Could not get user profile:", profileError);
        return new Response(
          JSON.stringify({ success: false, error: "User profile not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract user's full name for template variables
      if (profile.first_name) {
        userFullName = profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile.first_name;
      }
      console.log("👤 User name extracted:", userFullName);

      // Check if user has WhatsApp notifications enabled
      if (profile.whatsapp_notifications === false) {
        console.log("⏭️ WhatsApp notifications disabled for user:", user_id);
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: "WhatsApp notifications disabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Only use profile phone if no direct phone_number was provided
      if (!targetPhone) {
        if (!profile.phone_number) {
          console.log("⏭️ No phone number for user:", user_id);
          return new Response(
            JSON.stringify({ success: false, error: "User has no phone number" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Combine country code and phone number if both exist
        if (profile.country_code && profile.phone_number) {
          targetPhone = `${profile.country_code}${profile.phone_number}`;
        } else {
          targetPhone = profile.phone_number;
        }
      }
    }

    if (!targetPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "No phone number provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🧪 Verificar whitelist en modo testing
    if (!isNumberAllowed(targetPhone)) {
      console.log("⏭️ Testing mode: Número no está en whitelist:", targetPhone);
      console.log("🧪 Números permitidos:", ALLOWED_TEST_NUMBERS);
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true, 
          reason: `Testing mode: solo se permite enviar a números autorizados`,
          targetPhone: targetPhone
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Número autorizado para envío:", targetPhone);

    // Enrich variables with user's name automatically
    // Variable "1" is used for the user's name in most templates
    const enrichedVariables: Record<string, string> = {};
    
    // Set user's name as variable "1" if we have it
    if (userFullName) {
      enrichedVariables["1"] = userFullName;
    }
    
    // Merge with explicitly passed variables (explicit ones take precedence)
    const finalVariables = { ...enrichedVariables, ...(variables || {}) };
    
    console.log("📝 Final template variables:", finalVariables);

    // Send the WhatsApp template message
    const result = await sendWhatsAppTemplate(targetPhone, contentSid, finalVariables);

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error, errorCode: result.errorCode }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
