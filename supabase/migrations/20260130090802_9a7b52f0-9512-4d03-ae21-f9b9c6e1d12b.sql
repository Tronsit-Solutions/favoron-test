-- Deshabilitar avisos preventivos de asignación
-- Los viajeros ya no recibirán recordatorios a las 12h, 4h, y 1h antes de expirar

CREATE OR REPLACE FUNCTION public.send_assignment_warnings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Función deshabilitada: los avisos preventivos fueron eliminados
  -- para reducir el ruido de notificaciones a viajeros
  -- La notificación de expiración (cuando ya expiró) sigue funcionando
  -- a través de expire_unresponded_assignments()
  NULL;
END;
$function$;