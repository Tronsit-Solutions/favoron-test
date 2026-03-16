
CREATE OR REPLACE FUNCTION shopper_accept_assignment(_package_id uuid, _assignment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _assignment record;
  _package record;
BEGIN
  -- Verify package ownership
  SELECT * INTO _package FROM packages WHERE id = _package_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'No tienes permisos para este paquete'; END IF;
  
  -- Get winning assignment with quote
  SELECT * INTO _assignment FROM package_assignments 
  WHERE id = _assignment_id AND package_id = _package_id AND status = 'quote_sent' AND quote IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asignación no válida o sin cotización'; END IF;
  
  -- Update package with winning traveler's data
  UPDATE packages SET
    matched_trip_id = _assignment.trip_id,
    quote = _assignment.quote,
    admin_assigned_tip = _assignment.admin_assigned_tip,
    traveler_address = _assignment.traveler_address,
    matched_trip_dates = _assignment.matched_trip_dates,
    status = 'quote_sent',
    quote_expires_at = _assignment.quote_expires_at,
    products_data = COALESCE(_assignment.products_data, packages.products_data),
    updated_at = now()
  WHERE id = _package_id;
  
  -- Accept winning assignment
  UPDATE package_assignments SET status = 'quote_accepted', updated_at = now()
  WHERE id = _assignment_id;
  
  -- Reject all other assignments
  UPDATE package_assignments SET status = 'rejected', updated_at = now()
  WHERE package_id = _package_id AND id != _assignment_id;
END;
$$;
