
-- 1. Add expires_at column to package_assignments
ALTER TABLE public.package_assignments
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Set expires_at for existing bid_pending assignments (24h from now)
UPDATE public.package_assignments
SET expires_at = NOW() + INTERVAL '24 hours'
WHERE status = 'bid_pending' AND expires_at IS NULL;

-- 3. Trigger function: auto-set expires_at on INSERT
CREATE OR REPLACE FUNCTION public.set_assignment_bid_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Set 24-hour expiration when a new assignment is created with bid_pending
  IF NEW.status = 'bid_pending' AND NEW.expires_at IS NULL THEN
    NEW.expires_at = NOW() + INTERVAL '24 hours';
  END IF;

  -- Clear expires_at when traveler responds (bid_submitted)
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'bid_submitted' AND OLD.status = 'bid_pending' THEN
      NEW.expires_at = NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_assignment_bid_expiration_trigger ON public.package_assignments;
CREATE TRIGGER set_assignment_bid_expiration_trigger
  BEFORE INSERT OR UPDATE ON public.package_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_assignment_bid_expiration();

-- 4. Update expire_unresponded_assignments to also handle package_assignments
CREATE OR REPLACE FUNCTION public.expire_unresponded_assignments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  -- PART 2: New logic for package_assignments
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
    -- Mark individual assignment as expired
    UPDATE public.package_assignments
    SET status = 'bid_expired', updated_at = NOW(), expires_at = NULL
    WHERE id = assignment_record.id;

    expired_count := expired_count + 1;

    -- Notify the traveler
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

  -- Step 2b: For each affected package, check if ALL assignments are terminal
  -- If so, return the package to 'approved'
  FOR package_record IN
    SELECT DISTINCT p.id, p.item_description, p.user_id, p.status as pkg_status
    FROM public.packages p
    WHERE EXISTS (
      SELECT 1 FROM public.package_assignments pa
      WHERE pa.package_id = p.id AND pa.status = 'bid_expired'
    )
    -- Only process packages that don't have a direct matched_trip_id (multi-assignment flow)
    AND p.matched_trip_id IS NULL
    -- Don't touch packages already in advanced states
    AND p.status NOT IN ('pending_purchase', 'payment_pending', 'paid', 'in_transit', 
                         'received_by_traveler', 'pending_office_confirmation', 
                         'delivered_to_office', 'out_for_delivery', 'completed', 
                         'completed_paid', 'cancelled', 'approved', 'deadline_expired')
  LOOP
    -- Count remaining active assignments (bid_pending or bid_submitted or bid_won)
    SELECT COUNT(*) INTO remaining_active
    FROM public.package_assignments pa
    WHERE pa.package_id = package_record.id
      AND pa.status IN ('bid_pending', 'bid_submitted', 'bid_won');

    -- If no active assignments remain, return package to approved
    IF remaining_active = 0 THEN
      UPDATE public.packages
      SET status = 'approved',
          matched_trip_id = NULL,
          matched_assignment_expires_at = NULL,
          updated_at = NOW()
      WHERE id = package_record.id;

      -- Notify admins
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
$function$;
