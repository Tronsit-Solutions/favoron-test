import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReferralCreditData {
  referrerBalance: number;
  referredReward: number;
  totalAvailable: number;
  loading: boolean;
}

/**
 * Hook that combines referrer balance (completed referrals not yet used)
 * and referred reward (if not yet used) into a single available credit amount.
 */
export const useReferralCredit = (): ReferralCreditData => {
  const { user } = useAuth();
  const [referrerBalance, setReferrerBalance] = useState(0);
  const [referredReward, setReferredReward] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCredit = async () => {
      try {
        // Fetch referrer balance (completed referrals where reward_used = false)
        const { data: referrals, error: refError } = await supabase
          .rpc('get_my_referrals');

        if (!refError && referrals) {
          const balance = (referrals as any[])
            .filter(r => r.status === 'completed' && !r.reward_used)
            .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
          setReferrerBalance(balance);
        }

        // Fetch referred reward
        const { data: rewardData, error: rwError } = await supabase
          .rpc('get_my_referred_reward');

        if (!rwError && rewardData && (rewardData as any[]).length > 0) {
          const reward = (rewardData as any[])[0];
          if (!reward.reward_used && reward.reward_amount > 0) {
            setReferredReward(reward.reward_amount);
          }
        }
      } catch (err) {
        console.error('Error fetching referral credit:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredit();
  }, [user]);

  return {
    referrerBalance,
    referredReward,
    totalAvailable: referrerBalance + referredReward,
    loading,
  };
};
