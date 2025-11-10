import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phone configuration - copied from src/lib/constants.ts
const PHONE_CONFIG = {
  DEFAULT_COUNTRY_CODE: '+502',
  SUPPORTED_COUNTRIES: [
    { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
    { code: '+1', country: 'USA/Canadá', flag: '🇺🇸' },
    { code: '+52', country: 'México', flag: '🇲🇽' },
    { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
    { code: '+504', country: 'Honduras', flag: '🇭🇳' },
    { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
    { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
    { code: '+507', country: 'Panamá', flag: '🇵🇦' },
  ]
};

interface ParsedPhone {
  countryCode: string;
  phoneNumber: string;
}

interface ProfileUpdate {
  user_id: string;
  original_phone: string;
  new_country_code: string;
  new_phone_number: string;
  status: 'success' | 'skipped' | 'error';
  reason?: string;
}

interface MigrationResult {
  success: boolean;
  dry_run: boolean;
  summary: {
    total_profiles: number;
    already_migrated: number;
    to_update: number;
    updated_successfully: number;
    errors: number;
  };
  updates: ProfileUpdate[];
  errors: ProfileUpdate[];
}

/**
 * Parse a full phone number into country code and phone number
 */
function parsePhoneNumber(fullPhone: string): ParsedPhone {
  if (!fullPhone) {
    return {
      countryCode: PHONE_CONFIG.DEFAULT_COUNTRY_CODE,
      phoneNumber: ''
    };
  }

  // Remove any spaces, dashes, or parentheses
  const cleanPhone = fullPhone.replace(/[\s\-\(\)]/g, '');
  
  // Find matching country code
  const supportedCountry = PHONE_CONFIG.SUPPORTED_COUNTRIES.find(country => 
    cleanPhone.startsWith(country.code)
  );

  if (supportedCountry) {
    return {
      countryCode: supportedCountry.code,
      phoneNumber: cleanPhone.substring(supportedCountry.code.length)
    };
  }

  // If no country code found, try to detect based on length
  // Guatemala: 8 digits
  if (cleanPhone.length === 8 && /^\d{8}$/.test(cleanPhone)) {
    return {
      countryCode: '+502',
      phoneNumber: cleanPhone
    };
  }

  // If starts with + but no match, assume it's just the number with default country code
  if (cleanPhone.startsWith('+')) {
    return {
      countryCode: PHONE_CONFIG.DEFAULT_COUNTRY_CODE,
      phoneNumber: cleanPhone.substring(1)
    };
  }

  // Default: assume it's just the number
  return {
    countryCode: PHONE_CONFIG.DEFAULT_COUNTRY_CODE,
    phoneNumber: cleanPhone
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      throw new Error('Unauthorized');
    }

    console.log('🔍 Authenticated user:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });

    // Verify the user is an admin
    console.log('🔍 Checking user roles for user_id:', user.id);
    
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log('🔍 User roles query result:', {
      user_id: user.id,
      roles: userRoles,
      error: roleError,
      roles_length: userRoles?.length || 0,
      roles_array: JSON.stringify(userRoles)
    });

    if (roleError) {
      console.error('❌ Error fetching user roles:', roleError);
      throw new Error('Error verifying user permissions');
    }

    const isAdmin = userRoles?.some(role => role.role === 'admin');
    
    console.log('🔍 Admin check:', {
      isAdmin,
      has_roles: userRoles && userRoles.length > 0,
      roles_found: userRoles?.map(r => r.role)
    });
    
    if (!isAdmin) {
      console.log('❌ User is not admin. User:', user.email, 'Roles:', userRoles);
      throw new Error('Only admins can run this migration');
    }

    console.log('✅ Admin verification passed for user:', user.email, '(', user.id, ')');

    // Parse request body
    const { dry_run = true } = await req.json();

    console.log(`🚀 Starting phone migration - Dry run: ${dry_run}`);

    // Fetch all profiles with phone numbers
    const { data: profiles, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, phone_number, country_code')
      .not('phone_number', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch profiles: ${fetchError.message}`);
    }

    console.log(`📊 Found ${profiles.length} profiles with phone numbers`);

    const updates: ProfileUpdate[] = [];
    const errors: ProfileUpdate[] = [];
    let alreadyMigrated = 0;
    let toUpdate = 0;
    let updatedSuccessfully = 0;

    // Process each profile
    for (const profile of profiles) {
      const original = profile.phone_number;

      try {
        // Check if already migrated
        // Already migrated if: country_code exists AND phone_number has no "+" or spaces
        if (
          profile.country_code &&
          profile.country_code.length > 0 &&
          !profile.phone_number.includes('+') &&
          !profile.phone_number.includes(' ') &&
          /^\d+$/.test(profile.phone_number)
        ) {
          alreadyMigrated++;
          updates.push({
            user_id: profile.id,
            original_phone: original,
            new_country_code: profile.country_code,
            new_phone_number: profile.phone_number,
            status: 'skipped',
            reason: 'Already migrated'
          });
          continue;
        }

        // Parse the phone number
        const parsed = parsePhoneNumber(profile.phone_number);

        // Validate parsed result
        if (!parsed.phoneNumber || parsed.phoneNumber.length < 4) {
          errors.push({
            user_id: profile.id,
            original_phone: original,
            new_country_code: parsed.countryCode,
            new_phone_number: parsed.phoneNumber,
            status: 'error',
            reason: 'Phone number too short or invalid'
          });
          continue;
        }

        toUpdate++;

        // Update the profile (if not dry run)
        if (!dry_run) {
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              country_code: parsed.countryCode,
              phone_number: parsed.phoneNumber,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);

          if (updateError) {
            errors.push({
              user_id: profile.id,
              original_phone: original,
              new_country_code: parsed.countryCode,
              new_phone_number: parsed.phoneNumber,
              status: 'error',
              reason: updateError.message
            });
            continue;
          }

          updatedSuccessfully++;
        }

        updates.push({
          user_id: profile.id,
          original_phone: original,
          new_country_code: parsed.countryCode,
          new_phone_number: parsed.phoneNumber,
          status: 'success'
        });

      } catch (error) {
        errors.push({
          user_id: profile.id,
          original_phone: original,
          new_country_code: '',
          new_phone_number: '',
          status: 'error',
          reason: error.message
        });
      }
    }

    const result: MigrationResult = {
      success: true,
      dry_run,
      summary: {
        total_profiles: profiles.length,
        already_migrated: alreadyMigrated,
        to_update: toUpdate,
        updated_successfully: dry_run ? 0 : updatedSuccessfully,
        errors: errors.length
      },
      updates: updates.slice(0, 50), // Limit to first 50 for readability
      errors
    };

    console.log(`✅ Migration completed - Summary:`, result.summary);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Migration error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
