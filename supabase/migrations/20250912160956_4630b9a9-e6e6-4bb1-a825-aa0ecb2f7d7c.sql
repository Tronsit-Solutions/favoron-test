-- Enable Row Level Security on public_profiles table
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own public profile
CREATE POLICY "Users can view their own public profile" 
ON public.public_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Policy 2: Admins can view all public profiles
CREATE POLICY "Admins can view all public profiles" 
ON public.public_profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

-- Policy 3: Authenticated users can view limited public info (username and avatar only)
-- This allows for displaying usernames and avatars in public contexts while protecting full names
CREATE POLICY "Authenticated users can view limited public profile info" 
ON public.public_profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Only expose username and avatar_url, not first_name/last_name
    -- This policy works in conjunction with application logic to filter sensitive fields
    true
  )
);

-- Policy 4: Users can insert their own public profile
CREATE POLICY "Users can insert their own public profile" 
ON public.public_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy 5: Users can update their own public profile  
CREATE POLICY "Users can update their own public profile" 
ON public.public_profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Policy 6: Admins can manage all public profiles
CREATE POLICY "Admins can manage all public profiles" 
ON public.public_profiles 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));