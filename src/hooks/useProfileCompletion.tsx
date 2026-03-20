import { useAuth } from "./useAuth";
import { validateWhatsAppNumber } from "@/lib/validators";

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
  requiredFields: { [key: string]: boolean };
}

export const useProfileCompletion = (): ProfileCompletionStatus => {
  const { profile } = useAuth();

  const requiredFields = {
    phone_number: 'Número de teléfono',
    first_name: 'Nombre',
    last_name: 'Apellido',
    document_number: 'Documento de identidad'
  };

  const validateFieldValue = (key: string, value: any): boolean => {
    // Strict validation: null, undefined, empty string, or whitespace-only strings are invalid
    if (value === null || value === undefined) return false;
    const stringValue = value.toString().trim();
    
    // Special validation for phone_number - use WhatsApp validation
    if (key === 'phone_number') {
      const validation = validateWhatsAppNumber(stringValue);
      
      console.log(`📱 WhatsApp validation for "${stringValue}":`, {
        isValid: validation.isValid,
        error: validation.error,
        rawValue: JSON.stringify(value)
      });
      
      return validation.isValid;
    }
    
    return stringValue.length > 0;
  };

  const checkFieldCompletion = () => {
    // Debug logging
    console.log('🔍 Profile completion check:', {
      profile,
      profileExists: !!profile,
      phone: profile?.phone_number,
      firstName: profile?.first_name,
      lastName: profile?.last_name
    });

    if (!profile) {
      console.log('❌ No profile found - completion check failed');
      return {
        isComplete: false,
        missingFields: Object.values(requiredFields),
        completionPercentage: 0,
        requiredFields: Object.keys(requiredFields).reduce((acc, key) => ({ ...acc, [key]: false }), {})
      };
    }

    const fieldStatus = Object.keys(requiredFields).reduce((acc, key) => {
      const value = profile[key as keyof typeof profile];
      const isComplete = validateFieldValue(key, value);
      
      // Debug each field
      console.log(`📝 Field ${key}:`, {
        value,
        rawValue: JSON.stringify(value),
        isComplete,
        type: typeof value,
        fieldLabel: requiredFields[key as keyof typeof requiredFields]
      });
      
      return { ...acc, [key]: isComplete };
    }, {} as { [key: string]: boolean });

    const completedCount = Object.values(fieldStatus).filter(Boolean).length;
    const totalFields = Object.keys(requiredFields).length;
    const missingFields = Object.entries(fieldStatus)
      .filter(([_, isComplete]) => !isComplete)
      .map(([key, _]) => requiredFields[key as keyof typeof requiredFields]);

    const result = {
      isComplete: completedCount === totalFields,
      missingFields,
      completionPercentage: Math.round((completedCount / totalFields) * 100),
      requiredFields: fieldStatus
    };

    console.log('✅ Profile completion result:', {
      isComplete: result.isComplete,
      completedCount,
      totalFields,
      missingFields,
      fieldStatus
    });

    return result;
  };

  return checkFieldCompletion();
};

export const isProfileComplete = (profile: any): boolean => {
  if (!profile) {
    console.log('❌ isProfileComplete: No profile provided');
    return false;
  }
  
  const requiredFields = ['phone_number', 'first_name', 'last_name', 'document_number'];
  
  const isComplete = requiredFields.every(field => {
    const value = profile[field];
    
    // Special validation for phone_number
    if (field === 'phone_number') {
      const validation = validateWhatsAppNumber(value);
      
      if (!validation.isValid) {
        console.log(`❌ isProfileComplete: WhatsApp ${field} validation failed:`, {
          value,
          rawValue: JSON.stringify(value),
          error: validation.error,
          type: typeof value
        });
      }
      
      return validation.isValid;
    }
    
    // Standard validation for other fields
    const isValid = value !== null && value !== undefined && value.toString().trim() !== '';
    
    if (!isValid) {
      console.log(`❌ isProfileComplete: Field ${field} is invalid:`, {
        value,
        rawValue: JSON.stringify(value),
        type: typeof value
      });
    }
    
    return isValid;
  });
  
  console.log('🔍 isProfileComplete result:', {
    isComplete,
    profileId: profile.id,
    fields: requiredFields.reduce((acc, field) => ({
      ...acc,
      [field]: profile[field]
    }), {})
  });
  
  return isComplete;
};