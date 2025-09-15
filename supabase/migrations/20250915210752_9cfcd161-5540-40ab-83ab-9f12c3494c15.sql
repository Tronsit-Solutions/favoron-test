-- Fix High-Risk Security Issues (Step 2: Complete protections)

-- 1. Create secure view for user profiles without banking data
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

-- 2. Create function to safely check user permissions without exposing data
CREATE OR REPLACE FUNCTION public.can_access_banking_data(profile_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.uid() = profile_id 
    OR has_role(auth.uid(), 'admin'::user_role)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 3. Create function to mask banking data for non-admin users
CREATE OR REPLACE FUNCTION public.mask_banking_data(
  bank_name text,
  account_number text,
  account_holder text,
  is_admin boolean DEFAULT false
)
RETURNS jsonb AS $$
BEGIN
  IF is_admin THEN
    RETURN jsonb_build_object(
      'bank_name', bank_name,
      'account_number', account_number,
      'account_holder', account_holder
    );
  ELSE
    RETURN jsonb_build_object(
      'bank_name', CASE WHEN bank_name IS NOT NULL THEN '***' ELSE NULL END,
      'account_number', CASE WHEN account_number IS NOT NULL THEN '***' || RIGHT(account_number, 4) ELSE NULL END,
      'account_holder', CASE WHEN account_holder IS NOT NULL THEN '***' ELSE NULL END
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 4. Update edge functions to have proper JWT verification
-- Check supabase/config.toml and ensure all functions have verify_jwt = true
-- This will be handled in the config file update

-- 5. Add additional RLS policy for customer photos to require authentication
CREATE POLICY "Authenticated users can view approved photos with consent" 
ON public.customer_photos 
FOR SELECT 
TO authenticated
USING (
  status = 'approved' 
  AND customer_consent = true
);

-- 6. Add constraint to prevent public exposure of sensitive customer data
ALTER TABLE public.customer_photos 
ADD CONSTRAINT check_consent_required 
CHECK (
  CASE 
    WHEN status = 'approved' 
    THEN customer_consent = true 
    ELSE true 
  END
);

-- 7. Create audit log for banking data access
CREATE OR REPLACE FUNCTION public.audit_banking_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when banking information is accessed
  IF TG_OP = 'SELECT' AND (
    NEW.bank_name IS NOT NULL 
    OR NEW.bank_account_number IS NOT NULL
    OR NEW.bank_account_holder IS NOT NULL
  ) THEN
    INSERT INTO public.admin_profile_access_log (
      admin_user_id,
      accessed_profile_id,
      access_type,
      reason,
      session_info
    ) VALUES (
      auth.uid(),
      NEW.id,
      'banking_data_access',
      'Banking information accessed',
      jsonb_build_object(
        'timestamp', NOW(),
        'table', 'profiles',
        'operation', TG_OP
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;