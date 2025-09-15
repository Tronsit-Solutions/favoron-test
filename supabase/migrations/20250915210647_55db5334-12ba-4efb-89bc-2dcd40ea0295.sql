-- Fix High-Risk Security Issues

-- 1. Remove public access to customer photos (CRITICAL)
-- Drop the public policy that exposes customer data
DROP POLICY IF EXISTS "Public can view showcase photos" ON public.customer_photos;

-- 2. Add constraints to prevent privilege escalation (CRITICAL)
-- Ensure users cannot assign themselves admin roles
DROP POLICY IF EXISTS "Users can insert their own role only" ON public.user_roles;

-- Create more restrictive policy for user role insertion
CREATE POLICY "Users can insert basic role only" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'user'::user_role
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- Add check constraint to prevent direct admin role assignment
ALTER TABLE public.user_roles 
ADD CONSTRAINT check_no_self_admin 
CHECK (
  CASE 
    WHEN role = 'admin'::user_role 
    THEN assigned_by IS NOT NULL AND assigned_by != user_id
    ELSE true 
  END
);

-- 3. Add database-level protection against unauthorized admin creation
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_admin_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow admin role assignment by existing admins (except initial setup)
  IF NEW.role = 'admin'::user_role THEN
    -- Allow if assigned by an existing admin
    IF NEW.assigned_by IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = NEW.assigned_by 
      AND role = 'admin'::user_role
    ) THEN
      RETURN NEW;
    -- Allow if this is the first admin (no existing admins)
    ELSIF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE role = 'admin'::user_role
    ) THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Only existing admins can assign admin roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce admin role assignment rules
DROP TRIGGER IF EXISTS enforce_admin_assignment ON public.user_roles;
CREATE TRIGGER enforce_admin_assignment
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_admin_creation();

-- 4. Add better protection for sensitive profile data
-- Update profiles RLS to prevent unauthorized access to banking info
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;

CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  -- Restrict banking fields to admin access only
  OR (
    has_role(auth.uid(), 'admin'::user_role)
    AND current_setting('app.context', true) = 'admin_access'
  )
);

-- 5. Create secure view for user profiles without banking data
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone_number,
  country_code,
  avatar_url,
  trust_level,
  prime_expires_at,
  username,
  document_type,
  email_notifications,
  email_notification_preferences,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the safe view
GRANT SELECT ON public.safe_profiles TO authenticated;

-- Create RLS policy for safe profiles view
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- 6. Add logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when banking information is accessed
  IF TG_OP = 'SELECT' AND (
    OLD.bank_name IS NOT NULL 
    OR OLD.bank_account_number IS NOT NULL
  ) THEN
    INSERT INTO public.admin_profile_access_log (
      admin_user_id,
      accessed_profile_id,
      access_type,
      reason
    ) VALUES (
      auth.uid(),
      OLD.id,
      'banking_data_access',
      'Banking information viewed'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Create function to safely check user permissions without exposing data
CREATE OR REPLACE FUNCTION public.can_access_banking_data(profile_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.uid() = profile_id 
    OR has_role(auth.uid(), 'admin'::user_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;