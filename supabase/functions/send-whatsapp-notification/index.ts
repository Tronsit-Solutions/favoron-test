import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATE_SIDS: Record<string, string | undefined> = {
  welcome: Deno.env.get("TWILIO_CONTENT_SID_WELCOME"),
  welcome_v2: Deno.env.get("TWILIO_CONTENT_SID_WELCOME_V2"),
  quote_received: Deno.env.get("TWILIO_CONTENT_SID_QUOTE_RECEIVED"),
  quote_received_v2: Deno.env.get("TWILIO_CONTENT_SID_QUOTE_RECEIVED_V2"),
  package_assigned: Deno.env.get("TWILIO_CONTENT_SID_PACKAGE_ASSIGNED"),
};

// Get testing mode configuration from database
interface TestingConfig {
  enabled: boolean;
  whitelist: string[];
}

const getTestingConfig = async (): Promise<TestingConfig> => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'whatsapp_testing_mode')
      .single();

    if (error || !data) {
      console.log("⚠️ No testing config found, defaulting to TESTING_MODE = true");
      return { enabled: true, whitelist: [] };
    }

    const config = data.value as TestingConfig;
    console.log("🔧 Testing config loaded:", config);
    return config;
  } catch (err) {
    console.error("❌ Error loading testing config:", err);
    return { enabled: true, whitelist: [] };
  }
};

// Verificar si el número está en la whitelist
const isNumberAllowed = (phone: string, config: TestingConfig): boolean => {
  if (!config.enabled) return true;
  const normalized = normalizePhoneNumber(phone);
  return config.whitelist.some(allowed => 
    normalized === allowed || normalized.replace(/\s/g, '') === allowed
  );
};

interface WhatsAppTemplateRequest {
  user_id?: string;
  phone_number?: string;
  template_id?: string;
  variables?: Record<string, string>;
  title?: string;
  message?: string;
  type?: string;
  priority?: string;
}

// Normalize phone number to E.164 format
const normalizePhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/[^\d+]/g, "");
  
  if (!cleaned.startsWith("+")) {
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

// Log notification to database
const logNotification = async (
  userId: string | null,
  phoneNumber: string,
  userName: string | null,
  templateId: string,
  variables: Record<string, string>,
  status: 'sent' | 'failed' | 'skipped',
  twilioSid: string | null,
  errorMessage: string | null,
  errorCode: number | null,
  skipReason: string | null,
  responseData: any
) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error } = await supabase.from('whatsapp_notification_logs').insert({
      user_id: userId,
      phone_number: phoneNumber,
      user_name: userName,
      template_id: templateId,
      template_variables: variables,
      status,
      twilio_sid: twilioSid,
      error_message: errorMessage,
      error_code: errorCode,
      skip_reason: skipReason,
      response_data: responseData
    });

    if (error) {
      console.error("❌ Error logging notification:", error);
    } else {
      console.log("📝 Notification logged:", { status, templateId, phoneNumber: phoneNumber.slice(0, 8) + '...' });
    }
  } catch (err) {
    console.error("❌ Failed to log notification:", err);
  }
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
  });

  if (contentVariables && Object.keys(contentVariables).length > 0) {
    body.append('ContentVariables', JSON.stringify(contentVariables));
    console.log(`📝 ContentVariables included: ${JSON.stringify(contentVariables)}`);
  } else {
    console.log(`📝 ContentVariables omitted (template has no variables)`);
  }

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, phone_number, template_id, variables } = await req.json() as WhatsAppTemplateRequest;

    console.log("📱 WhatsApp notification request:", { user_id, phone_number, template_id, variables });

    // Load testing mode configuration from database
    const testingConfig = await getTestingConfig();

    // Handle legacy API calls gracefully
    if (!template_id) {
      console.log("⏭️ Legacy API call detected (no template_id), skipping");
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
      await logNotification(
        user_id || null,
        phone_number || 'unknown',
        null,
        template_id,
        variables || {},
        'failed',
        null,
        `Template '${template_id}' not configured`,
        null,
        null,
        null
      );
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
        await logNotification(
          user_id,
          phone_number || 'unknown',
          null,
          template_id,
          variables || {},
          'failed',
          null,
          "User profile not found",
          null,
          null,
          null
        );
        return new Response(
          JSON.stringify({ success: false, error: "User profile not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (profile.first_name) {
        userFullName = profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile.first_name;
      }
      console.log("👤 User name extracted:", userFullName);

      // Check if user has WhatsApp notifications enabled
      if (profile.whatsapp_notifications === false) {
        console.log("⏭️ WhatsApp notifications disabled for user:", user_id);
        const skipReason = "WhatsApp notifications disabled by user";
        await logNotification(
          user_id,
          profile.phone_number || phone_number || 'unknown',
          userFullName,
          template_id,
          variables || {},
          'skipped',
          null,
          null,
          null,
          skipReason,
          null
        );
        return new Response(
          JSON.stringify({ success: true, skipped: true, reason: skipReason }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!targetPhone) {
        if (!profile.phone_number) {
          console.log("⏭️ No phone number for user:", user_id);
          const skipReason = "User has no phone number";
          await logNotification(
            user_id,
            'unknown',
            userFullName,
            template_id,
            variables || {},
            'skipped',
            null,
            null,
            null,
            skipReason,
            null
          );
          return new Response(
            JSON.stringify({ success: false, error: skipReason }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (profile.country_code && profile.phone_number) {
          targetPhone = `${profile.country_code}${profile.phone_number}`;
        } else {
          targetPhone = profile.phone_number;
        }
      }
    }
    
    // If no name from profile, try to get it from variables (for test messages)
    if (!userFullName && variables?.["1"]) {
      userFullName = variables["1"];
      console.log("👤 User name from variables:", userFullName);
    }

    if (!targetPhone) {
      await logNotification(
        user_id || null,
        'unknown',
        userFullName,
        template_id,
        variables || {},
        'failed',
        null,
        "No phone number provided",
        null,
        null,
        null
      );
      return new Response(
        JSON.stringify({ success: false, error: "No phone number provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check testing mode whitelist
    if (!isNumberAllowed(targetPhone, testingConfig)) {
      console.log("⏭️ Testing mode: Número no está en whitelist:", targetPhone);
      const skipReason = `Testing mode: solo se permite enviar a números autorizados`;
      await logNotification(
        user_id || null,
        targetPhone,
        userFullName,
        template_id,
        variables || {},
        'skipped',
        null,
        null,
        null,
        skipReason,
        { testing_mode: true, allowed_numbers: testingConfig.whitelist }
      );
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true, 
          reason: skipReason,
          targetPhone: targetPhone
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Número autorizado para envío:", targetPhone);

    // Enrich variables with user's name automatically
    const enrichedVariables: Record<string, string> = {};
    if (userFullName) {
      enrichedVariables["1"] = userFullName;
    }
    const finalVariables = { ...enrichedVariables, ...(variables || {}) };
    console.log("📝 Final template variables:", finalVariables);

    // Send the WhatsApp template message
    const result = await sendWhatsAppTemplate(targetPhone, contentSid, finalVariables);

    // Log the result
    await logNotification(
      user_id || null,
      targetPhone,
      userFullName,
      template_id,
      finalVariables,
      result.success ? 'sent' : 'failed',
      result.data?.sid || null,
      result.success ? null : result.error || null,
      result.success ? null : result.errorCode || null,
      null,
      result.data || null
    );

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
