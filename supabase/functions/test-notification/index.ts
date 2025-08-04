import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧪 Test notification function called');
    
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const { user_email, title, message } = await req.json();
    
    console.log('📧 Sending test email to:', user_email);
    
    const emailResponse = await resend.emails.send({
      from: "Favoron <noreply@favoron.app>",
      to: [user_email || "lucasfv7@gmail.com"],
      subject: title || "Test Notification",
      html: `<h1>${title || "Test"}</h1><p>${message || "Test message"}</p>`,
    });

    console.log("Email response:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);