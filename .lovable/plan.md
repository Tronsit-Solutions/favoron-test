

## Plan: Orden de pago automatica + email si faltan datos bancarios

### Cambios

**1. Nueva migracion SQL** — Trigger en `trip_payment_accumulator`:

Cuando `all_packages_delivered` cambia a `true`:

- **Si el viajero tiene datos bancarios completos**: crear la payment order automaticamente llamando a `create_payment_order_with_snapshot` directamente en SQL.
- **Si NO tiene datos bancarios**: invocar la edge function `send-notification-email` via `pg_net` (extension HTTP de Postgres) para enviarle un correo pidiendole que complete sus datos bancarios. Tambien se puede insertar una notificacion en la tabla de notificaciones.

```sql
CREATE OR REPLACE FUNCTION auto_create_payment_order_on_all_delivered()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _bank RECORD;
  _total NUMERIC;
  _existing UUID;
  _email TEXT;
  _first_name TEXT;
BEGIN
  IF NEW.all_packages_delivered IS NOT TRUE THEN RETURN NEW; END IF;
  IF OLD.all_packages_delivered IS NOT DISTINCT FROM TRUE THEN RETURN NEW; END IF;

  -- Check existing payment order
  SELECT id INTO _existing FROM payment_orders
  WHERE trip_id = NEW.trip_id AND traveler_id = NEW.traveler_id
    AND status IN ('pending','completed') LIMIT 1;
  IF _existing IS NOT NULL THEN RETURN NEW; END IF;

  _total := NEW.accumulated_amount + COALESCE(NEW.boost_amount, 0);
  IF _total <= 0 THEN RETURN NEW; END IF;

  -- Get banking info
  SELECT * INTO _bank FROM user_financial_data WHERE user_id = NEW.traveler_id;

  IF _bank IS NOT NULL AND _bank.bank_name IS NOT NULL 
     AND _bank.bank_account_number IS NOT NULL THEN
    -- AUTO-CREATE payment order
    PERFORM create_payment_order_with_snapshot(
      NEW.traveler_id, NEW.trip_id, _total,
      _bank.bank_name, _bank.bank_account_number,
      _bank.bank_account_holder, COALESCE(_bank.bank_account_type,'monetary')
    );
  ELSE
    -- SEND EMAIL via pg_net to send-notification-email edge function
    SELECT email, first_name INTO _email, _first_name 
    FROM profiles WHERE id = NEW.traveler_id;
    
    IF _email IS NOT NULL THEN
      PERFORM net.http_post(
        url := '<SUPABASE_URL>/functions/v1/send-notification-email',
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'Authorization','Bearer <SERVICE_ROLE_KEY>'
        ),
        body := jsonb_build_object(
          'user_id', NEW.traveler_id,
          'title', 'Completa tus datos bancarios para recibir tu pago',
          'message', format('¡Hola %s! Todos los paquetes de tu viaje han sido entregados. Para recibir tu pago de Q%s, necesitas completar tus datos bancarios en tu perfil.', COALESCE(_first_name,''), _total),
          'type', 'payment',
          'priority', 'high',
          'action_url', 'https://favoron.app/dashboard?tab=profile'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_payment_order_all_delivered
  AFTER UPDATE OF all_packages_delivered ON trip_payment_accumulator
  FOR EACH ROW
  WHEN (NEW.all_packages_delivered = true AND OLD.all_packages_delivered IS DISTINCT FROM true)
  EXECUTE FUNCTION auto_create_payment_order_on_all_delivered();
```

> **Nota**: Los valores de `SUPABASE_URL` y `SERVICE_ROLE_KEY` se obtendran de `vault.secrets` en el SQL real para no hardcodearlos. Se usara `pg_net` (ya disponible en Supabase) para hacer la llamada HTTP a la edge function.

**2. Sin cambios en frontend** — Todo es server-side. La UI ya detecta payment orders via realtime y el email se envia usando la edge function existente `send-notification-email` con Resend.

### Comportamiento final
- Viajero **con** datos bancarios → orden de pago creada automaticamente
- Viajero **sin** datos bancarios → recibe email pidiendole completar sus datos, con link directo a su perfil
- Si ya existe orden pendiente/completada → no se duplica
- Si el monto es 0 → no se hace nada

