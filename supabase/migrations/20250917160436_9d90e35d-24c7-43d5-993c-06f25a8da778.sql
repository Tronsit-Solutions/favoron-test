-- Harden RLS on public.profiles to require authentication for all access
-- and ensure strict ownership checks.

-- Drop and recreate policies safely
DO $$
BEGIN
  -- Drop existing SELECT policies if present
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' 
      AND policyname = 'Users can view own profile only'
  ) THEN
    DROP POLICY "Users can view own profile only" ON public.profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' 
      AND policyname = 'Admins can view basic profile data with verification'
  ) THEN
    DROP POLICY "Admins can view basic profile data with verification" ON public.profiles;
  END IF;

  -- Create a single strict SELECT policy requiring authentication
  CREATE POLICY "Authenticated users and admins can view profiles"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = id OR verify_admin_access()
    )
  );

  -- Recreate INSERT policy with explicit auth requirement
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' 
      AND policyname = 'Users can insert own profile'
  ) THEN
    DROP POLICY "Users can insert own profile" ON public.profiles;
  END IF;

  CREATE POLICY "Users can insert own profile (strict)"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = id
  );

  -- Recreate UPDATE policy with explicit auth requirement and WITH CHECK
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' 
      AND policyname = 'Users can update own profile'
  ) THEN
    DROP POLICY "Users can update own profile" ON public.profiles;
  END IF;

  CREATE POLICY "Users can update own profile (strict)"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND auth.uid() = id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid() = id
  );
END $$;
