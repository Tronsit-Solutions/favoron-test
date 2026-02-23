import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Referral {
  id: string;
  referred_id: string;
  status: string;
  reward_amount: number;
  completed_at: string | null;
  created_at: string;
}

interface ReferralData {
  referralCode: string | null;
  referrals: Referral[];
  balance: number;
  pendingCount: number;
  completedCount: number;
  loading: boolean;
}

export const useReferrals = (): ReferralData => {
  const { user, profile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchReferrals = async () => {
      try {
        const { data, error } = await supabase
          .from('referrals')
          .select('id, referred_id, status, reward_amount, completed_at, created_at')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReferrals((data as Referral[]) || []);
      } catch (err) {
        console.error('Error fetching referrals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [user]);

  const balance = referrals
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

  const pendingCount = referrals.filter(r => r.status === 'pending').length;
  const completedCount = referrals.filter(r => r.status === 'completed').length;

  return {
    referralCode: (profile as any)?.referral_code || null,
    referrals,
    balance,
    pendingCount,
    completedCount,
    loading,
  };
};

export const registerReferral = async (referredUserId: string, referralCode: string) => {
  try {
    // Find the referrer by their referral code
    const { data: referrerProfile, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .maybeSingle();

    if (findError || !referrerProfile) {
      console.log('Referral code not found:', referralCode);
      return { success: false };
    }

    // Don't allow self-referral
    if (referrerProfile.id === referredUserId) {
      console.log('Self-referral attempted');
      return { success: false };
    }

    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerProfile.id,
        referred_id: referredUserId,
        status: 'pending',
      });

    if (insertError) {
      // Unique constraint violation means user was already referred
      if (insertError.code === '23505') {
        console.log('User already referred');
        return { success: false };
      }
      throw insertError;
    }

    console.log('✅ Referral registered successfully');
    return { success: true };
  } catch (err) {
    console.error('Error registering referral:', err);
    return { success: false };
  }
};
