-- Fix function search path security issues
-- Update functions to have proper search_path settings for security

CREATE OR REPLACE FUNCTION public.set_quote_expiration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If quote is being set and quote_expires_at is null, set it to 24 hours from now
  IF NEW.quote IS NOT NULL 
     AND (OLD.quote IS NULL OR OLD.quote != NEW.quote)
     AND NEW.quote_expires_at IS NULL THEN
    NEW.quote_expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  
  -- If quote is being removed, clear expiration
  IF NEW.quote IS NULL AND OLD.quote IS NOT NULL THEN
    NEW.quote_expires_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.archive_old_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Archivar notificaciones leídas más antiguas que 30 días
  DELETE FROM public.notifications 
  WHERE read = true 
    AND created_at < NOW() - INTERVAL '30 days';
  
  -- Archivar mensajes de paquetes completados más antiguos que 90 días
  DELETE FROM public.package_messages 
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND package_id IN (
      SELECT id FROM public.packages 
      WHERE status IN ('completed', 'cancelled')
        AND updated_at < NOW() - INTERVAL '90 days'
    );
    
  RAISE NOTICE 'Archivado de datos antiguos completado';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_database_stats()
 RETURNS TABLE(table_name text, row_count bigint, table_size text, index_size text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_notification(_user_id uuid, _title text, _message text, _type text DEFAULT 'general'::text, _priority text DEFAULT 'normal'::text, _action_url text DEFAULT NULL::text, _metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_id UUID;
  user_email TEXT;
  user_first_name TEXT;
  user_email_notifications BOOLEAN;
  user_preferences JSONB;
  should_send_email BOOLEAN := false;
  http_result RECORD;
  payload JSONB;
BEGIN
  -- Insert the notification first
  INSERT INTO public.notifications (user_id, title, message, type, priority, action_url, metadata)
  VALUES (_user_id, _title, _message, _type, _priority, _action_url, _metadata)
  RETURNING id INTO notification_id;
  
  RAISE NOTICE '🔔 Notification created with ID: % for user: %', notification_id, _user_id;
  
  -- Get user email preferences and profile info
  SELECT 
    p.email, 
    p.first_name, 
    p.email_notifications,
    p.email_notification_preferences
  INTO user_email, user_first_name, user_email_notifications, user_preferences
  FROM public.profiles p
  WHERE p.id = _user_id;
  
  RAISE NOTICE '👤 User profile found: email=%, first_name=%, notifications=%, preferences=%', 
    user_email, user_first_name, user_email_notifications, user_preferences;
  
  -- Determine if we should send email
  IF user_email IS NOT NULL AND user_email_notifications = true THEN
    -- Check if this notification type is enabled in user preferences
    IF user_preferences IS NOT NULL AND user_preferences ? _type THEN
      should_send_email := (user_preferences->>_type)::boolean;
    ELSE
      -- Default to true for high/urgent priority notifications if preference not set
      should_send_email := (_priority IN ('high', 'urgent'));
    END IF;
  END IF;
  
  RAISE NOTICE '📧 Should send email: %, type: %, priority: %', should_send_email, _type, _priority;
  
  -- Send email if conditions are met
  IF should_send_email THEN
    BEGIN
      -- Build the payload properly
      payload := jsonb_build_object(
        'user_id', _user_id::text,
        'title', _title,
        'message', _message,
        'type', _type,
        'priority', _priority,
        'action_url', _action_url
      );
      
      RAISE NOTICE '🚀 Calling edge function with payload: %', payload;
      
      -- Call the edge function using extensions.http correctly
      SELECT INTO http_result * FROM extensions.http((
        'POST',
        'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-notification-email',
        ARRAY[
          extensions.http_header('Content-Type', 'application/json'),
          extensions.http_header('Authorization', 'Bearer ' || current_setting('app.service_role_key', true))
        ],
        'application/json',
        payload::text
      ));
      
      RAISE NOTICE '📬 HTTP response status: %, content: %', http_result.status, http_result.content;
      
      -- Check if the HTTP call was successful
      IF http_result.status BETWEEN 200 AND 299 THEN
        RAISE NOTICE '✅ Email notification sent successfully for user % (notification: %)', _user_id, notification_id;
      ELSE
        RAISE WARNING '❌ Failed to send email notification for user % (notification: %): HTTP status %', _user_id, notification_id, http_result.status;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the notification creation
      RAISE WARNING '💥 Exception while sending email notification for user % (notification: %): %', _user_id, notification_id, SQLERRM;
    END;
  END IF;
  
  RETURN notification_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_all_packages_delivered(_trip_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_packages INTEGER;
  delivered_packages INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_packages
  FROM public.packages
  WHERE matched_trip_id = _trip_id
    AND status NOT IN ('rejected', 'cancelled');
  
  SELECT COUNT(*) INTO delivered_packages
  FROM public.packages
  WHERE matched_trip_id = _trip_id 
    AND status = 'delivered_to_office'
    AND office_delivery IS NOT NULL
    AND office_delivery->>'traveler_declaration' IS NOT NULL
    AND office_delivery->>'admin_confirmation' IS NOT NULL;
  
  RETURN (total_packages > 0 AND delivered_packages = total_packages);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_notification_with_direct_email(_user_id uuid, _title text, _message text, _type text DEFAULT 'general'::text, _priority text DEFAULT 'normal'::text, _action_url text DEFAULT NULL::text, _metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_id UUID;
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_email_notifications BOOLEAN;
  user_preferences JSONB;
  should_send_email BOOLEAN := false;
  http_result RECORD;
  email_body TEXT;
  personalized_message TEXT;
BEGIN
  -- Insert the notification first
  INSERT INTO public.notifications (user_id, title, message, type, priority, action_url, metadata)
  VALUES (_user_id, _title, _message, _type, _priority, _action_url, _metadata)
  RETURNING id INTO notification_id;
  
  RAISE NOTICE '🔔 Direct notification created with ID: % for user: %', notification_id, _user_id;
  
  -- Get user email preferences and profile info
  SELECT 
    p.email, 
    p.first_name,
    p.last_name,
    p.email_notifications,
    p.email_notification_preferences
  INTO user_email, user_first_name, user_last_name, user_email_notifications, user_preferences
  FROM public.profiles p
  WHERE p.id = _user_id;
  
  RAISE NOTICE '👤 User profile: email=%, name=% %, notifications=%', 
    user_email, user_first_name, user_last_name, user_email_notifications;
  
  -- Determine if we should send email
  IF user_email IS NOT NULL AND user_email_notifications = true THEN
    -- Check if this notification type is enabled in user preferences
    IF user_preferences IS NOT NULL AND user_preferences ? _type THEN
      should_send_email := (user_preferences->>_type)::boolean;
    ELSE
      -- Default to true for high/urgent priority notifications if preference not set
      should_send_email := (_priority IN ('high', 'urgent'));
    END IF;
  END IF;
  
  RAISE NOTICE '📧 Should send direct email: %, type: %, priority: %', should_send_email, _type, _priority;
  
  -- Send email directly if conditions are met
  IF should_send_email THEN
    BEGIN
      -- Personalize the message
      personalized_message := REPLACE(_message, 'Usuario', COALESCE(user_first_name, 'Usuario'));
      
      -- Create simple HTML email body
      email_body := '<!DOCTYPE html>
<html>
<head><title>' || _title || '</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
    <h1>📦 Favoron</h1>
  </div>
  <div style="padding: 30px; background: white;">
    <h2 style="color: #333;">' || _title || '</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #555;">' || personalized_message || '</p>' ||
    CASE WHEN _action_url IS NOT NULL THEN 
      '<div style="text-align: center; margin: 30px 0;">
        <a href="' || _action_url || '" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Detalles</a>
      </div>'
    ELSE '' END ||
  '</div>
  <div style="padding: 20px; background: #f8f9fa; text-align: center; color: #6c757d; font-size: 14px;">
    <p>Este es un mensaje automático de Favoron. No responder a este correo.</p>
  </div>
</body>
</html>';
      
      RAISE NOTICE '📬 Sending direct email via Resend API to: %', user_email;
      
      -- Call Resend API directly using HTTP
      SELECT INTO http_result * FROM extensions.http((
        'POST',
        'https://api.resend.com/emails',
        ARRAY[
          extensions.http_header('Content-Type', 'application/json'),
          extensions.http_header('Authorization', 'Bearer ' || current_setting('app.resend_api_key', true))
        ],
        'application/json',
        jsonb_build_object(
          'from', 'Favoron <noreply@favoron.app>',
          'to', ARRAY[user_email],
          'subject', 'Favoron - ' || _title,
          'html', email_body
        )::text
      ));
      
      RAISE NOTICE '📬 Resend API response status: %, content: %', http_result.status, http_result.content;
      
      -- Check if the email was sent successfully
      IF http_result.status BETWEEN 200 AND 299 THEN
        RAISE NOTICE '✅ Direct email sent successfully for user % (notification: %)', _user_id, notification_id;
      ELSE
        RAISE WARNING '❌ Failed to send direct email for user % (notification: %): HTTP status %', _user_id, notification_id, http_result.status;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the notification creation
      RAISE WARNING '💥 Exception while sending direct email for user % (notification: %): %', _user_id, notification_id, SQLERRM;
    END;
  END IF;
  
  RETURN notification_id;
END;
$function$;

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
$function$;

CREATE OR REPLACE FUNCTION public.notify_admins_payment_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id UUID;
  traveler_name TEXT;
  amount_formatted TEXT;
BEGIN
  -- Obtener información del traveler
  SELECT CONCAT(first_name, ' ', last_name) INTO traveler_name
  FROM public.profiles 
  WHERE id = NEW.traveler_id;
  
  -- Formatear el monto
  amount_formatted := '$' || TO_CHAR(NEW.amount, 'FM999,999,999.00');
  
  -- Obtener todos los admin user IDs y crear notificaciones para cada uno
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    -- Crear notificación usando la función existente
    PERFORM public.create_notification(
      admin_user_id,
      '💰 Nueva solicitud de pago',
      CONCAT('Solicitud de pago de ', COALESCE(traveler_name, 'Usuario'), ' por ', amount_formatted, '. Banco: ', NEW.bank_name),
      'payment',
      'high',
      '/admin/payments',
      jsonb_build_object(
        'payment_order_id', NEW.id,
        'trip_id', NEW.trip_id,
        'traveler_id', NEW.traveler_id,
        'amount', NEW.amount,
        'bank_name', NEW.bank_name,
        'account_holder', NEW.bank_account_holder
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_monthly_reports(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  effective_start_date date;
  effective_end_date date;
  result jsonb := '[]'::jsonb;
  month_data jsonb;
  current_month date;
BEGIN
  -- Calculate effective date range
  IF start_date IS NULL THEN
    effective_start_date := date_trunc('month', CURRENT_DATE - interval '6 months')::date;
  ELSE
    effective_start_date := date_trunc('month', start_date)::date;
  END IF;
  
  IF end_date IS NULL THEN
    effective_end_date := date_trunc('month', CURRENT_DATE)::date + interval '1 month' - interval '1 day';
  ELSE
    effective_end_date := date_trunc('month', end_date)::date + interval '1 month' - interval '1 day';
  END IF;

  -- Generate data for each month in the range
  current_month := effective_start_date;
  
  WHILE current_month <= effective_end_date LOOP
    WITH month_packages AS (
      SELECT 
        p.*,
        COALESCE((p.quote->>'totalPrice')::numeric, 0) as total_price,
        COALESCE(p.estimated_price, 0) as est_price
      FROM public.packages p
      WHERE date_trunc('month', p.created_at) = date_trunc('month', current_month)
    ),
    month_trips AS (
      SELECT *
      FROM public.trips t
      WHERE date_trunc('month', t.created_at) = date_trunc('month', current_month)
    ),
    status_counts AS (
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_price) as revenue
      FROM month_packages
      GROUP BY status
    ),
    destination_counts AS (
      SELECT 
        package_destination,
        COUNT(*) as count
      FROM month_packages
      GROUP BY package_destination
      ORDER BY count DESC
      LIMIT 5
    ),
    origin_counts AS (
      SELECT 
        purchase_origin,
        COUNT(*) as count
      FROM month_packages
      GROUP BY purchase_origin
      ORDER BY count DESC
      LIMIT 5
    )
    SELECT jsonb_build_object(
      'month', to_char(current_month, 'YYYY-MM'),
      'month_name', to_char(current_month, 'FMMonth YYYY'),
      'total_packages', COALESCE((SELECT COUNT(*) FROM month_packages), 0),
      'total_trips', COALESCE((SELECT COUNT(*) FROM month_trips), 0),
      'total_revenue', COALESCE((SELECT SUM(total_price) FROM month_packages), 0),
      'average_package_value', COALESCE((
        SELECT CASE 
          WHEN COUNT(*) > 0 THEN SUM(total_price) / COUNT(*)
          ELSE 0 
        END 
        FROM month_packages
      ), 0),
      'completion_rate', COALESCE((
        SELECT CASE 
          WHEN COUNT(*) > 0 THEN 
            (COUNT(*) FILTER (WHERE status IN ('completed', 'delivered')))::numeric / COUNT(*) * 100
          ELSE 0 
        END
        FROM month_packages
      ), 0),
      'status_breakdown', COALESCE((
        SELECT jsonb_object_agg(status, jsonb_build_object('count', count, 'revenue', revenue))
        FROM status_counts
      ), '{}'::jsonb),
      'top_destinations', COALESCE((
        SELECT jsonb_object_agg(package_destination, count)
        FROM destination_counts
      ), '{}'::jsonb),
      'top_origins', COALESCE((
        SELECT jsonb_object_agg(purchase_origin, count)
        FROM origin_counts
      ), '{}'::jsonb),
      'financial_metrics', jsonb_build_object(
        'gross_revenue', COALESCE((SELECT SUM(total_price) FROM month_packages), 0),
        'net_revenue', COALESCE((SELECT SUM(total_price * 0.85) FROM month_packages), 0),
        'service_fees', COALESCE((SELECT SUM(total_price * 0.15) FROM month_packages), 0)
      )
    ) INTO month_data;
    
    result := result || month_data;
    current_month := current_month + interval '1 month';
  END LOOP;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_trip_payment_accumulator()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  trip_traveler_id UUID;
  tip_amount DECIMAL;
  total_packages INTEGER;
  delivered_packages INTEGER;
  all_packages_delivered BOOLEAN;
BEGIN
  IF (NEW.status = 'delivered_to_office' 
      AND NEW.office_delivery IS NOT NULL 
      AND NEW.office_delivery->>'traveler_declaration' IS NOT NULL
      AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL)
     AND (OLD.status != 'delivered_to_office' 
          OR OLD.office_delivery IS NULL 
          OR OLD.office_delivery->>'traveler_declaration' IS NULL
          OR OLD.office_delivery->>'admin_confirmation' IS NULL) THEN
    
    SELECT t.user_id INTO trip_traveler_id
    FROM public.trips t
    WHERE t.id = NEW.matched_trip_id;
    
    tip_amount := COALESCE((NEW.quote->>'price')::DECIMAL, 0);
    
    SELECT COUNT(*) INTO total_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id
      AND status NOT IN ('rejected', 'cancelled');
    
    SELECT COUNT(*) INTO delivered_packages
    FROM public.packages
    WHERE matched_trip_id = NEW.matched_trip_id 
      AND status = 'delivered_to_office'
      AND office_delivery IS NOT NULL
      AND office_delivery->>'traveler_declaration' IS NOT NULL
      AND office_delivery->>'admin_confirmation' IS NOT NULL;
    
    all_packages_delivered := (total_packages > 0 AND delivered_packages = total_packages);
    
    INSERT INTO public.trip_payment_accumulator (
      trip_id, 
      traveler_id, 
      accumulated_amount, 
      delivered_packages_count,
      total_packages_count,
      all_packages_delivered
    )
    VALUES (
      NEW.matched_trip_id, 
      trip_traveler_id, 
      tip_amount,
      delivered_packages,
      total_packages,
      all_packages_delivered
    )
    ON CONFLICT (trip_id, traveler_id) 
    DO UPDATE SET
      accumulated_amount = trip_payment_accumulator.accumulated_amount + tip_amount,
      delivered_packages_count = delivered_packages,
      total_packages_count = total_packages,
      all_packages_delivered = all_packages_delivered,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_admin_action(_package_id uuid, _admin_id uuid, _action_type text, _action_description text, _additional_data jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Actualizar el email en profiles cuando cambie en auth.users
  UPDATE public.profiles 
  SET email = NEW.email
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_stats()
 RETURNS TABLE(total_packages_completed bigint, total_users bigint, total_trips bigint, total_tips_distributed numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.packages WHERE status IN ('completed', 'delivered_to_office', 'received_by_traveler'))::bigint as total_packages_completed,
    (SELECT COUNT(*) FROM public.profiles)::bigint as total_users,
    (SELECT COUNT(*) FROM public.trips)::bigint as total_trips,
    (SELECT COALESCE(SUM((quote->>'price')::numeric), 0) 
     FROM public.packages 
     WHERE status IN ('completed', 'delivered_to_office', 'received_by_traveler') 
       AND quote IS NOT NULL 
       AND (quote->>'price') IS NOT NULL)::numeric as total_tips_distributed;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_shopper_package_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  shopper_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT := 'package';
  notification_priority TEXT := 'normal';
BEGIN
  -- Obtener nombre del shopper
  SELECT CONCAT(first_name, ' ', last_name) INTO shopper_name
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- 1. Cuando admin aprueba el paquete
  IF OLD.status = 'pending_approval' AND NEW.status = 'approved' THEN
    notification_title := '✅ Tu pedido ha sido aprobado';
    notification_message := CONCAT('¡Excelente! Tu pedido "', NEW.item_description, '" ha sido aprobado por nuestro equipo. Pronto será asignado a un viajero.');
    notification_priority := 'high';
    
  -- 2. Cuando el paquete pasa a pending_purchase (pago aprobado)
  ELSIF OLD.status != 'pending_purchase' AND NEW.status = 'pending_purchase' THEN
    notification_title := '💳 Tu pago ha sido aprobado exitosamente';
    notification_message := CONCAT('¡Perfecto! Tu pago para el pedido "', NEW.item_description, '" ha sido aprobado. Ahora puedes proceder a realizar la compra del paquete según las instrucciones recibidas.');
    notification_priority := 'high';
    
  -- 3. Cuando admin rechaza el paquete
  ELSIF OLD.status = 'pending_approval' AND NEW.status = 'rejected' THEN
    notification_title := '❌ Tu pedido ha sido rechazado';
    notification_message := CONCAT('Lo sentimos, tu pedido "', NEW.item_description, '" no pudo ser aprobado. Revisa los detalles o contacta a soporte.');
    notification_priority := 'high';
    
  -- 4. Cuando un viajero acepta y envía cotización
  ELSIF OLD.status != 'quote_sent' AND NEW.status = 'quote_sent' THEN
    notification_title := '💰 Nueva cotización recibida';
    notification_message := CONCAT('¡Buenas noticias! Un viajero ha enviado una cotización para tu pedido "', NEW.item_description, '". Revisa los detalles y acepta si estás conforme.');
    notification_priority := 'high';
    
  -- 5. Cuando el viajero confirma que recibió el paquete (actualizado para detectar traveler_confirmation)
  ELSIF (NEW.traveler_confirmation IS NOT NULL AND OLD.traveler_confirmation IS NULL)
        OR (NEW.traveler_confirmation IS NOT NULL 
            AND NEW.traveler_confirmation->>'confirmed_at' IS NOT NULL
            AND (OLD.traveler_confirmation IS NULL 
                 OR OLD.traveler_confirmation->>'confirmed_at' IS NULL)) THEN
    notification_title := '📦 Tu pedido ha sido recibido por el viajero';
    notification_message := CONCAT('El viajero ha confirmado que recibió tu pedido "', NEW.item_description, '". Tu paquete está en camino a Guatemala.');
    notification_priority := 'high';
    
  -- 6. Cuando se confirma por ambos que llegó a oficina
  ELSIF OLD.office_delivery IS NULL AND NEW.office_delivery IS NOT NULL
        AND NEW.office_delivery->>'traveler_declaration' IS NOT NULL
        AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL THEN
    notification_title := '🏢 Tu pedido llegó a nuestras oficinas';
    notification_message := CONCAT('¡Perfecto! Tu pedido "', NEW.item_description, '" ha llegado a nuestras oficinas y ha sido confirmado. Pronto estará listo para entrega.');
    notification_priority := 'high';
    
  -- 7. Cuando está listo para recibir (pickup o delivery)
  ELSIF NEW.status = 'ready_for_pickup' THEN
    notification_title := '✨ Tu pedido está listo para recoger';
    notification_message := CONCAT('¡Tu pedido "', NEW.item_description, '" está listo! Puedes pasar a recogerlo en nuestras oficinas.');
    notification_priority := 'high';
    
  ELSIF NEW.status = 'ready_for_delivery' THEN
    notification_title := '🚚 Tu pedido está listo para entrega';
    notification_message := CONCAT('¡Tu pedido "', NEW.item_description, '" está listo! Nos pondremos en contacto contigo para coordinar la entrega.');
    notification_priority := 'high';
    
  END IF;
  
  -- Crear la notificación si hay título y mensaje
  IF notification_title IS NOT NULL AND notification_message IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.user_id,
      notification_title,
      notification_message,
      notification_type,
      notification_priority,
      NULL, -- action_url se puede agregar después
      jsonb_build_object(
        'package_id', NEW.id,
        'package_status', NEW.status,
        'change_type', 'status_update'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_traveler_trip_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  traveler_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT := 'trip';
  notification_priority TEXT := 'normal';
BEGIN
  -- Obtener nombre del viajero
  SELECT CONCAT(first_name, ' ', last_name) INTO traveler_name
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- 1. Cuando admin aprueba el viaje
  IF OLD.status = 'pending_approval' AND NEW.status = 'approved' THEN
    notification_title := '✈️ Tu viaje ha sido aprobado';
    notification_message := CONCAT('¡Excelente! Tu viaje de ', NEW.from_city, ' a ', NEW.to_city, ' ha sido aprobado. Ya puedes empezar a recibir solicitudes de paquetes.');
    notification_priority := 'high';
    
  END IF;
  
  -- Crear la notificación si hay título y mensaje
  IF notification_title IS NOT NULL AND notification_message IS NOT NULL THEN
    PERFORM public.create_notification(
      NEW.user_id,
      notification_title,
      notification_message,
      notification_type,
      notification_priority,
      NULL, -- action_url se puede agregar después
      jsonb_build_object(
        'trip_id', NEW.id,
        'trip_status', NEW.status,
        'change_type', 'trip_approval'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_traveler_package_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  traveler_id UUID;
  traveler_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT := 'package';
  notification_priority TEXT := 'normal';
BEGIN
  -- Log para debugging
  RAISE NOTICE '🔍 TRIGGER FIRED - Package ID: %, Old Trip: %, New Trip: %, Old Status: %, New Status: %', 
    NEW.id, OLD.matched_trip_id, NEW.matched_trip_id, OLD.status, NEW.status;
  
  -- Obtener el traveler_id del viaje asignado
  IF NEW.matched_trip_id IS NOT NULL THEN
    SELECT t.user_id, CONCAT(p.first_name, ' ', p.last_name) 
    INTO traveler_id, traveler_name
    FROM public.trips t
    LEFT JOIN public.profiles p ON p.id = t.user_id
    WHERE t.id = NEW.matched_trip_id;
    
    RAISE NOTICE '🔍 Traveler found: ID=%, Name=%', traveler_id, traveler_name;
  END IF;
  
  -- Solo proceder si tenemos un viajero asignado
  IF traveler_id IS NOT NULL THEN
    
    -- 1. Cuando se asigna un paquete por primera vez (matched_trip_id cambia O status cambia a matched)
    IF (OLD.matched_trip_id IS NULL AND NEW.matched_trip_id IS NOT NULL) 
       OR (NEW.status = 'matched' AND (OLD.status IS NULL OR OLD.status != 'matched')) THEN
      notification_title := '📦 Nuevo paquete asignado';
      notification_message := CONCAT('¡Tienes un nuevo paquete asignado! "', NEW.item_description, '" de ', NEW.purchase_origin, ' a ', NEW.package_destination, '.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 1 - Package assignment detected';
      
    -- 2. Cuando el shopper PAGA la cotización (status cambia a 'paid')
    ELSIF (OLD.status IS NULL OR OLD.status != 'paid') AND NEW.status = 'paid' THEN
      notification_title := '💳 El shopper ha pagado la cotización';
      notification_message := CONCAT('¡Excelente! El shopper ha pagado la cotización para el paquete "', NEW.item_description, '". Ya puedes proceder con la compra.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 2 - Payment detected';
      
    -- 3. CORREGIDO: Cuando el paquete pasa a pending_purchase (shopper aceptó y pagó)
    ELSIF (OLD.status IS NULL OR OLD.status != 'pending_purchase') AND NEW.status = 'pending_purchase' THEN
      notification_title := '✅ Shopper aceptó y pagó la cotización';
      notification_message := CONCAT('¡Excelente! El shopper ha aceptado y pagado la cotización para "', NEW.item_description, '". Pronto te compartirá el comprobante de compra y la información de seguimiento.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 2.5 - Shopper accepted and paid quote (pending_purchase) detected';
      
    -- 4. Cuando el shopper sube comprobante de compra
    ELSIF (NEW.purchase_confirmation IS NOT NULL AND (OLD.purchase_confirmation IS NULL OR OLD.purchase_confirmation IS DISTINCT FROM NEW.purchase_confirmation))
          AND (NEW.purchase_confirmation->>'receipt_url' IS NOT NULL OR NEW.purchase_confirmation->>'filePath' IS NOT NULL) THEN
      notification_title := '🧾 Comprobante de compra subido';
      notification_message := CONCAT('El shopper ha subido el comprobante de compra para "', NEW.item_description, '". Revisa los detalles para coordinar la recepción.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 3 - Purchase confirmation detected';
      
    -- 5. Cuando el shopper sube información de seguimiento
    ELSIF (NEW.tracking_info IS NOT NULL AND (OLD.tracking_info IS NULL OR OLD.tracking_info IS DISTINCT FROM NEW.tracking_info))
          AND (NEW.tracking_info->>'tracking_number' IS NOT NULL) THEN
      notification_title := '📋 Información de seguimiento actualizada';
      notification_message := CONCAT('El shopper ha actualizado la información de seguimiento para "', NEW.item_description, '". Ya puedes rastrear tu paquete.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 4 - Tracking info detected';
      
    -- 6. Cuando Favorón confirma que recibió el artículo en oficina
    ELSIF (NEW.office_delivery IS NOT NULL AND (OLD.office_delivery IS NULL OR OLD.office_delivery IS DISTINCT FROM NEW.office_delivery))
          AND NEW.office_delivery->>'admin_confirmation' IS NOT NULL THEN
      notification_title := '✅ Paquete confirmado en oficina';
      notification_message := CONCAT('¡Perfecto! Favorón ha confirmado la recepción del paquete "', NEW.item_description, '" en nuestras oficinas. Tu pago está siendo procesado.');
      notification_priority := 'high';
      
      RAISE NOTICE '🔍 CASE 5 - Office delivery confirmed';
      
    END IF;
    
    -- Crear la notificación si hay título y mensaje
    IF notification_title IS NOT NULL AND notification_message IS NOT NULL THEN
      RAISE NOTICE '🔍 Creating notification: Title=%, Message=%, Traveler ID=%', notification_title, notification_message, traveler_id;
      
      PERFORM public.create_notification(
        traveler_id,
        notification_title,
        notification_message,
        notification_type,
        notification_priority,
        NULL, -- action_url se puede agregar después
        jsonb_build_object(
          'package_id', NEW.id,
          'trip_id', NEW.matched_trip_id,
          'package_status', NEW.status,
          'change_type', 'package_update'
        )
      );
      
      RAISE NOTICE '✅ Notification created successfully for traveler %', traveler_id;
    ELSE
      RAISE NOTICE '⚠️ No notification conditions met';
    END IF;
    
  ELSE
    RAISE NOTICE '⚠️ No traveler found for package %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admins_payment_receipt()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id UUID;
  shopper_name TEXT;
  package_item TEXT;
BEGIN
  -- Solo procesar cuando el status cambia a payment_pending_approval
  IF NEW.status = 'payment_pending_approval' AND (OLD.status IS NULL OR OLD.status != 'payment_pending_approval') THEN
    -- Obtener información del shopper
    SELECT CONCAT(first_name, ' ', last_name) INTO shopper_name
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Obtener descripción del item
    package_item := NEW.item_description;
    
    -- Notificar a todos los admins usando la tabla user_roles
    FOR admin_user_id IN 
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      -- Usar la función existente create_notification con tipo 'payment' en lugar de 'payment_pending_approval'
      PERFORM create_notification(
        admin_user_id,
        'Nuevo comprobante de pago',
        shopper_name || ' ha subido un comprobante de pago para "' || package_item || '"',
        'payment',  -- Cambiar a 'payment' que está permitido
        'high',
        NULL,
        jsonb_build_object(
          'package_id', NEW.id,
          'shopper_name', shopper_name,
          'item_description', package_item,
          'quote_total', (NEW.quote->>'totalPrice')::text,
          'status', 'payment_pending_approval'  -- Agregar el status específico en metadata
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile with all user data including separated country_code and phone_number
  INSERT INTO public.profiles (id, first_name, last_name, country_code, phone_number, email, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name', 
    NEW.raw_user_meta_data ->> 'country_code',
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.email,
    NEW.raw_user_meta_data ->> 'username'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;