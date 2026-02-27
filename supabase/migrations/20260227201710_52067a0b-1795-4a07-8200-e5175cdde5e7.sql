CREATE POLICY "Authenticated users can read referral settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (key IN ('referral_reward_amount', 'referred_user_discount'));