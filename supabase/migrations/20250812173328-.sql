-- Add column for assignment expiration tracking
ALTER TABLE public.packages 
ADD COLUMN matched_assignment_expires_at TIMESTAMP WITH TIME ZONE;

-- Function to expire unresponded assignments (return to approved for manual reassignment)
CREATE OR REPLACE FUNCTION public.expire_unresponded_assignments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  expired_count INTEGER := 0;
  package_record RECORD;
  traveler_name TEXT;
  admin_user_id UUID;
BEGIN
  -- Find and process expired assignments
  FOR package_record IN 
    SELECT p.id, p.user_id, p.item_description, p.matched_trip_id, p.purchase_origin, p.package_destination,
           t.user_id as traveler_id
    FROM public.packages p
    LEFT JOIN public.trips t ON t.id = p.matched_trip_id
    WHERE p.status = 'matched' 
      AND p.matched_assignment_expires_at IS NOT NULL 
      AND p.matched_assignment_expires_at < NOW()
  LOOP
    -- Get traveler name
    SELECT CONCAT(first_name, ' ', last_name) INTO traveler_name
    FROM public.profiles 
    WHERE id = package_record.traveler_id;
    
    -- Return package to approved status for manual reassignment
    UPDATE public.packages 
    SET 
      status = 'approved',
      matched_trip_id = NULL,
      matched_assignment_expires_at = NULL,
      updated_at = NOW()
    WHERE id = package_record.id;
    
    expired_count := expired_count + 1;
    
    -- Notify traveler about assignment expiration
    IF package_record.traveler_id IS NOT NULL THEN
      PERFORM public.create_notification(
        package_record.traveler_id,
        '⏰ Asignación de paquete expirada',
        CONCAT('Tu asignación para el paquete "', package_record.item_description, '" ha expirado por falta de respuesta. El paquete está disponible nuevamente para asignación.'),
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
    
    -- Notify all admins about package re-availability
    FOR admin_user_id IN 
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      PERFORM public.create_notification(
        admin_user_id,
        '📦 Paquete disponible para reasignación',
        CONCAT('El paquete "', package_record.item_description, '" de ', COALESCE(traveler_name, 'un viajero'), ' está nuevamente disponible para asignación manual (expiró por falta de respuesta).'),
        'package',
        'normal',
        NULL,
        jsonb_build_object(
          'package_id', package_record.id,
          'previous_traveler_id', package_record.traveler_id,
          'action', 'ready_for_reassignment',
          'purchase_origin', package_record.purchase_origin,
          'package_destination', package_record.package_destination
        )
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Processed % expired assignments and returned to approved status', expired_count;
END;
$function$;

-- Function to send assignment warnings
CREATE OR REPLACE FUNCTION public.send_assignment_warnings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  package_record RECORD;
  hours_remaining INTEGER;
  warning_title TEXT;
  warning_message TEXT;
  warning_priority TEXT;
BEGIN
  -- Check packages with assignments expiring soon
  FOR package_record IN 
    SELECT p.id, p.user_id, p.item_description, p.matched_trip_id, p.matched_assignment_expires_at,
           t.user_id as traveler_id
    FROM public.packages p
    LEFT JOIN public.trips t ON t.id = p.matched_trip_id
    WHERE p.status = 'matched' 
      AND p.matched_assignment_expires_at IS NOT NULL 
      AND p.matched_assignment_expires_at > NOW()
      AND p.matched_assignment_expires_at <= NOW() + INTERVAL '23 hours'
  LOOP
    -- Calculate hours remaining
    hours_remaining := EXTRACT(EPOCH FROM (package_record.matched_assignment_expires_at - NOW())) / 3600;
    
    -- Determine warning level and message
    IF hours_remaining <= 1 THEN
      -- 23h warning (1 hour left)
      warning_title := '🚨 ¡Última hora para responder!';
      warning_message := CONCAT('Solo queda 1 hora para responder a la asignación del paquete "', package_record.item_description, '". Si no respondes, será reasignado automáticamente.');
      warning_priority := 'urgent';
    ELSIF hours_remaining <= 4 THEN
      -- 20h warning (4 hours left)
      warning_title := '⚠️ Solo quedan 4 horas';
      warning_message := CONCAT('Quedan solo 4 horas para responder a la asignación del paquete "', package_record.item_description, '". ¡No dejes que se vaya!');
      warning_priority := 'high';
    ELSIF hours_remaining <= 12 THEN
      -- 12h warning (12 hours left)
      warning_title := '⏰ Recordatorio: 12 horas restantes';
      warning_message := CONCAT('Tienes 12 horas restantes para responder a la asignación del paquete "', package_record.item_description, '". ¡No olvides enviar tu cotización!');
      warning_priority := 'normal';
    ELSE
      -- Skip if more than 12 hours remaining
      CONTINUE;
    END IF;
    
    -- Send warning to traveler
    IF package_record.traveler_id IS NOT NULL THEN
      PERFORM public.create_notification(
        package_record.traveler_id,
        warning_title,
        warning_message,
        'package',
        warning_priority,
        NULL,
        jsonb_build_object(
          'package_id', package_record.id,
          'warning_type', 'assignment_expiring',
          'hours_remaining', hours_remaining,
          'expires_at', package_record.matched_assignment_expires_at
        )
      );
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Assignment warnings sent successfully';
END;
$function$;

-- Trigger to set assignment expiration when package is matched
CREATE OR REPLACE FUNCTION public.set_assignment_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set 24-hour expiration when status changes to 'matched' and matched_trip_id is set
  IF NEW.status = 'matched' 
     AND NEW.matched_trip_id IS NOT NULL
     AND (OLD.status IS NULL OR OLD.status != 'matched' OR OLD.matched_trip_id IS NULL)
     AND NEW.matched_assignment_expires_at IS NULL THEN
    NEW.matched_assignment_expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  
  -- Clear expiration when quote is sent (traveler responded)
  IF NEW.status = 'quote_sent' AND OLD.status = 'matched' THEN
    NEW.matched_assignment_expires_at = NULL;
  END IF;
  
  -- Clear expiration if status changes away from 'matched'
  IF NEW.status != 'matched' AND OLD.status = 'matched' THEN
    NEW.matched_assignment_expires_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Trigger to handle assignment expiration during updates
CREATE OR REPLACE FUNCTION public.handle_assignment_expiration_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-expire assignment if time has passed during an update operation
  IF NEW.status = 'matched' 
     AND NEW.matched_assignment_expires_at IS NOT NULL 
     AND NEW.matched_assignment_expires_at < NOW() 
     AND (OLD.status != 'approved' OR OLD.status IS NULL) THEN
    
    NEW.status = 'approved';
    NEW.matched_trip_id = NULL;
    NEW.matched_assignment_expires_at = NULL;
    
    RAISE NOTICE 'Auto-expired assignment for package % due to expiration', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create triggers
DROP TRIGGER IF EXISTS set_assignment_expiration_trigger ON public.packages;
CREATE TRIGGER set_assignment_expiration_trigger
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_assignment_expiration();

DROP TRIGGER IF EXISTS handle_assignment_expiration_trigger ON public.packages;
CREATE TRIGGER handle_assignment_expiration_trigger
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_assignment_expiration_on_update();