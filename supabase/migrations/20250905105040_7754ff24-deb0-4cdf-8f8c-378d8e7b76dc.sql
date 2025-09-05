-- Secure public_profiles view to prevent public PII exposure
-- 1) Ensure the view evaluates with invoker rights and is a security barrier
DO $$
BEGIN
  -- Set invoker and barrier for safer execution (idempotent)
  EXECUTE 'ALTER VIEW public.public_profiles SET (security_invoker = true)';
  EXECUTE 'ALTER VIEW public.public_profiles SET (security_barrier = true)';
EXCEPTION WHEN others THEN
  -- If public_profiles is a table (unlikely), skip altering view attributes
  RAISE NOTICE 'Could not set view security attributes for public.public_profiles: %', SQLERRM;
END $$;

-- 2) Restrict privileges: remove anon/public access; keep authenticated + service_role
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC';
  EXECUTE 'REVOKE ALL ON TABLE public.public_profiles FROM anon';
  -- Revoke and re-grant to avoid drift
  EXECUTE 'REVOKE ALL ON TABLE public.public_profiles FROM authenticated';
  EXECUTE 'REVOKE ALL ON TABLE public.public_profiles FROM service_role';
  
  EXECUTE 'GRANT SELECT ON TABLE public.public_profiles TO authenticated';
  EXECUTE 'GRANT SELECT ON TABLE public.public_profiles TO service_role';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Privilege adjustments for public.public_profiles encountered an issue: %', SQLERRM;
END $$;

-- 3) Document intent
COMMENT ON VIEW public.public_profiles IS
  'Public profile summary view. Access restricted to authenticated users and service_role; no anon/public access. Contains limited PII (first_name, last_name, username, avatar_url).';