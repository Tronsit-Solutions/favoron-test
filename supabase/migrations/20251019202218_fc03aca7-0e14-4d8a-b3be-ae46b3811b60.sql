-- Create admin function to update non-prime trust levels safely
CREATE OR REPLACE FUNCTION public.admin_update_trust_level(
  _target_user_id uuid,
  _trust_level public.trust_level
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Ensure caller is authenticated admin
  SELECT public.has_role(auth.uid(), 'admin') INTO is_admin;
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can update trust level';
  END IF;

  -- Prevent using this function for PRIME (use dedicated flow)
  IF _trust_level = 'prime'::public.trust_level THEN
    RAISE EXCEPTION 'Use admin_assign_prime_membership to set PRIME trust level';
  END IF;

  -- Update profile trust level and clear prime expiration when not PRIME
  UPDATE public.profiles
  SET 
    trust_level = _trust_level,
    prime_expires_at = NULL,
    updated_at = NOW()
  WHERE id = _target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for the provided user id';
  END IF;
END;
$$;