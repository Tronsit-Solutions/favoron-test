
-- 1) Función que crea notificaciones al insertar mensajes del chat
CREATE OR REPLACE FUNCTION public.notify_participants_on_new_package_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_shopper_id uuid;
  v_traveler_id uuid;
  v_sender_name text;
  v_title text;
  v_message text;
  v_priority text := 'high'; -- Usamos 'high' para que dispare toast en tiempo real
  v_type text := 'package';
BEGIN
  -- Solo notificar para mensajes de chat y archivos (no 'status_update')
  IF NEW.message_type NOT IN ('text', 'file_upload') THEN
    RETURN NEW;
  END IF;

  -- Identificar participantes del paquete
  SELECT p.user_id,
         t.user_id
  INTO v_shopper_id, v_traveler_id
  FROM public.packages p
  LEFT JOIN public.trips t ON t.id = p.matched_trip_id
  WHERE p.id = NEW.package_id;

  -- Nombre del remitente (si está disponible)
  SELECT trim(concat_ws(' ', first_name, last_name))
  INTO v_sender_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Construir título y mensaje
  IF NEW.message_type = 'text' THEN
    v_title := '💬 Nuevo mensaje en el paquete';
    v_message := coalesce(nullif(v_sender_name, ''), 'Usuario')
                 || ' escribió: "'
                 || coalesce(left(coalesce(trim(NEW.content), ''), 120), '(sin texto)')
                 || '"';
  ELSE
    v_title := '📎 Nuevo archivo en el chat del paquete';
    v_message := coalesce(nullif(v_sender_name, ''), 'Usuario')
                 || ' subió un archivo: '
                 || coalesce(NEW.file_name, 'archivo');
  END IF;

  -- Notificar al shopper si no es el remitente
  IF v_shopper_id IS NOT NULL AND v_shopper_id <> NEW.user_id THEN
    PERFORM public.create_notification(
      v_shopper_id,
      v_title,
      v_message,
      v_type,
      v_priority,
      NULL,
      jsonb_build_object(
        'package_id', NEW.package_id,
        'message_id', NEW.id,
        'message_type', NEW.message_type,
        'sender_id', NEW.user_id
      )
    );
  END IF;

  -- Notificar al traveler si no es el remitente
  IF v_traveler_id IS NOT NULL AND v_traveler_id <> NEW.user_id THEN
    PERFORM public.create_notification(
      v_traveler_id,
      v_title,
      v_message,
      v_type,
      v_priority,
      NULL,
      jsonb_build_object(
        'package_id', NEW.package_id,
        'message_id', NEW.id,
        'message_type', NEW.message_type,
        'sender_id', NEW.user_id
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Trigger AFTER INSERT sobre package_messages
DROP TRIGGER IF EXISTS notify_on_new_package_message ON public.package_messages;

CREATE TRIGGER notify_on_new_package_message
AFTER INSERT ON public.package_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_participants_on_new_package_message();
