
/**
 * Edge Function: log-client-error
 * Guarda errores de cliente en public.client_errors
 * Requiere secret: SUPABASE_SERVICE_ROLE_KEY
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const SUPABASE_URL = "https://dfhoduirmqbarjnspbdh.supabase.co";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SERVICE_ROLE_KEY) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY for log-client-error function");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const {
      route,
      url,
      referrer,
      message,
      name,
      type = "error",
      severity = "error",
      stack,
      browser,
      context,
      fingerprint,
      user_id: userIdFromBody,
      session_id: sessionId,
    } = body || {};

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Invalid payload: message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Intentar identificar usuario desde el token si no viene en el body
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    let resolvedUserId: string | null = userIdFromBody || null;
    if (!resolvedUserId && token && SERVICE_ROLE_KEY) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user?.id) {
        resolvedUserId = data.user.id;
      }
    }

    const insertPayload = {
      user_id: resolvedUserId,
      session_id: typeof sessionId === "string" ? sessionId : null,
      route: typeof route === "string" ? route : null,
      url: typeof url === "string" ? url : null,
      referrer: typeof referrer === "string" ? referrer : null,
      message,
      name: typeof name === "string" ? name : null,
      type: typeof type === "string" ? type : "error",
      severity: typeof severity === "string" ? severity : "error",
      stack: typeof stack === "string" ? stack : null,
      browser: browser && typeof browser === "object" ? browser : null,
      context: context && typeof context === "object" ? context : null,
      fingerprint: typeof fingerprint === "string" ? fingerprint : null,
    };

    const { error: insertError } = await supabaseAdmin.from("client_errors").insert(insertPayload);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to insert error log" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled in function:", e);
    return new Response(JSON.stringify({ error: "Unhandled error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
