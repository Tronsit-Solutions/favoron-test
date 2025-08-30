-- Enable RLS on public_profiles and allow public SELECT to avoid breaking existing functionality
ALTER TABLE IF EXISTS public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policies if any (idempotent safeguard)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'public_profiles' AND policyname = 'Public can view public_profiles'
  ) THEN
    DROP POLICY "Public can view public_profiles" ON public.public_profiles;
  END IF;
END $$;

-- Allow SELECT for everyone (only non-sensitive fields are exposed in this table)
CREATE POLICY "Public can view public_profiles"
ON public.public_profiles
FOR SELECT
USING (true);
