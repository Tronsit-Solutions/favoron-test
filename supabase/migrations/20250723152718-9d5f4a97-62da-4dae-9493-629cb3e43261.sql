-- Actualizar la función admin_confirm_office_delivery para corregir el problema de tipos
CREATE OR REPLACE FUNCTION public.admin_confirm_office_delivery(_package_id uuid, _admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    
  -- Log admin action con casting explícito
  PERFORM log_admin_action(
    _package_id::uuid, 
    _admin_id::uuid, 
    'office_delivery_confirmation'::text, 
    'Admin confirmed office delivery reception'::text,
    jsonb_build_object('confirmation_timestamp', NOW())::jsonb
  );
END;
$$;