
CREATE OR REPLACE FUNCTION public.admin_confirm_office_delivery(_package_id uuid, _admin_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin BOOLEAN;
  current_status TEXT;
  current_label_number INTEGER;
  has_traveler_declaration BOOLEAN;
  skipped_declaration BOOLEAN := false;
  new_label_number INTEGER;
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

  -- Get current status, label_number, and check for traveler declaration
  SELECT 
    p.status,
    p.label_number,
    CASE WHEN p.office_delivery ? 'traveler_declaration' THEN true ELSE false END
  INTO current_status, current_label_number, has_traveler_declaration
  FROM public.packages p
  WHERE p.id = _package_id;

  -- Check if package exists and is in a valid state for office delivery
  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Paquete no encontrado';
  END IF;

  IF current_status NOT IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation') THEN
    RAISE EXCEPTION 'Estado inválido para confirmación de oficina: %', current_status;
  END IF;

  -- Determine if we're skipping traveler declaration
  IF NOT has_traveler_declaration THEN
    skipped_declaration := true;
  END IF;

  -- Assign label_number if package doesn't have one yet
  IF current_label_number IS NULL THEN
    new_label_number := get_next_label_number();
  ELSE
    new_label_number := current_label_number;
  END IF;

  -- Confirm reception at office and change status to delivered_to_office
  UPDATE public.packages
  SET 
    status = 'delivered_to_office',
    label_number = new_label_number,
    office_delivery = COALESCE(office_delivery, '{}'::jsonb) || jsonb_build_object(
      'admin_confirmation', jsonb_build_object(
        'confirmed_by', _admin_id,
        'confirmed_at', NOW(),
        'skipped_traveler_declaration', skipped_declaration,
        'label_number_assigned', new_label_number
      )
    ),
    updated_at = NOW()
  WHERE id = _package_id;

  -- If nothing was updated, something went wrong
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo confirmar la entrega en oficina';
  END IF;

  -- Log admin action with additional context
  PERFORM log_admin_action(
    _package_id::uuid, 
    _admin_id::uuid, 
    'office_delivery_confirmation'::text, 
    CASE 
      WHEN skipped_declaration THEN 'Admin confirmed office delivery (skipped traveler declaration) - Status changed to: delivered_to_office, Label #' || new_label_number
      ELSE 'Admin confirmed office delivery - Status changed to: delivered_to_office, Label #' || new_label_number
    END::text,
    jsonb_build_object(
      'confirmation_timestamp', NOW(),
      'new_status', 'delivered_to_office',
      'previous_status', current_status,
      'skipped_traveler_declaration', skipped_declaration,
      'had_traveler_declaration', has_traveler_declaration,
      'label_number', new_label_number
    )::jsonb
  );
END;
$function$;
