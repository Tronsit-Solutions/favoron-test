-- Update traveler_reject_assignment function to make rejection parameters optional
-- since travelers rejecting admin-assigned tips don't need to provide justifications

CREATE OR REPLACE FUNCTION public.traveler_reject_assignment(_package_id uuid, _rejection_reason text DEFAULT NULL, _wants_requote boolean DEFAULT false, _additional_comments text DEFAULT NULL)
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
  -- For traveler rejections of admin tips, always return to approved status for reassignment
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
    status = 'approved', -- Always return to approved for admin reassignment
    updated_at = NOW()
  WHERE id = _package_id;
  
  -- Log admin action
  PERFORM log_admin_action(
    _package_id,
    package_traveler_id,
    'traveler_rejection',
    'Traveler rejected admin-assigned package',
    jsonb_build_object(
      'rejection_reason', _rejection_reason,
      'wants_requote', _wants_requote,
      'additional_comments', _additional_comments
    )
  );
  
  -- Notify shopper about rejection
  PERFORM public.create_notification(
    package_shopper_id,
    '🔄 Paquete disponible para reasignación',
    CONCAT('El viajero ha rechazado la asignación para "', package_item_description, '". Favorón buscará otro viajero disponible.'),
    'package',
    'normal',
    NULL,
    jsonb_build_object(
      'package_id', _package_id,
      'change_type', 'traveler_rejection'
    )
  );
  
  -- Notify admins about rejection for reassignment
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    PERFORM public.create_notification(
      admin_user_id,
      '🔄 Paquete rechazado - Disponible para reasignación',
      CONCAT('El paquete "', package_item_description, '" fue rechazado por el viajero y está disponible para reasignación.'),
      'package',
      'normal',
      NULL,
      jsonb_build_object(
        'package_id', _package_id,
        'action_needed', 'reassign_package'
      )
    );
  END LOOP;
  
END;
$function$;