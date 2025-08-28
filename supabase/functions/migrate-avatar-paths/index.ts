import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProfileWithAvatar {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
}

function createSlug(profile: ProfileWithAvatar): string {
  let slug = '';
  
  if (profile.username) {
    slug = profile.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
  } else if (profile.first_name || profile.last_name) {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    slug = fullName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
  } else {
    slug = 'usuario';
  }
  
  // Add short ID to prevent collisions
  const shortId = profile.id.substring(0, 8);
  return `${slug}-${shortId}`;
}

function extractOldPath(avatarUrl: string): string | null {
  try {
    const url = new URL(avatarUrl);
    // Extract path after /storage/v1/object/public/avatars/
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting avatar migration process...');
    
    // Authenticate via JWT and require admin role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';

    // Create a user-scoped client to read the current user and roles
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('❌ Unauthorized: missing or invalid JWT', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure caller is an admin
    const { data: adminCheck, error: roleError } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .limit(1);

    if (roleError) {
      console.error('❌ Error checking admin role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Role check failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminCheck || adminCheck.length === 0) {
      console.error('❌ Forbidden: user is not an admin');
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for options
    const body = await req.json().catch(() => ({}));
    const { dryRun = true, batchSize = 10 } = body;

    console.log(`📋 Migration mode: ${dryRun ? 'DRY RUN' : 'LIVE'}, batch size: ${batchSize}`);

    // Initialize Supabase client with service role (admin operations)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get all profiles with avatar URLs
    console.log('📥 Fetching profiles with avatars...');
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, username, avatar_url')
      .not('avatar_url', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError);
      throw fetchError;
    }

    console.log(`👥 Found ${profiles?.length || 0} profiles with avatars`);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No profiles with avatars found',
          migrated: 0,
          errors: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      migrated: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    // Process profiles in batches
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(profiles.length / batchSize)}`);

      for (const profile of batch) {
        try {
          if (!profile.avatar_url) continue;

          // Extract old path from avatar URL
          const oldPath = extractOldPath(profile.avatar_url);
          if (!oldPath) {
            console.log(`⚠️  Could not extract path from URL: ${profile.avatar_url}`);
            results.errors.push(`Profile ${profile.id}: Invalid avatar URL format`);
            continue;
          }

          // Create new slug-based path
          const slug = createSlug(profile);
          const fileExt = oldPath.split('.').pop() || 'jpg';
          const newPath = `${slug}/avatar.${fileExt}`;

          console.log(`📁 ${profile.id}: ${oldPath} → ${newPath}`);

          if (!dryRun) {
            // Copy file to new location
            const { data: copyData, error: copyError } = await supabase.storage
              .from('avatars')
              .copy(oldPath, newPath);

            if (copyError) {
              console.error(`❌ Error copying file for ${profile.id}:`, copyError);
              results.errors.push(`Profile ${profile.id}: Copy failed - ${copyError.message}`);
              continue;
            }

            // Get new public URL
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(newPath);

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ avatar_url: publicUrl })
              .eq('id', profile.id);

            if (updateError) {
              console.error(`❌ Error updating profile ${profile.id}:`, updateError);
              results.errors.push(`Profile ${profile.id}: Update failed - ${updateError.message}`);
              continue;
            }

            // Delete old file
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove([oldPath]);

            if (deleteError) {
              console.log(`⚠️  Could not delete old file ${oldPath}:`, deleteError.message);
              // Don't treat this as a fatal error
            }

            console.log(`✅ Successfully migrated ${profile.id}`);
          }

          results.migrated++;
          results.details.push({
            profileId: profile.id,
            oldPath,
            newPath,
            slug
          });

        } catch (error) {
          console.error(`💥 Unexpected error processing ${profile.id}:`, error);
          results.errors.push(`Profile ${profile.id}: ${error.message}`);
        }
      }
    }

    console.log(`🎉 Migration complete! Processed: ${results.migrated}, Errors: ${results.errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        migrated: results.migrated,
        errors: results.errors,
        details: dryRun ? results.details : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Migration failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Migration failed', 
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});