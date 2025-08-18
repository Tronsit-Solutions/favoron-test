-- Create RPC function for travelers to reject assigned packages
CREATE OR REPLACE FUNCTION public.traveler_reject_assignment(
  _package_id uuid,
  _rejection_reason text DEFAULT NULL,
  _wants_requote boolean DEFAULT false,
  _additional_comments text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  package_traveler_id UUID;
  package_shopper_id UUID;
  package_item_description TEXT;
  admin_user_id UUID;
BEGIN
  -- Verify that the current user is the assigned traveler
  SELECT t.user_id, p.user_id, p.item_description
  INTO package_traveler_id, package_shopper_id, package_item_description
  FROM public.packages p
  LEFT JOIN public.trips t ON t.id = p.matched_trip_id
  WHERE p.id = _package_id;
  
  -- Check if package exists and user is the assigned traveler
  IF package_traveler_id IS NULL OR package_traveler_id != auth.uid() THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar este paquete o el paquete no existe';
  END IF;
  
  -- Update the package with rejection data and clear trip assignment
  UPDATE public.packages
  SET 
    rejection_reason = _rejection_reason,
    wants_requote = _wants_requote,
    additional_notes = _additional_comments,
    quote = NULL,
    matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    quote_expires_at = NULL,
    matched_assignment_expires_at = NULL,
    admin_assigned_tip = NULL,
    status = CASE 
      WHEN _wants_requote = true AND _rejection_reason != 'no_longer_want' THEN 'approved'
      ELSE 'quote_rejected'
    END,
    updated_at = NOW()
  WHERE id = _package_id;
  
  -- Log admin action
  PERFORM log_admin_action(
    _package_id,
    package_traveler_id,
    'traveler_rejection',
    CONCAT('Traveler rejected assignment. Reason: ', COALESCE(_rejection_reason, 'Not specified'), 
           '. Wants requote: ', _wants_requote::text),
    jsonb_build_object(
      'rejection_reason', _rejection_reason,
      'wants_requote', _wants_requote,
      'additional_comments', _additional_comments
    )
  );
  
  -- Notify shopper about rejection
  PERFORM public.create_notification(
    package_shopper_id,
    '❌ Cotización rechazada por el viajero',
    CASE 
      WHEN _wants_requote = true AND _rejection_reason != 'no_longer_want' THEN
        CONCAT('El viajero ha rechazado la asignación para "', package_item_description, '" pero está abierto a una nueva cotización.')
      ELSE
        CONCAT('El viajero ha rechazado definitivamente la asignación para "', package_item_description, '".')
    END,
    'package',
    'normal',
    NULL,
    jsonb_build_object(
      'package_id', _package_id,
      'rejection_reason', _rejection_reason,
      'wants_requote', _wants_requote,
      'change_type', 'traveler_rejection'
    )
  );
  
  -- Notify admins about rejection for reassignment if needed
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_user_id,
      '🔄 Paquete rechazado - Disponible para reasignación',
      CASE 
        WHEN _wants_requote = true AND _rejection_reason != 'no_longer_want' THEN
          CONCAT('El paquete "', package_item_description, '" fue rechazado pero el shopper quiere nueva cotización. Disponible para reasignación.')
        ELSE
          CONCAT('El paquete "', package_item_description, '" fue rechazado definitivamente por el viajero.')
      END,
      'package',
      'normal',
      NULL,
      jsonb_build_object(
        'package_id', _package_id,
        'rejection_reason', _rejection_reason,
        'wants_requote', _wants_requote,
        'action_needed', 'reassign_or_close'
      )
    );
  END LOOP;
  
END;
$function$;