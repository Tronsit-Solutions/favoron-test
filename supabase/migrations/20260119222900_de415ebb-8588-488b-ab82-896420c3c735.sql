-- Corregir la función traveler_reject_assignment para guardar comentarios en internal_notes
CREATE OR REPLACE FUNCTION public.traveler_reject_assignment(
  _package_id UUID,
  _rejection_reason TEXT DEFAULT NULL,
  _additional_comments TEXT DEFAULT NULL,
  _wants_requote BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_package packages;
  v_trip_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get package info
  SELECT * INTO v_package FROM packages WHERE id = _package_id;
  IF v_package.id IS NULL THEN
    RAISE EXCEPTION 'Paquete no encontrado';
  END IF;
  
  -- Get trip ID before clearing
  v_trip_id := v_package.matched_trip_id;
  
  -- Verify user is the traveler for this trip
  IF NOT EXISTS (
    SELECT 1 FROM trips WHERE id = v_trip_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar este paquete';
  END IF;
  
  -- Update the package - CORREGIDO: usar internal_notes en lugar de additional_notes
  UPDATE public.packages
  SET 
    rejection_reason = _rejection_reason,
    wants_requote = _wants_requote,
    internal_notes = _additional_comments,  -- ✅ CORREGIDO: antes era additional_notes
    quote = NULL,
    matched_trip_id = NULL,
    traveler_address = NULL,
    matched_trip_dates = NULL,
    quote_expires_at = NULL,
    admin_assigned_tip = NULL,
    products_data = CASE 
      WHEN products_data IS NOT NULL THEN 
        (SELECT jsonb_agg(
          p - 'adminAssignedTip' - 'tipNotes'
        ) FROM jsonb_array_elements(products_data::jsonb) AS p)::json
      ELSE NULL 
    END,
    status = 'approved',
    traveler_rejection = jsonb_build_object(
      'rejected_at', now(),
      'rejected_by', v_user_id,
      'rejection_reason', _rejection_reason,
      'additional_comments', _additional_comments,
      'previous_trip_id', v_trip_id
    )
  WHERE id = _package_id;
  
END;
$$;