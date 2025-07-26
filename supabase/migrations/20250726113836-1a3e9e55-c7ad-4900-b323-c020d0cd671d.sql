-- Modificar la función para cambiar el estado según delivery_method
CREATE OR REPLACE FUNCTION public.admin_confirm_office_delivery(_package_id uuid, _admin_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  package_delivery_method TEXT;
  new_status TEXT;
BEGIN
  -- Obtener el método de entrega del paquete
  SELECT delivery_method INTO package_delivery_method
  FROM public.packages
  WHERE id = _package_id;
  
  -- Determinar el nuevo estado basado en el método de entrega
  IF package_delivery_method = 'pickup' THEN
    new_status := 'ready_for_pickup';
  ELSE
    new_status := 'ready_for_delivery';
  END IF;
  
  -- Solo permitir si el paquete está en estado 'pending_office_confirmation'
  -- y ya tiene traveler_declaration
  UPDATE public.packages
  SET 
    status = new_status,
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
    
  -- Log admin action con casting explícito
  PERFORM log_admin_action(
    _package_id::uuid, 
    _admin_id::uuid, 
    'office_delivery_confirmation'::text, 
    CONCAT('Admin confirmed office delivery - Status changed to: ', new_status)::text,
    jsonb_build_object('confirmation_timestamp', NOW(), 'new_status', new_status)::jsonb
  );
END;
$function$