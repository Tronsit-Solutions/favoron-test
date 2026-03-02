import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  user_id: string;
  email: string;
  first_name?: string;
  ab_test_group: 'A' | 'B';
}

// Grupo A: Tono familiar y cercano
const getEmailTemplateA = (firstName: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gracias por sumarte a Favorón</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header con logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px;">¡Hola${firstName ? `, ${firstName}` : ''}! 👋</h1>
              <p style="color: #bfdbfe; font-size: 16px; margin: 0;">Bienvenido/a a Favorón</p>
            </td>
          </tr>
          
          <!-- Contenido principal -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong>Gracias por sumarte a Favorón.</strong> Somos un proyecto joven, pero con un objetivo claro: conectar a quienes viajan desde cualquier parte del mundo con quienes buscan recibir productos en Guatemala.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Todavía estamos creciendo, y por eso cada nuevo usuario —como tú— nos motiva a seguir mejorando. Si tienes dudas, ideas, o simplemente quieres saber cómo funciona, escríbenos. Estamos aquí para ayudarte.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Para agradecerte, te dejamos un código con <strong>5% de descuento</strong> en tu primera solicitud:
              </p>
              
              <!-- Código de descuento -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px 40px; display: inline-block;">
                      <p style="color: #ffffff; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Tu código de descuento</p>
                      <p style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 3px;">GRACIAS5</p>
                      <p style="color: #d1fae5; font-size: 12px; margin: 8px 0 0;">5% de descuento en tu primera solicitud</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="https://favoron.app/dashboard" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                      Explorar Favorón →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                ¡Nos vemos dentro!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 30px 40px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">
                <strong>El equipo de Favorón</strong>
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ¿Dudas? Escríbenos a <a href="mailto:hola@favoron.app" style="color: #2563eb;">hola@favoron.app</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Grupo B: Tono con datos y estadísticas
const getEmailTemplateB = (firstName: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ya somos 600+ en Favorón 🚀</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header con logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px;">¡Bienvenido/a${firstName ? `, ${firstName}` : ''}! 🚀</h1>
              <p style="color: #c4b5fd; font-size: 16px; margin: 0;">Ya eres parte de nuestra comunidad</p>
            </td>
          </tr>
          
          <!-- Contenido principal -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong>Ya somos más de 600 personas usando Favorón</strong> para traer productos desde cualquier parte del mundo hasta Guatemala de forma segura y accesible.
              </p>
              
              <!-- Stats Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: #10b981; font-size: 32px; font-weight: bold; margin: 0;">700+</p>
                      <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0;">Solicitudes recibidas</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: #2563eb; font-size: 32px; font-weight: bold; margin: 0;">200+</p>
                      <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0;">Paquetes entregados</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: #d97706; font-size: 32px; font-weight: bold; margin: 0;">Q22,000</p>
                      <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0;">Propinas a viajeros</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 10px;">
                    <div style="background-color: #fce7f3; border-radius: 12px; padding: 20px; text-align: center;">
                      <p style="color: #db2777; font-size: 32px; font-weight: bold; margin: 0;">600+</p>
                      <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0;">Usuarios activos</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Y queremos celebrar tu llegada con un <strong>5% de descuento</strong> en tu primera solicitud:
              </p>
              
              <!-- Código de descuento -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px 40px; display: inline-block;">
                      <p style="color: #ffffff; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Tu código de descuento</p>
                      <p style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 3px;">GRACIAS5</p>
                      <p style="color: #d1fae5; font-size: 12px; margin: 8px 0 0;">5% de descuento en tu primera solicitud</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="https://favoron.app/dashboard" style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                      Hacer mi primera solicitud →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                ¡Gracias por confiar en nosotros!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 30px 40px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px;">
                <strong>El equipo de Favorón</strong>
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ¿Dudas? Escríbenos a <a href="mailto:hola@favoron.app" style="color: #7c3aed;">hola@favoron.app</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email, first_name, ab_test_group }: WelcomeEmailRequest = await req.json();

    console.log(`📧 Sending welcome email to ${email} (Group ${ab_test_group})`);

    // Validate required fields
    if (!email || !ab_test_group) {
      throw new Error("Missing required fields: email and ab_test_group");
    }

    // Select template based on A/B group
    const subject = ab_test_group === 'A' 
      ? 'Gracias por sumarte a Favorón' 
      : 'Ya somos 600+ en Favorón 🚀';
    
    const html = ab_test_group === 'A' 
      ? getEmailTemplateA(first_name || '')
      : getEmailTemplateB(first_name || '');

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Lucas de Favoron <lucas@favoron.app>",
      replyTo: "lucas@favoron.app",
      to: [email],
      subject: subject,
      html: html,
    });

    console.log(`✅ Welcome email sent successfully to ${email}:`, emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Welcome email (Group ${ab_test_group}) sent to ${email}`,
        email_id: emailResponse?.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("❌ Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
