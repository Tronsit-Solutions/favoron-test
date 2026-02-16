
CREATE OR REPLACE FUNCTION public.admin_confirm_office_delivery(_package_id uuid, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  pkg_record RECORD;
  v_tip NUMERIC;
  v_products_array JSONB;
  v_product JSONB;
  v_active_tip_sum NUMERIC;
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
  IF v_matched_trip_id IS NOT NULL THEN
    SELECT t.user_id INTO v_traveler_id
    FROM public.trips t
    WHERE t.id = v_matched_trip_id;

    IF v_traveler_id IS NOT NULL THEN
      -- Calcular monto acumulado de paquetes entregados
      -- Incluir TODOS los estados post-entrega: completed, delivered_to_office, ready_for_pickup, ready_for_delivery
      -- Excluir paquetes con incident_flag = true
      FOR pkg_record IN
        SELECT id, quote, status, products_data, admin_assigned_tip
        FROM public.packages
        WHERE matched_trip_id = v_matched_trip_id
          AND status IN ('completed', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery')
          AND quote IS NOT NULL
          AND (incident_flag IS NULL OR incident_flag = false)
      LOOP
        v_tip := 0;
        
        -- Replicate getActiveTipFromPackage logic:
        -- 1. If products_data exists, sum only non-cancelled products' adminAssignedTip
        -- 2. Fallback to admin_assigned_tip
        -- 3. Fallback to quote.price
        IF pkg_record.products_data IS NOT NULL AND jsonb_typeof(pkg_record.products_data) = 'array' AND jsonb_array_length(pkg_record.products_data) > 0 THEN
          v_active_tip_sum := 0;
          FOR v_product IN SELECT * FROM jsonb_array_elements(pkg_record.products_data)
          LOOP
            -- Only sum tips from non-cancelled products
            IF NOT COALESCE((v_product->>'cancelled')::boolean, false) THEN
              v_active_tip_sum := v_active_tip_sum + COALESCE((v_product->>'adminAssignedTip')::numeric, 0);
            END IF;
          END LOOP;
          
          IF v_active_tip_sum > 0 THEN
            v_tip := v_active_tip_sum;
          END IF;
        END IF;
        
        -- Fallback to admin_assigned_tip
        IF v_tip = 0 AND COALESCE(pkg_record.admin_assigned_tip, 0) > 0 THEN
          v_tip := pkg_record.admin_assigned_tip;
        END IF;
        
        -- Fallback to quote.price
        IF v_tip = 0 THEN
          v_tip := COALESCE((pkg_record.quote->>'price')::numeric, 0);
        END IF;
        
        v_accumulated_amount := v_accumulated_amount + v_tip;
        v_delivered_count := v_delivered_count + 1;
      END LOOP;

      -- Contar total de paquetes elegibles (in_transit o posterior)
      -- Incluir ready_for_pickup y ready_for_delivery
      -- Excluir paquetes con incident_flag
      SELECT COUNT(*)
      INTO v_total_count
      FROM public.packages
      WHERE matched_trip_id = v_matched_trip_id
        AND status IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed', 'ready_for_pickup', 'ready_for_delivery')
        AND (incident_flag IS NULL OR incident_flag = false);

      v_all_delivered := (v_total_count > 0 AND v_delivered_count = v_total_count);

      -- Insertar o actualizar el acumulador
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
$$;
