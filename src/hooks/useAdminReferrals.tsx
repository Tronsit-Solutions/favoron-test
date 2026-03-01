import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  referral_code: string | null;
}

export interface AdminReferral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  reward_amount: number;
  referred_reward_amount: number | null;
  referred_reward_used: boolean | null;
  created_at: string;
  completed_at: string | null;
  referrer?: ProfileInfo;
  referred?: ProfileInfo;
}

export const useAdminReferrals = () => {
  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: refs, error } = await supabase
          .from('referrals')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!refs || refs.length === 0) {
          setReferrals([]);
          return;
        }

        // Collect unique user IDs
        const userIds = [...new Set(refs.flatMap(r => [r.referrer_id, r.referred_id]))];

        // Batch fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, referral_code')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profileMap = new Map<string, ProfileInfo>();
        (profiles || []).forEach(p => profileMap.set(p.id, p));

        const enriched: AdminReferral[] = refs.map(r => ({
          ...r,
          referrer: profileMap.get(r.referrer_id),
          referred: profileMap.get(r.referred_id),
        }));

        setReferrals(enriched);
      } catch (err) {
        console.error('Error fetching admin referrals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const totalReferrals = referrals.length;
  const pendingCount = referrals.filter(r => r.status === 'pending').length;
  const completedCount = referrals.filter(r => r.status === 'completed').length;
  const totalRewardsDistributed = referrals
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.reward_amount || 0), 0);
  const totalDiscountsGiven = referrals
    .reduce((sum, r) => sum + (r.referred_reward_amount || 0), 0);

  return {
    referrals,
    loading,
    totalReferrals,
    pendingCount,
    completedCount,
    totalRewardsDistributed,
    totalDiscountsGiven,
  };
};
