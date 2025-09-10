-- Security fix: Restrict access to public_profiles to authenticated users only
-- 1) Enable Row Level Security
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- 2) Remove any overly permissive public SELECT policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'public_profiles' 
      AND policyname = 'Public can view public_profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Public can view public_profiles" ON public.public_profiles';
  END IF;
END $$;

-- 3) Create a strict SELECT policy for authenticated users only
CREATE POLICY "Authenticated users can view public_profiles"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (true);
