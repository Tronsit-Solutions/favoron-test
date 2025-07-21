-- Actualizar los estados de paquetes para incluir el nuevo flujo de escrow
-- Agregar nuevos estados para la doble confirmación

-- Primero, agregar el nuevo estado 'pending_office_confirmation' para cuando el viajero entrega pero falta confirmación del admin
-- Esto actuará como estado intermedio antes de 'delivered_to_office'

-- Actualizar la función del trigger para manejar la nueva lógica de doble confirmación
CREATE OR REPLACE FUNCTION public.update_trip_payment_accumulator()
RETURNS TRIGGER AS $$
DECLARE
  trip_traveler_id UUID;
  tip_amount DECIMAL;
  total_packages INTEGER;
  delivered_packages INTEGER;
BEGIN
  -- Solo procesar si el paquete se marca como entregado en oficina 
  -- CON DOBLE CONFIRMACIÓN: traveler_declaration Y admin_confirmation
  IF (NEW.status = 'delivered_to_office' 
      AND NEW.office_delivery IS NOT NULL 
      AND NEW.office_delivery->>'traveler_declaration' IS NOT NULL
      AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL)
     AND (OLD.status != 'delivered_to_office' 
          OR OLD.office_delivery IS NULL 
          OR OLD.office_delivery->>'traveler_declaration' IS NULL
          OR OLD.office_delivery->>'admin_confirmation' IS NULL) THEN
    
    -- Obtener el traveler_id del viaje matched
    SELECT t.user_id INTO trip_traveler_id
    FROM public.trips t
    WHERE t.id = NEW.matched_trip_id;
    
    -- Obtener el tip del quote
    tip_amount := COALESCE((NEW.quote->>'price')::DECIMAL, 0);
    
    -- Contar total de paquetes del viaje
    SELECT COUNT(*) INTO total_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id;
    
    -- Contar paquetes entregados del viaje (que tengan AMBAS confirmaciones)
    SELECT COUNT(*) INTO delivered_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id 
      AND status = 'delivered_to_office'
      AND office_delivery IS NOT NULL
      AND office_delivery->>'traveler_declaration' IS NOT NULL
      AND office_delivery->>'admin_confirmation' IS NOT NULL;
    
    -- Insertar o actualizar el acumulador
    INSERT INTO public.trip_payment_accumulator (
      trip_id, 
      traveler_id, 
      accumulated_amount, 
      delivered_packages_count,
      total_packages_count
    )
    VALUES (
      NEW.matched_trip_id, 
      trip_traveler_id, 
      tip_amount,
      delivered_packages,
      total_packages
    )
    ON CONFLICT (trip_id, traveler_id) 
    DO UPDATE SET
      accumulated_amount = trip_payment_accumulator.accumulated_amount + tip_amount,
      delivered_packages_count = delivered_packages,
      total_packages_count = total_packages,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear función para que el admin confirme la recepción de paquetes del viajero
CREATE OR REPLACE FUNCTION public.admin_confirm_office_delivery(_package_id uuid, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Solo permitir si el paquete está en estado 'pending_office_confirmation'
  -- y ya tiene traveler_declaration
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
    
  -- Log admin action
  PERFORM log_admin_action(
    _package_id, 
    _admin_id, 
    'office_delivery_confirmation', 
    'Admin confirmed office delivery reception',
    jsonb_build_object('confirmation_timestamp', NOW())
  );
END;
$$;