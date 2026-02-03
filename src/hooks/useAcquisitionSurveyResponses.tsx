import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AcquisitionSurveyResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  acquisitionSource: string | null;
  referrerName: string | null;
  answeredAt: string | null;
  createdAt: string | null;
}

export const useAcquisitionSurveyResponses = (limit: number = 50) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['acquisition-survey-responses', limit],
    queryFn: async (): Promise<AcquisitionSurveyResponse[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, acquisition_source, referrer_name, acquisition_source_answered_at, created_at')
        .not('acquisition_source', 'is', null)
        .not('acquisition_source_answered_at', 'is', null)
        .order('acquisition_source_answered_at', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(profile => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        acquisitionSource: profile.acquisition_source,
        referrerName: profile.referrer_name,
        answeredAt: profile.acquisition_source_answered_at,
        createdAt: profile.created_at,
      }));
    },
  });

  return {
    responses: data || [],
    isLoading,
    error,
    refetch,
  };
};
