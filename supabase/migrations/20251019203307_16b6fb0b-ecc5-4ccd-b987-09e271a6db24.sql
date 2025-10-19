-- Update admin_update_trust_level to use verify_admin_access and improve security
CREATE OR REPLACE FUNCTION public.admin_update_trust_level(
  _target_user_id uuid,
  _trust_level public.trust_level
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure caller is authenticated admin using verify_admin_access
  IF NOT verify_admin_access() THEN
    RAISE EXCEPTION 'Solo los administradores pueden actualizar el nivel de confianza';
  END IF;

  -- Prevent using this function for PRIME (use dedicated flow)
  IF _trust_level = 'prime'::public.trust_level THEN
    RAISE EXCEPTION 'Usa admin_assign_prime_membership para asignar nivel PRIME';
  END IF;

  -- Update profile trust level and clear prime expiration when not PRIME
  UPDATE public.profiles
  SET 
    trust_level = _trust_level,
    prime_expires_at = NULL,
    updated_at = NOW()
  WHERE id = _target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado para el ID de usuario proporcionado';
  END IF;

  RAISE NOTICE '✅ Trust level updated to % for user % by admin %', _trust_level, _target_user_id, auth.uid();
END;
$$;