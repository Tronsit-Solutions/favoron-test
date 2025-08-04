import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== EMAIL TEST FUNCTION STARTED ===');
    
    const { email }: TestEmailRequest = await req.json();
    console.log('Test email requested for:', email ? '***@***.***' : 'NO EMAIL PROVIDED');

    // Check if API key is configured
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'RESEND_API_KEY not configured',
          details: 'The API key is missing from Supabase secrets'
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log('✅ RESEND_API_KEY found, length:', apiKey.length);
    console.log('✅ API Key starts with:', apiKey.substring(0, 10) + '...');

    if (!email) {
      console.error('❌ No email provided in request');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email address is required' 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('🔧 Initializing Resend client...');
    const resend = new Resend(apiKey);

    console.log('📧 Attempting to send test email...');
    const emailResponse = await resend.emails.send({
      from: "TravelPack Test <notifications@resend.dev>",
      to: [email],
      subject: "🧪 TravelPack - Test Email",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px;">
            <h1 style="color: white; margin: 0;">🧪 Test Email</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
            <h2>¡Email funcionando correctamente!</h2>
            <p>Este es un email de prueba de TravelPack.</p>
            <p><strong>Hora de envío:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Estado:</strong> ✅ Configuración exitosa</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">
              Si recibes este email, significa que la configuración de Resend está funcionando correctamente.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('📬 Resend API Response:', JSON.stringify(emailResponse, null, 2));

    if (emailResponse.error) {
      console.error('❌ Resend API Error:', emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Resend API error',
          details: emailResponse.error,
          apiKeyLength: apiKey.length
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', emailResponse.data?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Test email sent successfully',
      emailId: emailResponse.data?.id,
      sentTo: email,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("❌ CRITICAL ERROR in test-email function:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Unexpected error occurred',
        details: error.message,
        type: error.name
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);