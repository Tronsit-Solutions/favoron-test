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

    // Expire approved packages with passed delivery deadlines
    const { data: deadlineData, error: deadlineError } = await supabase.rpc('expire_approved_deadlines');
    if (deadlineError) {
      console.error('❌ Error expiring approved deadlines:', deadlineError);
    } else {
      console.log('✅ Approved deadline expiration completed:', deadlineData);
    }

    // Trigger shopper quote reminders at 12h and 1h before expiration
    const { error: remindersError } = await supabase.rpc('send_quote_reminders');
    if (remindersError) {
      console.error('❌ Error sending quote reminders:', remindersError);
    } else {
      console.log('✅ Quote reminders executed successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Quote expiration check completed',
        expiredCount: data?.expired_count || 0,
        deadlineExpiredCount: deadlineData?.expired_count || 0,
        remindersTriggered: true
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