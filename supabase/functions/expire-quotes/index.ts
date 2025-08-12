import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  console.log('🕒 Starting quote expiration check...');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Call the database function to expire old quotes
    const { data, error } = await supabase.rpc('expire_old_quotes');

    if (error) {
      console.error('❌ Error expiring quotes:', error);
      throw error;
    }

    console.log('✅ Quote expiration check completed successfully');

    // Also check for quotes expiring in the next 3 hours to send warnings
    const { data: soonToExpire, error: warningError } = await supabase
      .from('packages')
      .select(`
        id,
        user_id,
        item_description,
        quote_expires_at,
        matched_trip_id,
        trips:matched_trip_id (
          user_id
        )
      `)
      .eq('status', 'quote_sent')
      .not('quote_expires_at', 'is', null)
      .gte('quote_expires_at', new Date().toISOString())
      .lte('quote_expires_at', new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString());

    if (warningError) {
      console.error('❌ Error checking quotes expiring soon:', warningError);
    } else if (soonToExpire && soonToExpire.length > 0) {
      console.log(`⚠️ Found ${soonToExpire.length} quotes expiring in the next 3 hours`);

      // Send warning notifications for quotes expiring soon
      for (const pkg of soonToExpire) {
        const hoursLeft = Math.floor((new Date(pkg.quote_expires_at).getTime() - Date.now()) / (1000 * 60 * 60));
        
        // Notify shopper
        await supabase.rpc('create_notification', {
          _user_id: pkg.user_id,
          _title: '⏰ Tu cotización expira pronto',
          _message: `La cotización para "${pkg.item_description}" expira en ${hoursLeft} hora${hoursLeft !== 1 ? 's' : ''}. ¡Completa el pago pronto!`,
          _type: 'quote',
          _priority: 'high',
          _action_url: null,
          _metadata: {
            package_id: pkg.id,
            hours_left: hoursLeft,
            warning_type: 'expiring_soon'
          }
        });

        // Notify traveler if there's a matched trip
        if (pkg.matched_trip_id && pkg.trips?.user_id) {
          await supabase.rpc('create_notification', {
            _user_id: pkg.trips.user_id,
            _title: '⏰ Tu cotización expira pronto',
            _message: `Tu cotización para "${pkg.item_description}" expira en ${hoursLeft} hora${hoursLeft !== 1 ? 's' : ''}. El shopper debe completar el pago pronto.`,
            _type: 'quote',
            _priority: 'normal',
            _action_url: null,
            _metadata: {
              package_id: pkg.id,
              trip_id: pkg.matched_trip_id,
              hours_left: hoursLeft,
              warning_type: 'expiring_soon'
            }
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Quote expiration check completed',
        expiredCount: data?.expired_count || 0,
        warningsCount: soonToExpire?.length || 0
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('💥 Error in expire-quotes function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      }
    );
  }
});