-- =============================================
-- A. Update trigger: set 48h expiration on bid_submitted instead of clearing it
-- =============================================
CREATE OR REPLACE FUNCTION public.set_assignment_bid_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set 24-hour expiration when a new assignment is created with bid_pending
  IF NEW.status = 'bid_pending' AND NEW.expires_at IS NULL THEN
    NEW.expires_at = NOW() + INTERVAL '24 hours';
  END IF;

  -- Set 48-hour shopper decision window when traveler submits bid
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'bid_submitted' AND OLD.status = 'bid_pending' THEN
      NEW.expires_at = NOW() + INTERVAL '48 hours';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================
-- B. Update expire_unresponded_assignments to also expire bid_submitted
-- =============================================
CREATE OR REPLACE FUNCTION public.expire_unresponded_assignments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER := 0;
  package_record RECORD;
  assignment_record RECORD;
  traveler_name TEXT;
  admin_user_id UUID;
  remaining_active INTEGER;
BEGIN
  -- ==========================================
  -- PART 1: Original logic for packages table
  -- ==========================================
  FOR package_record IN 
    SELECT p.id, p.user_id, p.item_description, p.matched_trip_id, p.purchase_origin, p.package_destination,
           t.user_id as traveler_id
    FROM public.packages p
    LEFT JOIN public.trips t ON t.id = p.matched_trip_id
    WHERE p.status = 'matched' 
      AND p.matched_assignment_expires_at IS NOT NULL 
      AND p.matched_assignment_expires_at < NOW()
  LOOP
    SELECT CONCAT(first_name, ' ', last_name) INTO traveler_name
    FROM public.profiles 
    WHERE id = package_record.traveler_id;
    
    UPDATE public.packages 
    SET 
      status = 'approved',
      matched_trip_id = NULL,
      matched_assignment_expires_at = NULL,
      updated_at = NOW()
    WHERE id = package_record.id;
    
    expired_count := expired_count + 1;
    
    IF package_record.traveler_id IS NOT NULL THEN
      PERFORM public.create_notification(
        package_record.traveler_id,
        '⏰ Asignación de paquete expirada',
        CONCAT('Tu asignación para el paquete "', package_record.item_description, '" ha expirado por falta de respuesta.'),
        'package',
        'normal',
        NULL,
        jsonb_build_object(
          'package_id', package_record.id,
          'expiration_type', 'assignment_expired',
          'action', 'returned_to_approved'
        )
      );
    END IF;
    
    FOR admin_user_id IN 
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      PERFORM public.create_notification(
        admin_user_id,
        '📦 Paquete disponible para reasignación',
        CONCAT('El paquete "', package_record.item_description, '" está nuevamente disponible (expiró por falta de respuesta).'),
        'package',
        'normal',
        NULL,
        jsonb_build_object(
          'package_id', package_record.id,
          'previous_traveler_id', package_record.traveler_id,
          'action', 'ready_for_reassignment'
        )
      );
    END LOOP;
  END LOOP;

  -- ==========================================
  -- PART 2: Logic for package_assignments
  -- ==========================================
  
  -- Step 2a: Expire individual bid_pending assignments past their expires_at
  FOR assignment_record IN
    SELECT pa.id, pa.package_id, pa.trip_id,
           p.item_description,
           t.user_id as traveler_id
    FROM public.package_assignments pa
    JOIN public.packages p ON p.id = pa.package_id
    JOIN public.trips t ON t.id = pa.trip_id
    WHERE pa.status = 'bid_pending'
      AND pa.expires_at IS NOT NULL
      AND pa.expires_at < NOW()
  LOOP
    UPDATE public.package_assignments
    SET status = 'bid_expired', updated_at = NOW(), expires_at = NULL
    WHERE id = assignment_record.id;

    expired_count := expired_count + 1;

    IF assignment_record.traveler_id IS NOT NULL THEN
      SELECT CONCAT(first_name, ' ', last_name) INTO traveler_name
      FROM public.profiles WHERE id = assignment_record.traveler_id;

      PERFORM public.create_notification(
        assignment_record.traveler_id,
        '⏰ Asignación expirada',
        CONCAT('Tu asignación para "', assignment_record.item_description, '" ha expirado por falta de respuesta.'),
        'package',
        'normal',
        NULL,
        jsonb_build_object(
          'package_id', assignment_record.package_id,
          'assignment_id', assignment_record.id,
          'expiration_type', 'bid_expired'
        )
      );
    END IF;
  END LOOP;

  -- Step 2c: Expire bid_submitted assignments past shopper decision window (48h)
  FOR assignment_record IN
    SELECT pa.id, pa.package_id, pa.trip_id,
           p.item_description, p.user_id as shopper_id,
           t.user_id as traveler_id
    FROM public.package_assignments pa
    JOIN public.packages p ON p.id = pa.package_id
    JOIN public.trips t ON t.id = pa.trip_id
    WHERE pa.status = 'bid_submitted'
      AND pa.expires_at IS NOT NULL
      AND pa.expires_at < NOW()
  LOOP
    UPDATE public.package_assignments
    SET status = 'bid_expired', updated_at = NOW(), expires_at = NULL
    WHERE id = assignment_record.id;

    expired_count := expired_count + 1;

    -- Notify traveler that their bid expired
    IF assignment_record.traveler_id IS NOT NULL THEN
      PERFORM public.create_notification(
        assignment_record.traveler_id,
        '⏰ Tu cotización ha expirado',
        CONCAT('Tu cotización para "', assignment_record.item_description, '" expiró porque el comprador no seleccionó un ganador a tiempo.'),
        'package',
        'normal',
        NULL,
        jsonb_build_object(
          'package_id', assignment_record.package_id,
          'assignment_id', assignment_record.id,
          'expiration_type', 'bid_submitted_expired'
        )
      );
    END IF;

    -- Notify shopper that the bid expired
    IF assignment_record.shopper_id IS NOT NULL THEN
      PERFORM public.create_notification(
        assignment_record.shopper_id,
        '⏰ Cotización de viajero expirada',
        CONCAT('Una cotización para "', assignment_record.item_description, '" expiró porque no fue seleccionada a tiempo.'),
        'package',
        'normal',
        NULL,
        jsonb_build_object(
          'package_id', assignment_record.package_id,
          'assignment_id', assignment_record.id,
          'expiration_type', 'bid_submitted_expired'
        )
      );
    END IF;
  END LOOP;

  -- Step 2b: For each affected package, check if ALL assignments are terminal
  -- If so, return the package to 'approved'
  FOR package_record IN
    SELECT DISTINCT p.id, p.item_description, p.user_id, p.status as pkg_status
    FROM public.packages p
    WHERE EXISTS (
      SELECT 1 FROM public.package_assignments pa
      WHERE pa.package_id = p.id AND pa.status = 'bid_expired'
    )
    AND p.matched_trip_id IS NULL
    AND p.status NOT IN ('pending_purchase', 'payment_pending', 'paid', 'in_transit', 
                          'received_by_traveler', 'pending_office_confirmation', 
                          'delivered_to_office', 'out_for_delivery', 'completed', 
                          'completed_paid', 'cancelled', 'approved', 'deadline_expired')
  LOOP
    SELECT COUNT(*) INTO remaining_active
    FROM public.package_assignments pa
    WHERE pa.package_id = package_record.id
      AND pa.status IN ('bid_pending', 'bid_submitted', 'bid_won');

    IF remaining_active = 0 THEN
      UPDATE public.packages
      SET status = 'approved',
          matched_trip_id = NULL,
          matched_assignment_expires_at = NULL,
          updated_at = NOW()
      WHERE id = package_record.id;

      FOR admin_user_id IN
        SELECT user_id FROM public.user_roles WHERE role = 'admin'
      LOOP
        PERFORM public.create_notification(
          admin_user_id,
          '📦 Paquete sin viajeros activos',
          CONCAT('Todos los viajeros asignados a "', package_record.item_description, '" expiraron sin responder. El paquete vuelve a solicitudes pendientes.'),
          'package',
          'high',
          NULL,
          jsonb_build_object(
            'package_id', package_record.id,
            'action', 'all_assignments_expired'
          )
        );
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE 'Processed % expired assignments', expired_count;
END;
$$;

-- =============================================
-- C. Retroactive fix: set 48h expiration on existing bid_submitted without expires_at
-- =============================================
UPDATE public.package_assignments
SET expires_at = NOW() + INTERVAL '48 hours'
WHERE status = 'bid_submitted'
  AND expires_at IS NULL;