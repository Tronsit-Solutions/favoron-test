-- 1) Fix admin confirmation function to validate passed _admin_id and match auth.uid()
CREATE OR REPLACE FUNCTION public.admin_confirm_office_delivery(_package_id uuid, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Ensure the caller matches the provided admin id and has admin role
  IF auth.uid() IS NULL OR auth.uid() != _admin_id THEN
    RAISE EXCEPTION 'Solo los administradores pueden confirmar entregas en oficina';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _admin_id AND ur.role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Solo los administradores pueden confirmar entregas en oficina';
  END IF;

  -- Confirm reception at office and change status to delivered_to_office
  UPDATE public.packages
  SET 
    status = 'delivered_to_office',
    office_delivery = office_delivery || jsonb_build_object(
      'admin_confirmation', jsonb_build_object(
        'confirmed_by', _admin_id,
        'confirmed_at', NOW()
      )
    ),
    updated_at = NOW()
  WHERE id = _package_id
    AND status = 'pending_office_confirmation'
    AND office_delivery IS NOT NULL
    AND office_delivery->>'traveler_declaration' IS NOT NULL;

  -- If nothing was updated, report the reason
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo confirmar: estado inválido o falta la declaración del viajero';
  END IF;

  -- Log admin action
  PERFORM log_admin_action(
    _package_id::uuid, 
    _admin_id::uuid, 
    'office_delivery_confirmation'::text, 
    'Admin confirmed office delivery - Status changed to: delivered_to_office'::text,
    jsonb_build_object(
      'confirmation_timestamp', NOW(),
      'new_status', 'delivered_to_office'
    )::jsonb
  );
END;
$function$;

-- 2) Fix ambiguous column in trip payment accumulator and use EXCLUDED for clarity
CREATE OR REPLACE FUNCTION public.update_trip_payment_accumulator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  trip_traveler_id UUID;
  tip_amount DECIMAL;
  total_packages INTEGER;
  delivered_packages INTEGER;
  all_delivered BOOLEAN;
BEGIN
  -- Process only when status changes to delivered_to_office with both confirmations
  IF (NEW.status = 'delivered_to_office' 
      AND NEW.office_delivery IS NOT NULL 
      AND NEW.office_delivery->>'traveler_declaration' IS NOT NULL
      AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL)
     AND (OLD.status != 'delivered_to_office' 
          OR OLD.office_delivery IS NULL 
          OR OLD.office_delivery->>'traveler_declaration' IS NULL
          OR OLD.office_delivery->>'admin_confirmation' IS NULL) THEN
    
    -- Get traveler id from the trip
    SELECT t.user_id INTO trip_traveler_id
    FROM public.trips t
    WHERE t.id = NEW.matched_trip_id;
    
    -- Tip amount for this package
    tip_amount := COALESCE((NEW.quote->>'price')::DECIMAL, 0);
    
    -- Count total packages in the trip (excluding rejected/cancelled)
    SELECT COUNT(*) INTO total_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id
      AND status NOT IN ('rejected', 'cancelled');
    
    -- Count delivered packages (with both confirmations)
    SELECT COUNT(*) INTO delivered_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id 
      AND status = 'delivered_to_office'
      AND office_delivery IS NOT NULL
      AND office_delivery->>'traveler_declaration' IS NOT NULL
      AND office_delivery->>'admin_confirmation' IS NOT NULL;
    
    -- Determine if all packages are delivered
    all_delivered := (total_packages > 0 AND delivered_packages = total_packages);
    
    -- Insert or update accumulator (do NOT change trip status here)
    INSERT INTO public.trip_payment_accumulator (
      trip_id, 
      traveler_id, 
      accumulated_amount, 
      delivered_packages_count,
      total_packages_count,
      all_packages_delivered
    )
    VALUES (
      NEW.matched_trip_id, 
      trip_traveler_id, 
      tip_amount,
      delivered_packages,
      total_packages,
      all_delivered
    )
    ON CONFLICT (trip_id, traveler_id) 
    DO UPDATE SET
      accumulated_amount = trip_payment_accumulator.accumulated_amount + EXCLUDED.accumulated_amount,
      delivered_packages_count = EXCLUDED.delivered_packages_count,
      total_packages_count = EXCLUDED.total_packages_count,
      all_packages_delivered = EXCLUDED.all_packages_delivered,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;