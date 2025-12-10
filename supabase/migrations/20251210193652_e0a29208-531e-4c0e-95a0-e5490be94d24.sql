-- Modificar admin_confirm_office_delivery para crear/actualizar trip_payment_accumulator automáticamente
CREATE OR REPLACE FUNCTION public.admin_confirm_office_delivery(_package_id uuid, _admin_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_admin_or_ops BOOLEAN;
  current_status TEXT;
  current_label_number INTEGER;
  new_label_number INTEGER;
  v_matched_trip_id UUID;
  v_traveler_id UUID;
  v_accumulated_amount NUMERIC := 0;
  v_delivered_count INTEGER := 0;
  v_total_count INTEGER := 0;
  v_all_delivered BOOLEAN := false;
BEGIN
  -- Verificar si el usuario es admin u operations
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id 
    AND role IN ('admin', 'operations')
  ) INTO is_admin_or_ops;
  
  IF NOT is_admin_or_ops THEN
    RAISE EXCEPTION 'Solo administradores u operaciones pueden confirmar entregas en oficina';
  END IF;

  -- Obtener el status actual y label_number del paquete
  SELECT status, label_number, matched_trip_id
  INTO current_status, current_label_number, v_matched_trip_id
  FROM public.packages 
  WHERE id = _package_id;
  
  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Paquete no encontrado';
  END IF;

  -- Validar que el paquete esté en un estado válido para confirmar
  IF current_status NOT IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation') THEN
    RAISE EXCEPTION 'El paquete no está en un estado válido para confirmar entrega. Estado actual: %', current_status;
  END IF;

  -- Asignar label number si no tiene uno
  IF current_label_number IS NULL THEN
    SELECT get_next_label_number() INTO new_label_number;
  ELSE
    new_label_number := current_label_number;
  END IF;

  -- Actualizar el paquete
  UPDATE public.packages 
  SET 
    status = 'delivered_to_office',
    label_number = new_label_number,
    office_delivery = COALESCE(office_delivery, '{}'::jsonb) || jsonb_build_object(
      'admin_confirmation', jsonb_build_object(
        'confirmed_by', _admin_id,
        'confirmed_at', NOW(),
        'previous_status', current_status
      )
    ),
    updated_at = NOW()
  WHERE id = _package_id;

  -- Log de la acción administrativa
  PERFORM log_admin_action(
    _package_id,
    _admin_id,
    'office_delivery_confirmed',
    'Paquete confirmado como entregado en oficina',
    jsonb_build_object(
      'previous_status', current_status,
      'new_status', 'delivered_to_office',
      'label_number', new_label_number
    )
  );

  -- === CREAR/ACTUALIZAR TRIP PAYMENT ACCUMULATOR ===
  -- Obtener traveler_id del viaje
  IF v_matched_trip_id IS NOT NULL THEN
    SELECT t.user_id INTO v_traveler_id
    FROM public.trips t
    WHERE t.id = v_matched_trip_id;

    IF v_traveler_id IS NOT NULL THEN
      -- Calcular monto acumulado de paquetes completados/entregados en oficina
      SELECT 
        COALESCE(SUM(COALESCE((quote->>'price')::numeric, 0)), 0),
        COUNT(*)
      INTO v_accumulated_amount, v_delivered_count
      FROM public.packages
      WHERE matched_trip_id = v_matched_trip_id
        AND status IN ('completed', 'delivered_to_office')
        AND quote IS NOT NULL;

      -- Contar total de paquetes elegibles (in_transit o posterior)
      SELECT COUNT(*)
      INTO v_total_count
      FROM public.packages
      WHERE matched_trip_id = v_matched_trip_id
        AND status IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed');

      v_all_delivered := (v_total_count > 0 AND v_delivered_count = v_total_count);

      -- Insertar o actualizar el acumulador (usando trip_id como constraint único)
      INSERT INTO public.trip_payment_accumulator (
        trip_id, traveler_id, accumulated_amount, 
        delivered_packages_count, total_packages_count, 
        all_packages_delivered, payment_order_created
      ) VALUES (
        v_matched_trip_id, v_traveler_id, v_accumulated_amount,
        v_delivered_count, v_total_count, v_all_delivered, false
      )
      ON CONFLICT (trip_id) DO UPDATE SET
        accumulated_amount = EXCLUDED.accumulated_amount,
        delivered_packages_count = EXCLUDED.delivered_packages_count,
        total_packages_count = EXCLUDED.total_packages_count,
        all_packages_delivered = EXCLUDED.all_packages_delivered,
        updated_at = NOW();

      RAISE NOTICE 'Trip payment accumulator updated: trip=%, traveler=%, amount=Q%, delivered=%/%', 
        v_matched_trip_id, v_traveler_id, v_accumulated_amount, v_delivered_count, v_total_count;
    END IF;
  END IF;

  RAISE NOTICE 'Paquete % confirmado en oficina por admin/ops %', _package_id, _admin_id;
END;
$function$;