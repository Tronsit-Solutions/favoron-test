-- Update admin_confirm_office_delivery function to use better JSON key existence check
CREATE OR REPLACE FUNCTION public.admin_confirm_office_delivery(_package_id uuid, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Ensure the caller matches the provided admin id and has admin role
  IF auth.uid() IS NULL OR auth.uid() != _admin_id THEN
    RAISE EXCEPTION 'Solo los administradores pueden confirmar entregas en oficina';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _admin_id AND ur.role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Solo los administradores pueden confirmar entregas en oficina';
  END IF;

  -- Confirm reception at office and change status to delivered_to_office
  -- Use ? operator for more reliable JSON key existence check
  UPDATE public.packages
  SET 
    status = 'delivered_to_office',
    office_delivery = office_delivery || jsonb_build_object(
      'admin_confirmation', jsonb_build_object(
        'confirmed_by', _admin_id,
        'confirmed_at', NOW()
      )
    ),
    updated_at = NOW()
  WHERE id = _package_id
    AND status = 'pending_office_confirmation'
    AND office_delivery IS NOT NULL
    AND office_delivery ? 'traveler_declaration';

  -- If nothing was updated, report the reason
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo confirmar: estado inválido o falta la declaración del viajero';
  END IF;

  -- Log admin action
  PERFORM log_admin_action(
    _package_id::uuid, 
    _admin_id::uuid, 
    'office_delivery_confirmation'::text, 
    'Admin confirmed office delivery - Status changed to: delivered_to_office'::text,
    jsonb_build_object(
      'confirmation_timestamp', NOW(),
      'new_status', 'delivered_to_office'
    )::jsonb
  );
END;
$function$