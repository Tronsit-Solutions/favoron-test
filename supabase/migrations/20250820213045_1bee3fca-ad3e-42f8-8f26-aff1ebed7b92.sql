-- 1) Restrict direct SELECT on favoron_bank_accounts to admins only
DROP POLICY IF EXISTS "Anyone can view active bank accounts" ON public.favoron_bank_accounts;

CREATE POLICY "Only admins can view bank accounts"
ON public.favoron_bank_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 2) Secure RPC to expose bank data only when appropriate
CREATE OR REPLACE FUNCTION public.get_favoron_bank_info(_package_id uuid)
RETURNS TABLE(bank_name text, account_holder text, account_number text, account_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Admins: always allowed
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) THEN
    RETURN QUERY
    SELECT f.bank_name, f.account_holder, f.account_number, f.account_type
    FROM public.favoron_bank_accounts f
    WHERE f.is_active = true
    ORDER BY f.updated_at DESC
    LIMIT 1;
    RETURN;
  END IF;

  -- Shoppers: only owner of the package AND in payment-related states
  IF EXISTS (
    SELECT 1
    FROM public.packages p
    WHERE p.id = _package_id
      AND p.user_id = auth.uid()
      AND p.status IN ('quote_sent','pending_purchase','payment_pending_approval')
  ) THEN
    RETURN QUERY
    SELECT f.bank_name, f.account_holder, f.account_number, f.account_type
    FROM public.favoron_bank_accounts f
    WHERE f.is_active = true
    ORDER BY f.updated_at DESC
    LIMIT 1;
    RETURN;
  END IF;

  -- Otherwise, return no rows
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_favoron_bank_info(uuid) TO anon, authenticated;