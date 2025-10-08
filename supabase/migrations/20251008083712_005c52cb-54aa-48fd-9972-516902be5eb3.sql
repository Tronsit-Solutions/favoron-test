-- =====================================================
-- SECURITY FIX: Prevent User Contact Information Harvesting
-- Restrict profiles table access to prevent enumeration attacks
-- =====================================================

-- 1. Drop existing vulnerable SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view own profile, admins can view all profiles" ON public.profiles;

-- 2. RESTRICTIVE POLICY: Block ALL anonymous access to profiles
CREATE POLICY "Block all anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 3. SELECT: Authenticated users can ONLY view their own complete profile
-- This prevents authenticated users from enumerating other users' email/phone
CREATE POLICY "Authenticated users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id
);

-- 4. SELECT: Authenticated admins can view all profiles
CREATE POLICY "Authenticated admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND verify_admin_access()
);

-- 5. Add security documentation to profiles table
COMMENT ON TABLE public.profiles IS 
'⚠️ CONTAINS PII - Personal Identifiable Information (email, phone_number)
RLS POLICIES ENFORCED:
- RESTRICTIVE policy blocks ALL anonymous access (auth.uid() IS NULL)
- Authenticated users can ONLY view their own profile (prevents contact harvesting)
- Authenticated admins can view all profiles (requires admin role verification)
- All policies require auth.uid() IS NOT NULL to prevent NULL-based attacks

SECURITY NOTE: This prevents authenticated users from enumerating user IDs to harvest 
email addresses and phone numbers for spam, phishing, or social engineering attacks.

NEVER disable RLS on this table. NEVER allow public access to PII fields.';

-- 6. Ensure RLS is enabled and enforced
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;