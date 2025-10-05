-- Update send_quote_reminders function to work with 48-hour shopper quote expiration
-- Reminders will be sent at 36 hours and 1 hour before expiration

CREATE OR REPLACE FUNCTION public.send_quote_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  package_record RECORD;
  hours_remaining INTEGER;
  reminder_title TEXT;
  reminder_message TEXT;
  reminder_priority TEXT;
BEGIN
  -- Check packages with quotes expiring soon
  FOR package_record IN 
    SELECT p.id, p.user_id, p.item_description, p.quote_expires_at
    FROM public.packages p
    WHERE p.status = 'quote_sent' 
      AND p.quote_expires_at IS NOT NULL 
      AND p.quote_expires_at > NOW()
      AND p.quote_expires_at <= NOW() + INTERVAL '36 hours'
  LOOP
    -- Calculate hours remaining
    hours_remaining := EXTRACT(EPOCH FROM (package_record.quote_expires_at - NOW())) / 3600;
    
    -- Determine reminder level and message
    IF hours_remaining <= 1 THEN
      -- 1 hour warning
      reminder_title := '🚨 ¡Última hora para pagar tu cotización!';
      reminder_message := CONCAT('Solo queda 1 hora para pagar la cotización de "', package_record.item_description, '". Si no pagas, la cotización expirará automáticamente.');
      reminder_priority := 'urgent';
    ELSIF hours_remaining <= 36 THEN
      -- 36 hour warning (12 hours after quote sent for 48h expiration)
      reminder_title := '⏰ Recordatorio: 36 horas para pagar';
      reminder_message := CONCAT('Tienes 36 horas restantes para pagar la cotización de "', package_record.item_description, '". ¡No dejes que se vaya!');
      reminder_priority := 'normal';
    ELSE
      -- Skip if more than 36 hours remaining
      CONTINUE;
    END IF;
    
    -- Send reminder to shopper
    PERFORM public.create_notification(
      package_record.user_id,
      reminder_title,
      reminder_message,
      'quote',
      reminder_priority,
      NULL,
      jsonb_build_object(
        'package_id', package_record.id,
        'reminder_type', 'quote_expiring',
        'hours_remaining', hours_remaining,
        'expires_at', package_record.quote_expires_at
      )
    );
  END LOOP;
  
  RAISE NOTICE 'Quote reminders sent successfully';
END;
$function$;