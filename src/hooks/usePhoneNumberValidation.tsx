import { useAuth } from "./useAuth";
import { validateWhatsAppNumber } from "@/lib/validators";

export const usePhoneNumberValidation = () => {
  const { profile } = useAuth();

  const isPhoneNumberMissing = () => {
    // Check if phone_number is missing or invalid
    if (!profile?.phone_number || profile.phone_number.trim() === '') {
      return true;
    }
    
    // Also validate format - if invalid, consider it "missing"
    const validation = validateWhatsAppNumber(profile.phone_number);
    return !validation.isValid;
  };

  return {
    isPhoneNumberMissing: isPhoneNumberMissing(),
    profile
  };
};