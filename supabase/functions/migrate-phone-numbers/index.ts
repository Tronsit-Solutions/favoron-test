import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phone configuration - expanded with all detected country codes
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
    // Additional codes detected in database
    { code: '+34', country: 'España', flag: '🇪🇸' },
    { code: '+49', country: 'Alemania', flag: '🇩🇪' },
    { code: '+39', country: 'Italia', flag: '🇮🇹' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+501', country: 'Belice', flag: '🇧🇿' },
    { code: '+55', country: 'Brasil', flag: '🇧🇷' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+51', country: 'Perú', flag: '🇵🇪' },
    { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
    { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  ]
};

interface ParsedPhone {
  countryCode: string;
  phoneNumber: string;
}

interface ProfileUpdate {
  user_id: string;
  original_phone: string;
  original_country_code?: string;
  new_country_code: string;
  new_phone_number: string;
  status: 'success' | 'skipped' | 'error';
  reason?: string;
  problem_type?: string;
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
 * Check if a profile is already correctly migrated
 */
function isAlreadyMigrated(profile: { phone_number: string; country_code: string | null }): boolean {
  return (
    // Has valid country code
    !!profile.country_code &&
    profile.country_code.startsWith('+') &&
    profile.country_code.length >= 2 &&
    // Phone number is digits only (no + or spaces or dashes)
    !!profile.phone_number &&
    /^\d+$/.test(profile.phone_number) &&
    // Reasonable length (7-15 digits)
    profile.phone_number.length >= 7 &&
    profile.phone_number.length <= 15
  );
}

/**
 * Detect problem type for logging
 */
function detectProblemType(phone: string, countryCode: string | null): string {
  const hasSpecialChars = /[\s\-\(\)]/.test(phone);
  const hasPlus = phone.startsWith('+');
  const hasDuplicateCode = hasPlus && countryCode && countryCode.startsWith('+');
  
  if (hasDuplicateCode) {
    return 'CODIGO_DUPLICADO';
  }
  if (hasSpecialChars) {
    return 'CARACTERES_ESPECIALES';
  }
  
  const cleanPhone = phone.replace(/[\s\-\(\)+]/g, '');
  if (cleanPhone.length < 7) {
    return 'MUY_CORTO';
  }
  if (cleanPhone.length > 15) {
    return 'MUY_LARGO';
  }
  
  return 'FORMATO_INCORRECTO';
}

/**
 * Parse a full phone number into country code and phone number
 * Handles: duplicate codes, special characters, various formats
 */
function parsePhoneNumber(fullPhone: string, existingCountryCode?: string | null): ParsedPhone {
  if (!fullPhone) {
    return {
      countryCode: existingCountryCode || PHONE_CONFIG.DEFAULT_COUNTRY_CODE,
      phoneNumber: ''
    };
  }

  // 1. Clean special characters: spaces, dashes, parentheses
  let cleanPhone = fullPhone.replace(/[\s\-\(\)]/g, '');
  
  console.log('📱 Parsing phone:', {
    original: fullPhone,
    cleaned: cleanPhone,
    existingCountryCode
  });

  // 2. If phone starts with +, extract country code from it
  if (cleanPhone.startsWith('+')) {
    // Sort by length descending to match more specific codes first (e.g., +502 before +5)
    const sortedCountries = [...PHONE_CONFIG.SUPPORTED_COUNTRIES].sort(
      (a, b) => b.code.length - a.code.length
    );
    
    for (const country of sortedCountries) {
      if (cleanPhone.startsWith(country.code)) {
        const phoneNumber = cleanPhone.substring(country.code.length);
        console.log('✅ Matched country code:', {
          code: country.code,
          country: country.country,
          phoneNumber
        });
        return {
          countryCode: country.code,
          phoneNumber
        };
      }
    }
    
    // If has + but no known code match, try to extract code dynamically
    // Common pattern: +XXX or +XX followed by digits
    const codeMatch = cleanPhone.match(/^\+(\d{1,4})/);
    if (codeMatch) {
      const potentialCode = '+' + codeMatch[1];
      const phoneNumber = cleanPhone.substring(potentialCode.length);
      console.log('⚠️ Unknown country code, extracted:', {
        code: potentialCode,
        phoneNumber
      });
      return {
        countryCode: potentialCode,
        phoneNumber
      };
    }
  }

  // 3. No + prefix - use existing country code if available
  if (existingCountryCode && existingCountryCode.startsWith('+')) {
    console.log('📞 Using existing country code:', existingCountryCode);
    return {
      countryCode: existingCountryCode,
      phoneNumber: cleanPhone
    };
  }

  // 4. Heuristic by length - Guatemala = 8 digits
  if (/^\d{8}$/.test(cleanPhone)) {
    console.log('🇬🇹 Detected Guatemala number by length (8 digits)');
    return {
      countryCode: '+502',
      phoneNumber: cleanPhone
    };
  }

  // 5. Default to Guatemala
  console.log('📌 Defaulting to Guatemala (+502)');
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
      email: user.email
    });

    // Verify the user is an admin
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error('❌ Error fetching user roles:', roleError);
      throw new Error('Error verifying user permissions');
    }

    const isAdmin = userRoles?.some(role => role.role === 'admin');
    
    if (!isAdmin) {
      console.log('❌ User is not admin:', user.email);
      throw new Error('Only admins can run this migration');
    }

    console.log('✅ Admin verification passed for:', user.email);

    // Parse request body
    const { dry_run = true } = await req.json();

    console.log(`🚀 Starting phone migration - Dry run: ${dry_run}`);

    // Fetch all profiles with phone numbers
    const { data: profiles, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, phone_number, country_code, first_name, last_name')
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
      const originalCode = profile.country_code;

      try {
        // Check if already correctly migrated
        if (isAlreadyMigrated(profile)) {
          alreadyMigrated++;
          updates.push({
            user_id: profile.id,
            original_phone: original,
            original_country_code: originalCode,
            new_country_code: profile.country_code!,
            new_phone_number: profile.phone_number,
            status: 'skipped',
            reason: 'Already migrated correctly'
          });
          continue;
        }

        // Detect the problem type for logging
        const problemType = detectProblemType(original, originalCode);
        
        console.log(`🔄 Processing profile ${profile.id}:`, {
          name: `${profile.first_name} ${profile.last_name}`,
          phone: original,
          countryCode: originalCode,
          problemType
        });

        // Parse the phone number
        const parsed = parsePhoneNumber(original, originalCode);

        // Validate: phone number too short (less than 7 digits)
        if (!parsed.phoneNumber || parsed.phoneNumber.length < 7) {
          errors.push({
            user_id: profile.id,
            original_phone: original,
            original_country_code: originalCode,
            new_country_code: parsed.countryCode,
            new_phone_number: parsed.phoneNumber,
            status: 'error',
            reason: `Número muy corto (${parsed.phoneNumber?.length || 0} dígitos) - requiere revisión manual`,
            problem_type: 'MUY_CORTO'
          });
          continue;
        }

        // Validate: phone number too long
        if (parsed.phoneNumber.length > 15) {
          errors.push({
            user_id: profile.id,
            original_phone: original,
            original_country_code: originalCode,
            new_country_code: parsed.countryCode,
            new_phone_number: parsed.phoneNumber,
            status: 'error',
            reason: `Número muy largo (${parsed.phoneNumber.length} dígitos) - requiere revisión manual`,
            problem_type: 'MUY_LARGO'
          });
          continue;
        }

        // Validate: ensure phone number is digits only after parsing
        if (!/^\d+$/.test(parsed.phoneNumber)) {
          errors.push({
            user_id: profile.id,
            original_phone: original,
            original_country_code: originalCode,
            new_country_code: parsed.countryCode,
            new_phone_number: parsed.phoneNumber,
            status: 'error',
            reason: 'Phone number contains non-digit characters after parsing',
            problem_type: 'CARACTERES_INVALIDOS'
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
              original_country_code: originalCode,
              new_country_code: parsed.countryCode,
              new_phone_number: parsed.phoneNumber,
              status: 'error',
              reason: updateError.message,
              problem_type: 'DB_ERROR'
            });
            continue;
          }

          updatedSuccessfully++;
          console.log(`✅ Updated profile ${profile.id}:`, {
            before: `${originalCode} ${original}`,
            after: `${parsed.countryCode} ${parsed.phoneNumber}`
          });
        }

        updates.push({
          user_id: profile.id,
          original_phone: original,
          original_country_code: originalCode,
          new_country_code: parsed.countryCode,
          new_phone_number: parsed.phoneNumber,
          status: 'success',
          problem_type: problemType
        });

      } catch (error) {
        console.error(`❌ Error processing profile ${profile.id}:`, error);
        errors.push({
          user_id: profile.id,
          original_phone: original,
          original_country_code: originalCode,
          new_country_code: '',
          new_phone_number: '',
          status: 'error',
          reason: error.message,
          problem_type: 'EXCEPTION'
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
