
CREATE OR REPLACE FUNCTION public.traveler_reject_assignment_v2(
  _assignment_id UUID,
  _rejection_reason TEXT DEFAULT NULL,
  _additional_comments TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment RECORD;
  v_remaining_active INT;
BEGIN
  -- Get assignment and verify ownership
  SELECT pa.id, pa.package_id, pa.trip_id, pa.status, t.user_id AS trip_owner
  INTO v_assignment
  FROM package_assignments pa
  JOIN trips t ON t.id = pa.trip_id
  WHERE pa.id = _assignment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found';
  END IF;

  IF v_assignment.trip_owner != auth.uid() THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar esta asignación';
  END IF;

  IF v_assignment.status NOT IN ('bid_pending', 'bid_submitted') THEN
    RAISE EXCEPTION 'Esta asignación ya no puede ser rechazada (status: %)', v_assignment.status;
  END IF;

  -- Update assignment to bid_cancelled
  UPDATE package_assignments
  SET status = 'bid_cancelled',
      updated_at = now()
  WHERE id = _assignment_id;

  -- Store rejection info on the package
  UPDATE packages
  SET traveler_rejection = jsonb_build_object(
        'reason', COALESCE(_rejection_reason, ''),
        'comments', COALESCE(_additional_comments, ''),
        'rejected_at', now()::text,
        'assignment_id', _assignment_id::text
      ),
      admin_actions_log = COALESCE(admin_actions_log, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'action', 'traveler_rejected_assignment',
          'assignment_id', _assignment_id::text,
          'reason', COALESCE(_rejection_reason, ''),
          'comments', COALESCE(_additional_comments, ''),
          'timestamp', now()::text
        )
      ),
      updated_at = now()
  WHERE id = v_assignment.package_id;

  -- Check remaining active assignments
  SELECT COUNT(*) INTO v_remaining_active
  FROM package_assignments
  WHERE package_id = v_assignment.package_id
    AND status IN ('bid_pending', 'bid_submitted');

  -- If no active assignments remain, reset package to approved
  IF v_remaining_active = 0 THEN
    UPDATE packages
    SET status = 'approved',
        admin_assigned_tip = NULL,
        matched_trip_id = NULL,
        updated_at = now()
    WHERE id = v_assignment.package_id;
  END IF;
END;
$$;
