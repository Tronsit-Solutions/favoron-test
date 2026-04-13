
-- Trigger function: auto-create payment order or send email when all packages delivered
CREATE OR REPLACE FUNCTION auto_create_payment_order_on_all_delivered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bank RECORD;
  _total NUMERIC;
  _existing UUID;
  _email TEXT;
  _first_name TEXT;
  _supabase_url TEXT;
  _service_role_key TEXT;
BEGIN
  -- Only fire when all_packages_delivered transitions to true
  IF NEW.all_packages_delivered IS NOT TRUE THEN RETURN NEW; END IF;
  IF OLD.all_packages_delivered IS NOT DISTINCT FROM TRUE THEN RETURN NEW; END IF;

  -- Check if a pending/completed payment order already exists
  SELECT id INTO _existing FROM payment_orders
  WHERE trip_id = NEW.trip_id AND traveler_id = NEW.traveler_id
    AND status IN ('pending', 'completed')
  LIMIT 1;
  IF _existing IS NOT NULL THEN RETURN NEW; END IF;

  -- Calculate total amount
  _total := NEW.accumulated_amount + COALESCE(NEW.boost_amount, 0);
  IF _total <= 0 THEN RETURN NEW; END IF;

  -- Get banking info
  SELECT * INTO _bank FROM user_financial_data WHERE user_id = NEW.traveler_id;

  IF _bank IS NOT NULL AND _bank.bank_name IS NOT NULL 
     AND _bank.bank_account_number IS NOT NULL 
     AND _bank.bank_account_holder IS NOT NULL THEN
    -- AUTO-CREATE payment order using existing RPC
    PERFORM create_payment_order_with_snapshot(
      NEW.traveler_id,
      NEW.trip_id,
      _total,
      _bank.bank_name,
      _bank.bank_account_holder,
      _bank.bank_account_number,
      COALESCE(_bank.bank_account_type, 'monetary')
    );
  ELSE
    -- Get traveler info for email
    SELECT email, first_name INTO _email, _first_name 
    FROM profiles WHERE id = NEW.traveler_id;

    -- Create in-app notification
    INSERT INTO notifications (user_id, title, message, type, priority, action_url)
    VALUES (
      NEW.traveler_id,
      'Completa tus datos bancarios para recibir tu pago',
      format('¡Hola %s! Todos los paquetes de tu viaje han sido entregados. Para recibir tu pago de Q%s, necesitas completar tus datos bancarios en tu perfil.', COALESCE(_first_name, ''), _total),
      'payment',
      'high',
      '/dashboard?tab=profile'
    );

    -- Send email via pg_net to send-notification-email edge function
    IF _email IS NOT NULL THEN
      SELECT decrypted_secret INTO _supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
      SELECT decrypted_secret INTO _service_role_key FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key' LIMIT 1;

      -- Fallback: use environment if vault secrets not found
      IF _supabase_url IS NULL THEN
        _supabase_url := current_setting('app.settings.supabase_url', true);
      END IF;
      IF _service_role_key IS NULL THEN
        _service_role_key := current_setting('app.settings.service_role_key', true);
      END IF;

      IF _supabase_url IS NOT NULL AND _service_role_key IS NOT NULL THEN
        PERFORM net.http_post(
          url := _supabase_url || '/functions/v1/send-notification-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || _service_role_key
          ),
          body := jsonb_build_object(
            'user_id', NEW.traveler_id::text,
            'title', 'Completa tus datos bancarios para recibir tu pago',
            'message', format('¡Hola %s! Todos los paquetes de tu viaje han sido entregados. Para recibir tu pago de Q%s, necesitas completar tus datos bancarios en tu perfil.', COALESCE(_first_name, ''), _total),
            'type', 'payment',
            'priority', 'high',
            'action_url', 'https://favoron.app/dashboard?tab=profile'
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trg_auto_payment_order_all_delivered
  AFTER UPDATE OF all_packages_delivered
  ON trip_payment_accumulator
  FOR EACH ROW
  WHEN (NEW.all_packages_delivered = true AND OLD.all_packages_delivered IS DISTINCT FROM true)
  EXECUTE FUNCTION auto_create_payment_order_on_all_delivered();
