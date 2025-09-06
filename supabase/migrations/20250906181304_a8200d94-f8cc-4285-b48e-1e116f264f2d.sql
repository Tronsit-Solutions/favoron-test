
-- 1) Notificación inmediata al shopper cuando se envía la cotización (status = 'quote_sent')

CREATE OR REPLACE FUNCTION public.notify_shopper_quote_sent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  hours_left numeric := NULL;
  total_price numeric := NULL;
  price_text text := '';
  msg text;
BEGIN
  -- Disparar sólo cuando el estado cambie a quote_sent
  IF (TG_OP = 'UPDATE')
     AND (NEW.status = 'quote_sent')
     AND (OLD.status IS DISTINCT FROM 'quote_sent') THEN

    -- Calcular horas restantes si hay fecha de expiración
    IF NEW.quote_expires_at IS NOT NULL THEN
      hours_left := CEIL(EXTRACT(EPOCH FROM (NEW.quote_expires_at - NOW())) / 3600.0);
    END IF;

    -- Intentar leer un precio de la cotización (admite totalPrice o price)
    IF NEW.quote IS NOT NULL THEN
      BEGIN
        total_price := COALESCE(
          NULLIF(NEW.quote->>'totalPrice', '')::numeric,
          NULLIF(NEW.quote->>'price', '')::numeric
        );
      EXCEPTION WHEN OTHERS THEN
        total_price := NULL;
      END;
    END IF;

    IF total_price IS NOT NULL THEN
      price_text := ' por Q' || TO_CHAR(total_price, 'FM999,999,999.00');
    END IF;

    msg := CONCAT(
      'Recibiste una cotización para "', COALESCE(NEW.item_description, 'tu solicitud'),
      '"', price_text,
      CASE WHEN hours_left IS NOT NULL THEN CONCAT('. Expira en ', hours_left::int, ' hora', CASE WHEN hours_left::int = 1 THEN '' ELSE 's' END, '.') ELSE '.' END
    );

    PERFORM public.create_notification(
      NEW.user_id,
      '💬 Recibiste una cotización',
      msg,
      'quote',
      'high',
      NULL,
      jsonb_build_object(
        'package_id', NEW.id,
        'quote_expires_at', NEW.quote_expires_at,
        'change_type', 'quote_sent'
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tr_notify_shopper_quote_sent ON public.packages;

CREATE TRIGGER tr_notify_shopper_quote_sent
AFTER UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.notify_shopper_quote_sent();


-- 2) Recordatorios a 12h y 1h antes de expirar (para shoppers) con deduplicación

CREATE OR REPLACE FUNCTION public.send_quote_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pkg RECORD;
  hours_left numeric;
  sent_12h int := 0;
  sent_1h int := 0;
BEGIN
  -- Paquetes con cotización enviada que aún no han expirado y expiran en <= 12h
  FOR pkg IN
    SELECT p.id, p.user_id, p.item_description, p.quote_expires_at
    FROM public.packages p
    WHERE p.status = 'quote_sent'
      AND p.quote_expires_at IS NOT NULL
      AND p.quote_expires_at > NOW()
      AND p.quote_expires_at <= NOW() + INTERVAL '12 hours'
  LOOP
    hours_left := CEIL(EXTRACT(EPOCH FROM (pkg.quote_expires_at - NOW())) / 3600.0);

    -- Recordatorio de 1 hora (prioridad urgente), si no existe uno previo
    IF hours_left <= 1 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = pkg.user_id
          AND n.type = 'quote'
          AND n.metadata->>'package_id' = pkg.id::text
          AND n.metadata->>'reminder_type' = 'quote_1h'
      ) THEN
        PERFORM public.create_notification(
          pkg.user_id,
          '⏰ ¡Última hora para pagar tu cotización!',
          CONCAT('La cotización para "', COALESCE(pkg.item_description, 'tu solicitud'),
                 '" expira en 1 hora. Completa el pago para continuar.'),
          'quote',
          'urgent',
          NULL,
          jsonb_build_object(
            'package_id', pkg.id,
            'reminder_type', 'quote_1h',
            'hours_left', 1,
            'expires_at', pkg.quote_expires_at
          )
        );
        sent_1h := sent_1h + 1;
      END IF;

    -- Recordatorio de 12 horas (prioridad alta), si no existe uno previo
    ELSIF hours_left <= 12 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = pkg.user_id
          AND n.type = 'quote'
          AND n.metadata->>'package_id' = pkg.id::text
          AND n.metadata->>'reminder_type' = 'quote_12h'
      ) THEN
        PERFORM public.create_notification(
          pkg.user_id,
          '⏳ Tu cotización expira en 12 horas',
          CONCAT('La cotización para "', COALESCE(pkg.item_description, 'tu solicitud'),
                 '" expira en 12 horas. Puedes pagar ahora para asegurarla.'),
          'quote',
          'high',
          NULL,
          jsonb_build_object(
            'package_id', pkg.id,
            'reminder_type', 'quote_12h',
            'hours_left', 12,
            'expires_at', pkg.quote_expires_at
          )
        );
        sent_12h := sent_12h + 1;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'Quote reminders sent - 12h: %, 1h: %', sent_12h, sent_1h;
END;
$function$;
