import { useAuth } from "./useAuth";

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
    last_name: 'Apellido'
  };

  const checkFieldCompletion = () => {
    if (!profile) {
      return {
        isComplete: false,
        missingFields: Object.values(requiredFields),
        completionPercentage: 0,
        requiredFields: Object.keys(requiredFields).reduce((acc, key) => ({ ...acc, [key]: false }), {})
      };
    }

    const fieldStatus = Object.keys(requiredFields).reduce((acc, key) => {
      const value = profile[key as keyof typeof profile];
      const isComplete = value !== null && value !== undefined && value.toString().trim() !== '';
      return { ...acc, [key]: isComplete };
    }, {} as { [key: string]: boolean });

    const completedCount = Object.values(fieldStatus).filter(Boolean).length;
    const totalFields = Object.keys(requiredFields).length;
    const missingFields = Object.entries(fieldStatus)
      .filter(([_, isComplete]) => !isComplete)
      .map(([key, _]) => requiredFields[key as keyof typeof requiredFields]);

    return {
      isComplete: completedCount === totalFields,
      missingFields,
      completionPercentage: Math.round((completedCount / totalFields) * 100),
      requiredFields: fieldStatus
    };
  };

  return checkFieldCompletion();
};

export const isProfileComplete = (profile: any): boolean => {
  if (!profile) return false;
  
  const requiredFields = ['phone_number', 'first_name', 'last_name'];
  
  return requiredFields.every(field => {
    const value = profile[field];
    return value !== null && value !== undefined && value.toString().trim() !== '';
  });
};