-- Security Fix 1: Enable RLS on public_profiles table and create appropriate policies
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view public profiles (limited info only)
CREATE POLICY "Authenticated users can view public profiles" 
ON public.public_profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Only allow users to insert/update their own public profile
CREATE POLICY "Users can insert their own public profile" 
ON public.public_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own public profile" 
ON public.public_profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Security Fix 2: Enable RLS on trips_with_user view (this is a view, so we need to handle it differently)
-- Since this appears to be a view, we need to check if it's actually needed or if we can restrict access

-- Security Fix 3: Add additional validation trigger for sensitive profile data
CREATE OR REPLACE FUNCTION public.validate_sensitive_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user can only update their own profile
  IF auth.uid() != NEW.id THEN
    RAISE EXCEPTION 'Users can only update their own profile';
  END IF;
  
  -- Additional validation for banking info updates
  IF NEW.bank_account_number IS NOT NULL THEN
    -- Log access to sensitive banking info
    INSERT INTO admin_profile_access_log (
      admin_user_id,
      accessed_profile_id,
      access_type,
      reason,
      session_info
    ) VALUES (
      auth.uid(),
      NEW.id,
      'banking_info_update',
      'User updated banking information',
      jsonb_build_object(
        'timestamp', NOW(),
        'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the validation trigger to profiles table
CREATE TRIGGER validate_sensitive_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sensitive_profile_data();

-- Security Fix 4: Create a secure function to get minimal public user info instead of exposing full profiles
CREATE OR REPLACE FUNCTION public.get_public_user_info(_user_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  username text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.first_name,
    p.username,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = _user_id;
$$;

-- Security Fix 5: Add better audit logging for admin access to profiles
CREATE OR REPLACE FUNCTION public.audit_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if the accessing user is an admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  -- If admin is accessing someone else's profile, log it
  IF is_admin AND auth.uid() != NEW.id THEN
    PERFORM log_admin_profile_access(
      NEW.id,
      'profile_view',
      'Admin accessed user profile during routine operations'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply audit trigger to profile access
CREATE TRIGGER audit_admin_profile_access
  AFTER SELECT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_access();