
-- 1. Update shopper_accept_assignment: DON'T reject losers, keep them as quote_sent
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
  
  -- Keep other quote_sent assignments alive (shopper can change mind before payment)
  -- They will be rejected when accept_quote runs (payment confirmation)
END;
$$;

-- 2. Update accept_quote: reject all non-accepted assignments when moving to payment_pending
CREATE OR REPLACE FUNCTION public.accept_quote(_package_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg RECORD;
BEGIN
  -- Obtener paquete y bloquear fila para evitar condiciones de carrera
  SELECT p.*
  INTO v_pkg
  FROM public.packages p
  WHERE p.id = _package_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paquete no encontrado';
  END IF;

  -- Validar que quien llama sea el shopper dueño del paquete
  IF auth.uid() IS NULL OR auth.uid() <> v_pkg.user_id THEN
    RAISE EXCEPTION 'No tienes permisos para aceptar esta cotización';
  END IF;

  -- Validar estado y expiración
  IF v_pkg.status IS DISTINCT FROM 'quote_sent' THEN
    RAISE EXCEPTION 'Solo puedes aceptar cotizaciones en estado quote_sent';
  END IF;

  IF v_pkg.quote_expires_at IS NOT NULL AND v_pkg.quote_expires_at < NOW() THEN
    RAISE EXCEPTION 'La cotización ha expirado';
  END IF;

  -- Actualizar a payment_pending
  UPDATE public.packages
  SET 
    status = 'payment_pending',
    updated_at = NOW()
  WHERE id = _package_id;

  -- Reject all non-accepted assignments (losers)
  UPDATE public.package_assignments 
  SET status = 'rejected', updated_at = NOW()
  WHERE package_id = _package_id AND status != 'quote_accepted';

  -- Notificar al shopper: subir comprobante
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
