

## Plan: Fix privilege escalation on profiles table

### Problem
The UPDATE policies on `profiles` only check `auth.uid() = id` but don't restrict which columns can be modified. Any user can set `prime_expires_at`, `trust_level`, `is_banned`, rating fields, etc.

### Solution
Drop the two existing UPDATE policies and replace them with two new ones:

1. **Non-admin users** can update their own row BUT a `WITH CHECK` constraint ensures sensitive fields remain unchanged (comparing `OLD` vs `NEW` values via a trigger-free approach using subquery against the current row).

2. **Admin users** can update any profile without column restrictions.

### Migration SQL

```sql
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
    -- Admins can change anything
    has_role(_user_id, 'admin'::user_role)
    OR
    -- Non-admins: ensure sensitive fields match current values
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

-- Policy: Users can update own non-sensitive fields
CREATE POLICY "Users can update own profile safe"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  profile_update_allowed(auth.uid(), profiles)
);
```

This uses a `SECURITY DEFINER` function that compares the new row values against current DB values for the 12 sensitive fields. Non-admins are rejected if any sensitive field differs. Admins pass unconditionally.

No code changes needed — admin operations already use RPC functions (`admin_update_trust_level`, `admin_assign_prime_membership`) or edge functions (`ban-user`) which run with elevated privileges.

