-- Security fix: Restrict access to public_profiles view to authenticated users only

-- 1) First, remove any overly permissive public SELECT policies if they exist
DO $$
BEGIN
  -- Check if the policy exists and drop it
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'public_profiles' 
      AND policyname = 'Public can view public_profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Public can view public_profiles" ON public.public_profiles';
  END IF;
END $$;

-- 2) Revoke public access and grant only to authenticated users
REVOKE ALL ON public.public_profiles FROM PUBLIC;
REVOKE ALL ON public.public_profiles FROM anon;

-- 3) Grant SELECT permission only to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- 4) Ensure the view uses security_invoker for proper RLS enforcement
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- 5) Add comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 'Public view of user profiles - accessible only to authenticated users';