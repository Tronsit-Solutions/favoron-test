-- Fix send_quote_reminders to include deduplication and accurate time windows
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
  reminder_type TEXT;
BEGIN
  -- Check packages with quotes expiring soon
  FOR package_record IN 
    SELECT p.id, p.user_id, p.item_description, p.quote_expires_at
    FROM public.packages p
    WHERE p.status = 'quote_sent' 
      AND p.quote_expires_at IS NOT NULL 
      AND p.quote_expires_at > NOW()
      AND p.quote_expires_at <= NOW() + INTERVAL '37 hours' -- Slightly more than 36h to catch edge cases
  LOOP
    -- Calculate exact hours remaining (rounded up)
    hours_remaining := CEIL(EXTRACT(EPOCH FROM (package_record.quote_expires_at - NOW())) / 3600.0);
    
    -- Determine reminder level based on specific time windows
    IF hours_remaining <= 2 THEN
      -- 1-2 hour warning (urgent)
      reminder_type := 'quote_1h';
      reminder_title := '🚨 ¡Última oportunidad para pagar!';
      reminder_message := CONCAT(
        'Solo quedan ', hours_remaining, ' hora(s) para pagar la cotización de "', 
        package_record.item_description, 
        '". Si no pagas, la cotización expirará automáticamente.'
      );
      reminder_priority := 'urgent';
      
    ELSIF hours_remaining >= 35 AND hours_remaining <= 37 THEN
      -- 35-37 hour warning (approximately 36h after quote sent for 48h expiration)
      reminder_type := 'quote_36h';
      reminder_title := '⏰ Recordatorio: Cotización por expirar';
      reminder_message := CONCAT(
        'Tienes aproximadamente ', hours_remaining, ' horas para pagar la cotización de "', 
        package_record.item_description, 
        '". ¡No dejes que se vaya!'
      );
      reminder_priority := 'normal';
      
    ELSE
      -- Skip if not in a reminder window
      CONTINUE;
    END IF;
    
    -- Check if this type of reminder was already sent for this package
    IF EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = package_record.user_id
        AND n.type = 'quote'
        AND n.metadata->>'package_id' = package_record.id::text
        AND n.metadata->>'reminder_type' = reminder_type
    ) THEN
      -- Skip if already sent
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
        'reminder_type', reminder_type,
        'hours_remaining', hours_remaining,
        'expires_at', package_record.quote_expires_at
      )
    );
  END LOOP;
  
  RAISE NOTICE 'Quote reminders sent successfully';
END;
$function$;