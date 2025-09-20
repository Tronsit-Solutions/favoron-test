-- Fix get_favoron_bank_info function to query the correct table
CREATE OR REPLACE FUNCTION public.get_favoron_bank_info(_package_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(bank_name text, account_number text, account_holder text, account_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_has_access BOOLEAN := false;
BEGIN
  -- Check if user has access (admin or owner of package with quote)
  IF _package_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.packages p
      WHERE p.id = _package_id 
        AND (p.user_id = auth.uid() OR EXISTS(
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        ))
        AND p.quote IS NOT NULL
    ) INTO user_has_access;
  ELSE
    -- Check if user is admin for general access
    SELECT EXISTS(
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    ) INTO user_has_access;
  END IF;

  -- Return data if user has access
  IF user_has_access THEN
    RETURN QUERY
    SELECT 
      fci.bank_name,
      fci.account_number,
      fci.account_holder,
      fci.account_type
    FROM public.favoron_company_information fci
    WHERE fci.is_active = true
    ORDER BY fci.updated_at DESC
    LIMIT 1;
  ELSE
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;
END;
$function$;