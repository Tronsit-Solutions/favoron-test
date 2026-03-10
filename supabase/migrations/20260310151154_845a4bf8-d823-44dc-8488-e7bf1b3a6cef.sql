-- Drop existing permissive UPDATE policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile (strict)" ON profiles;

-- Create security definer function to check if sensitive fields changed
CREATE OR REPLACE FUNCTION public.profile_update_allowed(_user_id uuid, _row profiles)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    has_role(_user_id, 'admin'::user_role)
    OR
    (
      SELECT 
        _row.prime_expires_at IS NOT DISTINCT FROM p.prime_expires_at
        AND _row.trust_level IS NOT DISTINCT FROM p.trust_level
        AND _row.is_banned IS NOT DISTINCT FROM p.is_banned
        AND _row.banned_at IS NOT DISTINCT FROM p.banned_at
        AND _row.banned_until IS NOT DISTINCT FROM p.banned_until
        AND _row.ban_reason IS NOT DISTINCT FROM p.ban_reason
        AND _row.banned_by IS NOT DISTINCT FROM p.banned_by
        AND _row.traveler_avg_rating IS NOT DISTINCT FROM p.traveler_avg_rating
        AND _row.traveler_ontime_rate IS NOT DISTINCT FROM p.traveler_ontime_rate
        AND _row.traveler_total_ratings IS NOT DISTINCT FROM p.traveler_total_ratings
        AND _row.ab_test_group IS NOT DISTINCT FROM p.ab_test_group
        AND _row.acquisition_source IS NOT DISTINCT FROM p.acquisition_source
      FROM profiles p
      WHERE p.id = _row.id
    )
$$;

-- Policy: Users can update own non-sensitive fields (replaces both dropped policies)
CREATE POLICY "Users can update own profile safe"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  profile_update_allowed(auth.uid(), profiles)
);