import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create Supabase client for this function
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface EmailNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl?: string;
  metadata?: any;
}

const getEmailTemplate = (title: string, message: string, type: string, actionUrl?: string) => {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
      .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
      .content { padding: 40px 20px; }
      .notification-type { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px; }
      .title { font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
      .message { font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-bottom: 32px; }
      .action-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; transition: transform 0.2s; }
      .action-button:hover { transform: translateY(-2px); }
      .footer { background-color: #f8f9fa; padding: 30px 20px; text-align: center; color: #6c757d; font-size: 14px; }
    </style>
  `;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'package': return 'background-color: #e3f2fd; color: #1976d2;';
      case 'trip': return 'background-color: #f3e5f5; color: #7b1fa2;';
      case 'payment': return 'background-color: #e8f5e8; color: #388e3c;';
      case 'approval': return 'background-color: #fff3e0; color: #f57c00;';
      case 'quote': return 'background-color: #fce4ec; color: #c2185b;';
      case 'delivery': return 'background-color: #e0f2f1; color: #00695c;';
      default: return 'background-color: #f5f5f5; color: #757575;';
    }
  };

  const actionButton = actionUrl ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${actionUrl}" class="action-button">Ver Detalles</a>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Favoron</h1>
        </div>
        <div class="content">
          <div class="notification-type" style="${getTypeColor(type)}">
            ${type.toUpperCase()}
          </div>
          <h2 class="title">${title}</h2>
          <div class="message">${message}</div>
          ${actionButton}
        </div>
        <div class="footer">
          <p>Este es un mensaje automático de Favoron. No responder a este correo.</p>
          <p>© 2024 Favoron. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, message, type, priority, actionUrl, metadata }: EmailNotificationRequest = await req.json();

    console.log('=== EMAIL NOTIFICATION REQUEST ===');
    console.log('User ID:', userId);
    console.log('Title:', title);
    console.log('Type:', type);
    console.log('Priority:', priority);
    console.log('Action URL:', actionUrl);
    
    // Check if API key is configured
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured in environment');
      return new Response(
        JSON.stringify({ error: 'Email service not configured - API key missing' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log('✅ RESEND_API_KEY found, length:', apiKey.length);
    console.log('✅ API Key starts with:', apiKey.substring(0, 10) + '...');

    // Get user email and preferences from profiles
    console.log('📧 Fetching user profile for email:', userId);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, email_notifications, email_notification_preferences, first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('✅ Profile found:', {
      email: profile.email ? '***@***.***' : 'NO EMAIL',
      emailNotifications: profile.email_notifications,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name'
    });

    if (!profile.email) {
      console.log('❌ User has no email address');
      return new Response(
        JSON.stringify({ error: 'User has no email address' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile.email_notifications) {
      console.log('⚠️ User has email notifications disabled');
      return new Response(
        JSON.stringify({ message: 'User has email notifications disabled' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check specific notification type preference
    const preferences = profile.email_notification_preferences || {};
    console.log('📋 User preferences:', preferences);
    
    if (!preferences[type]) {
      console.log(`⚠️ User has disabled ${type} notifications`);
      return new Response(
        JSON.stringify({ message: `User has disabled ${type} notifications` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('✅ All email checks passed, proceeding to send email');

    const userName = profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Usuario';
    const personalizedMessage = message.replace(/Usuario/g, userName);

    const emailHtml = getEmailTemplate(title, personalizedMessage, type, actionUrl);

    console.log('🔧 Initializing Resend client...');
    console.log('📧 Attempting to send email to:', profile.email ? '***@***.***' : 'NO EMAIL');

    const emailResponse = await resend.emails.send({
      from: "Favoron <notifications@resend.dev>",
      to: [profile.email],
      subject: `Favoron - ${title}`,
      html: emailHtml,
    });

    console.log("📬 Resend API Response:", JSON.stringify(emailResponse, null, 2));
    
    if (emailResponse.error) {
      console.error('❌ Resend API returned an error:', emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send email',
          details: emailResponse.error 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Email sent successfully! ID:", emailResponse.data?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      sentTo: profile.email 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);