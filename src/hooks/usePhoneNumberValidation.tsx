import { useAuth } from "./useAuth";
import { validateWhatsAppNumber } from "@/lib/validators";

export const usePhoneNumberValidation = () => {
  const { profile } = useAuth();

  const isPhoneNumberMissing = () => {
    if (!profile?.phone_number) return true;
    
    const validation = validateWhatsAppNumber(profile.phone_number);
    return !validation.isValid;
  };

  return {
    isPhoneNumberMissing: isPhoneNumberMissing(),
    profile
  };
};