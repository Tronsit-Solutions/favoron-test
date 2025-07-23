-- Eliminar y recrear la función log_admin_action con tipos específicos
DROP FUNCTION IF EXISTS public.log_admin_action(uuid, uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.log_admin_action(
  _package_id uuid, 
  _admin_id uuid, 
  _action_type text, 
  _action_description text, 
  _additional_data jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.packages
  SET admin_actions_log = COALESCE(admin_actions_log, '[]'::jsonb) || jsonb_build_object(
    'timestamp', NOW(),
    'admin_id', _admin_id,
    'action_type', _action_type,
    'description', _action_description,
    'additional_data', _additional_data
  )
  WHERE id = _package_id;
END;
$$;