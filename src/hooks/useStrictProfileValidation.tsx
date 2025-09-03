import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { isProfileComplete } from './useProfileCompletion';

/**
 * Strict profile validation hook with multiple validation layers
 * Provides fallback protection against profile completion bypass
 */
export const useStrictProfileValidation = () => {
  const { profile } = useAuth();

  const validateProfileStrict = useCallback(() => {
    console.log('🔒 Strict profile validation started:', {
      timestamp: new Date().toISOString(),
      profileExists: !!profile,
      profileId: profile?.id
    });

    // Layer 1: Check if profile exists
    if (!profile) {
      console.log('❌ Validation failed: No profile found');
      return {
        isValid: false,
        reason: 'NO_PROFILE',
        missingFields: ['phone_number', 'first_name', 'last_name']
      };
    }

    // Layer 2: Use the enhanced isProfileComplete function
    const isComplete = isProfileComplete(profile);
    
    if (!isComplete) {
      // Layer 3: Manual field-by-field validation as backup
      const requiredFields = ['phone_number', 'first_name', 'last_name'];
      const missingFields = requiredFields.filter(field => {
        const value = profile[field];
        const isInvalid = value === null || value === undefined || 
                         (typeof value === 'string' && value.trim() === '');
        
        if (isInvalid) {
          console.log(`❌ Field ${field} is invalid:`, {
            value,
            type: typeof value,
            stringified: JSON.stringify(value)
          });
        }
        
        return isInvalid;
      });

      console.log('❌ Strict validation failed:', {
        missingFields,
        profileData: {
          phone_number: profile.phone_number,
          first_name: profile.first_name,
          last_name: profile.last_name
        }
      });

      return {
        isValid: false,
        reason: 'INCOMPLETE_PROFILE',
        missingFields
      };
    }

    console.log('✅ Strict validation passed - profile is complete');
    return {
      isValid: true,
      reason: 'COMPLETE',
      missingFields: []
    };
  }, [profile]);

  return {
    validateProfileStrict,
    profile
  };
};