-- Create secure function to expose Favorón bank info to eligible shoppers
CREATE OR REPLACE FUNCTION public.get_favoron_bank_info(_package_id uuid)
RETURNS TABLE(
  bank_name text,
  account_holder text,
  account_number text,
  account_type text
) AS $$
DECLARE
  is_admin BOOLEAN := FALSE;
  is_owner BOOLEAN := FALSE;
  has_quote BOOLEAN := FALSE;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check admin role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) INTO is_admin;

  -- Check package ownership and quote presence
  SELECT (p.user_id = auth.uid()) AS is_owner_check,
         (p.quote IS NOT NULL)     AS has_quote_check
  INTO is_owner, has_quote
  FROM public.packages p
  WHERE p.id = _package_id;

  -- Allow if admin OR (package owner and package has a quote)
  IF is_admin OR (is_owner AND has_quote) THEN
    RETURN QUERY
      SELECT fba.bank_name,
             fba.account_holder,
             fba.account_number,
             fba.account_type
      FROM public.favoron_bank_accounts fba
      WHERE fba.is_active = TRUE
      ORDER BY fba.updated_at DESC
      LIMIT 1;
  ELSE
    RAISE EXCEPTION 'Unauthorized to view Favorón bank account for this package';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

-- Ensure authenticated users can execute the function
REVOKE ALL ON FUNCTION public.get_favoron_bank_info(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_favoron_bank_info(uuid) TO authenticated;
-- Admins will also have execute via authenticated; service role implicitly allowed.
