
-- 1. Rename existing assignment statuses to bid_* prefix
UPDATE package_assignments SET status = 'bid_pending' WHERE status = 'pending';
UPDATE package_assignments SET status = 'bid_submitted' WHERE status = 'quote_sent';
UPDATE package_assignments SET status = 'bid_won' WHERE status = 'quote_accepted';
UPDATE package_assignments SET status = 'bid_lost' WHERE status = 'rejected';
UPDATE package_assignments SET status = 'bid_expired' WHERE status = 'expired';
UPDATE package_assignments SET status = 'bid_cancelled' WHERE status = 'cancelled';

-- 2. Add dismissed_by_traveler column
ALTER TABLE package_assignments ADD COLUMN dismissed_by_traveler boolean NOT NULL DEFAULT false;

-- 3. Update traveler_has_active_assignment — remove all status exclusions
CREATE OR REPLACE FUNCTION public.traveler_has_active_assignment(_user_id uuid, _package_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM package_assignments pa
    JOIN trips t ON t.id = pa.trip_id
    WHERE pa.package_id = _package_id
      AND t.user_id = _user_id
  )
$$;

-- 4. Update shopper_accept_assignment — use new status names
CREATE OR REPLACE FUNCTION public.shopper_accept_assignment(_package_id uuid, _assignment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _assignment record;
  _package record;
BEGIN
  SELECT * INTO _package FROM packages WHERE id = _package_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'No tienes permisos para este paquete'; END IF;
  
  SELECT * INTO _assignment FROM package_assignments 
  WHERE id = _assignment_id AND package_id = _package_id AND status = 'bid_submitted' AND quote IS NOT NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asignación no válida o sin cotización'; END IF;
  
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
  
  UPDATE package_assignments SET status = 'bid_won', updated_at = now()
  WHERE id = _assignment_id;
END;
$$;

-- 5. Update accept_quote — use new status names for rejecting losers
CREATE OR REPLACE FUNCTION public.accept_quote(_package_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg RECORD;
BEGIN
  SELECT p.*
  INTO v_pkg
  FROM public.packages p
  WHERE p.id = _package_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paquete no encontrado';
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> v_pkg.user_id THEN
    RAISE EXCEPTION 'No tienes permisos para aceptar esta cotización';
  END IF;

  IF v_pkg.status IS DISTINCT FROM 'quote_sent' THEN
    RAISE EXCEPTION 'Solo puedes aceptar cotizaciones en estado quote_sent';
  END IF;

  IF v_pkg.quote_expires_at IS NOT NULL AND v_pkg.quote_expires_at < NOW() THEN
    RAISE EXCEPTION 'La cotización ha expirado';
  END IF;

  UPDATE public.packages
  SET 
    status = 'payment_pending',
    updated_at = NOW()
  WHERE id = _package_id;

  -- Reject all non-accepted assignments (losers) using new status names
  UPDATE public.package_assignments 
  SET status = 'bid_lost', updated_at = NOW()
  WHERE package_id = _package_id AND status != 'bid_won';

  PERFORM public.create_notification(
    v_pkg.user_id,
    '💳 Sube tu comprobante de pago',
    CONCAT('Aceptaste la cotización para "', v_pkg.item_description, '". Ahora sube tu comprobante para continuar.'),
    'payment',
    'high',
    NULL,
    jsonb_build_object(
      'package_id', _package_id,
      'next_action', 'upload_payment_receipt'
    )
  );
END;
$$;
