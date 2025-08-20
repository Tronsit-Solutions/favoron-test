
CREATE OR REPLACE FUNCTION public.admin_confirm_office_delivery(_package_id uuid, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Asegurar que solo admins puedan confirmar
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Solo los administradores pueden confirmar entregas en oficina';
  END IF;

  -- Confirmar recepción en oficina y cambiar el estado a delivered_to_office
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
    AND office_delivery->>'traveler_declaration' IS NOT NULL;

  -- Si no se actualizó ningún registro, informar la causa
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo confirmar: estado inválido o falta la declaración del viajero';
  END IF;

  -- Log de acción de admin
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
$function$;
