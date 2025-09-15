-- Create a more secure admin verification function
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_session_valid boolean := false;
  user_is_admin boolean := false;
BEGIN
  -- Verify user has valid session
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has admin role with proper verification
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::user_role
    AND ur.assigned_at IS NOT NULL
  ) INTO user_is_admin;
  
  -- Log admin access attempt for audit trail
  IF user_is_admin THEN
    PERFORM public.log_admin_profile_access(
      auth.uid(),
      'profile_list_access',
      'Admin accessed profile data via RLS policy'
    );
  END IF;
  
  RETURN user_is_admin;
END;
$$;

-- Create separate table for sensitive financial data
CREATE TABLE public.user_financial_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name text,
  bank_account_number text,
  bank_account_holder text,
  bank_account_type text,
  bank_swift_code text,
  document_type text,
  document_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_user_financial_data UNIQUE(user_id)
);

-- Enable RLS on financial data table
ALTER TABLE public.user_financial_data ENABLE ROW LEVEL SECURITY;

-- Highly restrictive policies for financial data
CREATE POLICY "Users can view own financial data only"
ON public.user_financial_data
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own financial data only"
ON public.user_financial_data
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial data only"
ON public.user_financial_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view financial data with audit logging"
ON public.user_financial_data
FOR SELECT
USING (
  public.verify_admin_access() AND
  (SELECT public.log_admin_profile_access(
    user_id,
    'financial_data_access',
    'Admin accessed sensitive financial data'
  ), true)
);

-- Migrate existing financial data from profiles to new table
INSERT INTO public.user_financial_data (
  user_id,
  bank_name,
  bank_account_number,
  bank_account_holder,
  bank_account_type,
  bank_swift_code,
  document_type,
  document_number
)
SELECT 
  id,
  bank_name,
  bank_account_number,
  bank_account_holder,
  bank_account_type,
  bank_swift_code,
  document_type,
  document_number
FROM public.profiles
WHERE bank_name IS NOT NULL 
   OR bank_account_number IS NOT NULL 
   OR document_type IS NOT NULL;

-- Remove sensitive financial columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS bank_name,
DROP COLUMN IF EXISTS bank_account_number,
DROP COLUMN IF EXISTS bank_account_holder,
DROP COLUMN IF EXISTS bank_account_type,
DROP COLUMN IF EXISTS bank_swift_code,
DROP COLUMN IF EXISTS document_type,
DROP COLUMN IF EXISTS document_number;

-- Update profiles RLS policies to be more restrictive
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view basic profile data with verification"
ON public.profiles
FOR SELECT
USING (
  (auth.uid() = id) OR 
  (public.verify_admin_access() AND
   (SELECT public.log_admin_profile_access(
     id,
     'basic_profile_access',
     'Admin accessed basic profile data'
   ), true))
);

-- Create trigger to update financial data timestamps
CREATE OR REPLACE FUNCTION public.update_financial_data_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_financial_data_updated_at
  BEFORE UPDATE ON public.user_financial_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_data_updated_at();