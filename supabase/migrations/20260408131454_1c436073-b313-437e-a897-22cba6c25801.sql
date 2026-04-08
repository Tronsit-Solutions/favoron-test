INSERT INTO public.referrals (
  referrer_id,
  referred_id,
  status,
  reward_amount,
  reward_used,
  referred_reward_amount,
  referred_reward_used,
  completed_at
) VALUES (
  '278e0917-4600-4dcb-8759-7ebc9ba32ea7',
  '278e0917-4600-4dcb-8759-7ebc9ba32ea7',
  'completed',
  60,
  false,
  0,
  true,
  now()
);