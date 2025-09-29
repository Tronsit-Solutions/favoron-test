-- Update RLS policy for favoron_company_information to allow authenticated users to read public company info
DROP POLICY IF EXISTS "Only admins can view company information" ON public.favoron_company_information;

CREATE POLICY "Authenticated users can view company information" 
ON public.favoron_company_information 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Update get_favoron_bank_info function to simplify access checks for public information
CREATE OR REPLACE FUNCTION public.get_favoron_bank_info(_package_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(bank_name text, account_number text, account_holder text, account_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Since Favoron's banking info is public, authenticated users can access it
  -- Admin check is only needed for package-specific context
  IF _package_id IS NOT NULL THEN
    -- Verify user has access to the specific package (owner or admin)
    IF NOT EXISTS(
      SELECT 1 FROM public.packages p
      WHERE p.id = _package_id 
        AND (p.user_id = auth.uid() OR EXISTS(
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        ))
    ) THEN
      RAISE EXCEPTION 'Access denied: insufficient permissions for package';
    END IF;
  END IF;

  -- Return public company banking information
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
END;
$function$;