
-- 1) Enable Row Level Security on public_profiles
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Optional: clean up any existing policies if they exist (uncomment if needed)
-- DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.public_profiles;
-- DROP POLICY IF EXISTS "Users can insert their own public profile" ON public.public_profiles;
-- DROP POLICY IF EXISTS "Admins can insert public profiles" ON public.public_profiles;
-- DROP POLICY IF EXISTS "Users can update their own public profile" ON public.public_profiles;
-- DROP POLICY IF EXISTS "Admins can update any public profile" ON public.public_profiles;
-- DROP POLICY IF EXISTS "Only admins can delete public profiles" ON public.public_profiles;

-- 2) Read access: any authenticated user can view public profiles
CREATE POLICY "Authenticated users can view public profiles"
ON public.public_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- 3) Insert: users can create their own row; admins can insert any
CREATE POLICY "Users can insert their own public profile"
ON public.public_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert public profiles"
ON public.public_profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 4) Update: users can update their own row; admins can update any
CREATE POLICY "Users can update their own public profile"
ON public.public_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any public profile"
ON public.public_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 5) Delete: only admins
CREATE POLICY "Only admins can delete public profiles"
ON public.public_profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));
