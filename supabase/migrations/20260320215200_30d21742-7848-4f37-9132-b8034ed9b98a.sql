
-- Allow users with 'discounts' permission to manage discount_codes
CREATE POLICY "Permission users can manage discount_codes" ON public.discount_codes
  FOR ALL TO authenticated
  USING (has_permission(auth.uid(), 'discounts'))
  WITH CHECK (has_permission(auth.uid(), 'discounts'));

-- Allow users with 'discounts' permission to view discount_code_usage
CREATE POLICY "Permission users can view discount_code_usage" ON public.discount_code_usage
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'discounts'));

-- Allow users with 'discounts' permission to manage boost_codes
CREATE POLICY "Permission users can manage boost_codes" ON public.boost_codes
  FOR ALL TO authenticated
  USING (has_permission(auth.uid(), 'discounts'))
  WITH CHECK (has_permission(auth.uid(), 'discounts'));

-- Allow users with 'discounts' permission to view boost_code_usage
CREATE POLICY "Permission users can view boost_code_usage" ON public.boost_code_usage
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'discounts'));

-- Allow users with 'referrals' permission to manage referrals
CREATE POLICY "Permission users can manage referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (has_permission(auth.uid(), 'referrals'))
  WITH CHECK (has_permission(auth.uid(), 'referrals'));

-- Allow users with 'referrals' permission to read referral settings
CREATE POLICY "Permission users can read referral settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'referrals'));

-- Allow users with 'referrals' permission to update referral settings
CREATE POLICY "Permission users can manage referral settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (has_permission(auth.uid(), 'referrals') AND key IN ('referral_reward_amount', 'referred_user_discount'))
  WITH CHECK (has_permission(auth.uid(), 'referrals') AND key IN ('referral_reward_amount', 'referred_user_discount'));

-- Allow users with 'cx' permission to manage CX calls
CREATE POLICY "Permission users can manage cx calls" ON public.customer_experience_calls
  FOR ALL TO authenticated
  USING (has_permission(auth.uid(), 'cx'))
  WITH CHECK (has_permission(auth.uid(), 'cx'));

-- Allow users with 'surveys' permission to view platform_reviews
CREATE POLICY "Permission users can view reviews" ON public.platform_reviews
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'surveys'));

-- Allow users with 'surveys' permission to view traveler_surveys
CREATE POLICY "Permission users can view traveler surveys" ON public.traveler_surveys
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'surveys'));

-- Allow users with custom permissions to read profiles (needed for user lookups)
CREATE POLICY "Permission users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_custom_roles
      WHERE user_id = auth.uid()
    )
  );
