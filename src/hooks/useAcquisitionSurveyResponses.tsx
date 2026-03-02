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
      const pageSize = 1000;
      const target = Math.max(limit, 0);
      let from = 0;
      const rows: any[] = [];

      while (rows.length < target || (target === 0 && from === 0)) {
        const to = from + Math.min(pageSize, Math.max(target - rows.length, 1)) - 1;

        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, acquisition_source, referrer_name, acquisition_source_answered_at, created_at')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (!data || data.length === 0) break;

        rows.push(...data);

        if (data.length < (to - from + 1)) break;
        from += (to - from + 1);
      }

      return rows.slice(0, limit).map(profile => ({
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
