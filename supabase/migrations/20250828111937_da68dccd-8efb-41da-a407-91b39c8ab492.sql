-- Fix Critical: User Roles Exposure - Restrict user_roles SELECT policy
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Create more restrictive policy for user_roles SELECT
CREATE POLICY "Users can view only their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ))
);

-- Add security audit logging function
CREATE OR REPLACE FUNCTION public.log_admin_profile_access(
  _accessed_profile_id UUID,
  _access_type TEXT,
  _reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admins to log access
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can log profile access';
  END IF;

  INSERT INTO public.admin_profile_access_log (
    admin_user_id,
    accessed_profile_id,
    access_type,
    reason,
    session_info
  ) VALUES (
    auth.uid(),
    _accessed_profile_id,
    _access_type,
    _reason,
    jsonb_build_object(
      'timestamp', NOW(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent',
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    )
  );
END;
$$;

-- Add function to validate banking information
CREATE OR REPLACE FUNCTION public.validate_banking_info(
  _bank_name TEXT,
  _account_number TEXT,
  _account_holder TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Basic validation rules
  IF LENGTH(_bank_name) < 2 OR LENGTH(_bank_name) > 100 THEN
    RETURN FALSE;
  END IF;
  
  IF LENGTH(_account_number) < 4 OR LENGTH(_account_number) > 50 THEN
    RETURN FALSE;
  END IF;
  
  IF LENGTH(_account_holder) < 2 OR LENGTH(_account_holder) > 100 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for suspicious patterns
  IF _account_number ~ '^[0-9]+$' AND LENGTH(_account_number) < 8 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add trigger to validate banking info on profiles updates
CREATE OR REPLACE FUNCTION public.validate_profile_banking_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only validate if banking fields are being updated
  IF NEW.bank_name IS NOT NULL OR NEW.bank_account_number IS NOT NULL OR NEW.bank_account_holder IS NOT NULL THEN
    -- Ensure all banking fields are provided together
    IF NEW.bank_name IS NULL OR NEW.bank_account_number IS NULL OR NEW.bank_account_holder IS NULL THEN
      RAISE EXCEPTION 'All banking fields (bank_name, account_number, account_holder) must be provided together';
    END IF;
    
    -- Validate banking information
    IF NOT public.validate_banking_info(NEW.bank_name, NEW.bank_account_number, NEW.bank_account_holder) THEN
      RAISE EXCEPTION 'Invalid banking information provided';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for banking validation
DROP TRIGGER IF EXISTS validate_banking_info_trigger ON public.profiles;
CREATE TRIGGER validate_banking_info_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_banking_update();

-- Add function to monitor suspicious role assignments
CREATE OR REPLACE FUNCTION public.monitor_role_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Monitor admin role assignments
  IF NEW.role = 'admin' THEN
    -- Count current admins
    SELECT COUNT(*) INTO admin_count 
    FROM public.user_roles 
    WHERE role = 'admin';
    
    -- Log if this creates more than 5 admins (suspicious)
    IF admin_count >= 5 THEN
      -- Insert into notifications for all existing admins
      INSERT INTO public.notifications (user_id, title, message, type, priority, metadata)
      SELECT 
        ur.user_id,
        '🚨 Security Alert: New Admin Assignment',
        'A new admin role has been assigned. Current admin count: ' || (admin_count + 1),
        'security',
        'high',
        jsonb_build_object(
          'new_admin_id', NEW.user_id,
          'assigned_by', NEW.assigned_by,
          'total_admins', admin_count + 1
        )
      FROM public.user_roles ur
      WHERE ur.role = 'admin' AND ur.user_id != NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role assignment monitoring
DROP TRIGGER IF EXISTS monitor_role_assignments_trigger ON public.user_roles;
CREATE TRIGGER monitor_role_assignments_trigger
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.monitor_role_assignments();