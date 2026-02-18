
CREATE OR REPLACE FUNCTION public.traveler_reject_assignment(
  _package_id uuid,
  _rejection_reason text DEFAULT NULL,
  _additional_comments text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _current_user_id uuid := auth.uid();
  _package_record RECORD;
  _trip_record RECORD;
  _previous_tip numeric;
  _previous_quote_price text;
  _previous_products_tips jsonb;
BEGIN
  -- Verify authenticated user
  IF _current_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Get package and verify it belongs to user's matched trip
  SELECT p.*, t.user_id as trip_owner_id, t.id as trip_id
  INTO _package_record
  FROM packages p
  JOIN trips t ON t.id = p.matched_trip_id
  WHERE p.id = _package_id
    AND t.user_id = _current_user_id
    AND p.status = 'matched';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar este paquete o no está en estado matched';
  END IF;

  -- Store trip info before clearing
  SELECT * INTO _trip_record FROM trips WHERE id = _package_record.matched_trip_id;

  -- Capture tip values BEFORE clearing them
  _previous_tip := _package_record.admin_assigned_tip;
  _previous_quote_price := _package_record.quote->>'price';
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'itemDescription', product->>'itemDescription',
      'adminAssignedTip', product->>'adminAssignedTip'
    )
  )
  INTO _previous_products_tips
  FROM jsonb_array_elements(COALESCE(_package_record.products_data, '[]'::jsonb)) AS product
  WHERE product->>'adminAssignedTip' IS NOT NULL;

  -- Update package: reset to approved, clear match data, save rejection info with previous tip
  UPDATE packages
  SET
    status = 'approved',
    matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    quote = NULL,
    quote_expires_at = NULL,
    matched_assignment_expires_at = NULL,
    admin_assigned_tip = NULL,
    rejection_reason = _rejection_reason,
    internal_notes = CASE 
      WHEN _additional_comments IS NOT NULL THEN 
        COALESCE(internal_notes, '') || E'\n[Traveler Rejection] ' || _additional_comments
      ELSE internal_notes
    END,
    traveler_rejection = jsonb_build_object(
      'rejected_at', NOW(),
      'rejection_reason', _rejection_reason,
      'additional_comments', _additional_comments,
      'previous_trip_id', _package_record.matched_trip_id,
      'previous_traveler_id', _current_user_id,
      'previous_admin_assigned_tip', _previous_tip,
      'previous_quote_price', _previous_quote_price,
      'previous_products_tips', _previous_products_tips
    ),
    -- Agregar al historial de acciones para registro inmutable
    admin_actions_log = COALESCE(admin_actions_log, '[]'::jsonb) || jsonb_build_object(
      'timestamp', NOW(),
      'admin_id', _current_user_id,
      'action_type', 'traveler_rejection',
      'description', 'Traveler rejected admin-assigned package',
      'additional_data', jsonb_build_object(
        'rejection_reason', _rejection_reason,
        'additional_comments', _additional_comments,
        'previous_trip_id', _package_record.matched_trip_id,
        'previous_traveler_id', _current_user_id,
        'previous_admin_assigned_tip', _previous_tip,
        'previous_quote_price', _previous_quote_price,
        'previous_products_tips', _previous_products_tips
      )
    ),
    -- Clean product-level tips from products_data
    products_data = (
      SELECT jsonb_agg(
        product - 'adminAssignedTip'
      )
      FROM jsonb_array_elements(COALESCE(products_data, '[]'::jsonb)) AS product
    ),
    updated_at = NOW()
  WHERE id = _package_id;
END;
$function$;
