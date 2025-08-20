-- Harden function: set search_path to public to satisfy linter
CREATE OR REPLACE FUNCTION public.update_favoron_bank_accounts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;