import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BanRequest {
  userId: string;
  duration: 'permanent' | '24h' | '7d' | '30d' | 'custom';
  customDate?: string;
  reason?: string;
  action: 'ban' | 'unban';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid user');
    }

    // Check if user has admin role - filter specifically for admin to avoid multiple rows
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    console.log('Role check:', { userId: user.id, roleData, roleError });

    if (roleError) {
      console.error('Role check error:', roleError);
      throw new Error('Unauthorized: Failed to verify admin role');
    }

    if (!roleData) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Parse request
    const { userId, duration, customDate, reason, action }: BanRequest = await req.json();

    console.log('Ban request:', { userId, duration, action, reason });

    // Create admin client
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    let bannedUntil: string | null = null;
    let durationLabel = '';

    if (action === 'ban') {
      // Prevent self-ban
      if (userId === user.id) {
        throw new Error('Cannot ban yourself');
      }

      // Calculate banned_until based on duration
      switch (duration) {
        case 'permanent':
          bannedUntil = 'infinity';
          durationLabel = 'permanente';
          break;
        case '24h':
          bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          durationLabel = '24 horas';
          break;
        case '7d':
          bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          durationLabel = '7 días';
          break;
        case '30d':
          bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          durationLabel = '30 días';
          break;
        case 'custom':
          if (!customDate) {
            throw new Error('Custom date required for custom duration');
          }
          bannedUntil = new Date(customDate).toISOString();
          durationLabel = `hasta ${new Date(customDate).toLocaleDateString('es-ES')}`;
          break;
        default:
          throw new Error('Invalid duration');
      }

      // Ban user using Admin API
      const { error: banError } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: bannedUntil === 'infinity' ? '876000h' : undefined, // ~100 years for permanent
        banned_until: bannedUntil === 'infinity' ? undefined : bannedUntil,
      });

      if (banError) {
        console.error('Ban error:', banError);
        throw new Error(`Failed to ban user: ${banError.message}`);
      }

      // Update profile with ban details
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          is_banned: true,
          banned_until: bannedUntil === 'infinity' ? null : bannedUntil,
          ban_reason: reason || 'No reason provided',
          banned_by: user.id,
          banned_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Log the action
      await adminClient.rpc('log_ban_action', {
        _target_user_id: userId,
        _admin_id: user.id,
        _action: 'banned',
        _duration: durationLabel,
        _reason: reason || 'No reason provided',
      });

      console.log('User banned successfully:', { userId, duration: durationLabel });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Usuario bloqueado ${durationLabel}`,
          bannedUntil,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'unban') {
      // Unban user using Admin API
      const { error: unbanError } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      });

      if (unbanError) {
        console.error('Unban error:', unbanError);
        throw new Error(`Failed to unban user: ${unbanError.message}`);
      }

      // Update profile
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          is_banned: false,
          banned_until: null,
          ban_reason: null,
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Log the action
      await adminClient.rpc('log_ban_action', {
        _target_user_id: userId,
        _admin_id: user.id,
        _action: 'unbanned',
        _duration: 'N/A',
        _reason: 'Unban action',
      });

      console.log('User unbanned successfully:', userId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Usuario desbloqueado exitosamente',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Ban user error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
