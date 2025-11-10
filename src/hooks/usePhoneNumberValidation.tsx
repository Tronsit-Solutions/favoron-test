import { useAuth } from "./useAuth";
import { validateWhatsAppNumber } from "@/lib/validators";

export const usePhoneNumberValidation = () => {
  const { profile } = useAuth();

  const isPhoneNumberMissing = () => {
    // Check if phone_number or country_code is missing
    if (!profile?.phone_number || !profile?.country_code) {
      return true;
    }
    
    // Check if phone_number is empty
    if (profile.phone_number.trim() === '') {
      return true;
    }
    
    // Validate the combined phone number format
    const fullPhoneNumber = `${profile.country_code}${profile.phone_number}`;
    const validation = validateWhatsAppNumber(fullPhoneNumber);
    return !validation.isValid;
  };

  return {
    isPhoneNumberMissing: isPhoneNumberMissing(),
    profile
  };
};