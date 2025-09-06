import { useAuth } from "./useAuth";

export const usePhoneNumberValidation = () => {
  const { profile } = useAuth();

  const isPhoneNumberMissing = () => {
    // Only return true if phone_number is truly empty, null, or undefined
    return !profile?.phone_number || profile.phone_number.trim() === '';
  };

  return {
    isPhoneNumberMissing: isPhoneNumberMissing(),
    profile
  };
};