import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export type AcquisitionSource = 
  | 'instagram_facebook_ads' // Meta Ads (Instagram/Facebook unificado)
  | 'tiktok'
  | 'reels'
  | 'friend_referral'
  | 'other';

// Extend Profile type to include acquisition_source fields
interface ProfileWithAcquisition {
  acquisition_source?: string | null;
  acquisition_source_answered_at?: string | null;
  referrer_name?: string | null;
}

export const useAcquisitionSurvey = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  // Verificar si el usuario necesita responder la encuesta
  const needsSurvey = useCallback(() => {
    if (!profile) return false;
    
    const profileWithAcquisition = profile as ProfileWithAcquisition;
    
    // Solo mostrar si:
    // 1. El perfil básico está completo (phone, first_name, last_name)
    // 2. NO ha respondido la encuesta (acquisition_source === null)
    const isProfileComplete = !!(
      profile.phone_number && 
      profile.first_name && 
      profile.last_name
    );
    
    const hasNotAnswered = !profileWithAcquisition.acquisition_source;
    
    return isProfileComplete && hasNotAnswered;
  }, [profile]);

  // Enviar respuesta de la encuesta
  const submitSurvey = useCallback(async (source: AcquisitionSource, referrerName?: string) => {
    if (!profile?.id) {
      throw new Error('No user profile found');
    }

    try {
      const { error } = await supabase.rpc('submit_acquisition_survey', {
        _source: source,
        _referrer_name: referrerName || null
      } as any);

      if (error) throw error;

      toast({
        title: "¡Gracias por tu respuesta!",
        description: "Tu información nos ayuda a mejorar Favorón",
      });

      return { success: true };
    } catch (error) {
      console.error('Error submitting acquisition survey:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu respuesta. Intenta de nuevo.",
        variant: "destructive"
      });
      return { success: false };
    }
  }, [profile, toast]);

  return {
    needsSurvey,
    submitSurvey,
    hasAnswered: !!(profile as ProfileWithAcquisition)?.acquisition_source
  };
};
