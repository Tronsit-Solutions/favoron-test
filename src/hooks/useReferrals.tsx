import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Referral {
  id: string;
  referred_id: string;
  referred_name: string;
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
          .rpc('get_my_referrals');

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
    const { data, error } = await supabase.rpc('register_referral', {
      p_referred_id: referredUserId,
      p_referral_code: referralCode,
    });

    if (error) throw error;
    return { success: !!data };
  } catch (err) {
    console.error('Error registering referral:', err);
    return { success: false };
  }
};
