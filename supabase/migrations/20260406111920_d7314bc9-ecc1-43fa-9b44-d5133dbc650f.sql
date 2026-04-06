CREATE OR REPLACE FUNCTION public.create_notification_with_direct_email(
  _user_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'general'::text,
  _priority text DEFAULT 'normal'::text,
  _action_url text DEFAULT NULL::text,
  _metadata jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
  user_email TEXT;
  user_phone TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_email_notifications BOOLEAN;
  user_email_preferences JSONB;
  user_whatsapp_notifications BOOLEAN;
  user_whatsapp_preferences JSONB;
  should_send_email BOOLEAN := false;
  should_send_whatsapp BOOLEAN := false;
  email_body TEXT;
  personalized_message TEXT;
BEGIN
  -- Insert the notification first
  INSERT INTO public.notifications (user_id, title, message, type, priority, action_url, metadata)
  VALUES (_user_id, _title, _message, _type, _priority, _action_url, _metadata)
  RETURNING id INTO notification_id;
  
  RAISE NOTICE '🔔 Direct notification created with ID: % for user: %', notification_id, _user_id;
  
  -- Get user preferences and profile info
  SELECT 
    p.email, 
    p.phone_number,
    p.first_name,
    p.last_name,
    p.email_notifications,
    p.email_notification_preferences,
    p.whatsapp_notifications,
    p.whatsapp_notification_preferences
  INTO 
    user_email, 
    user_phone,
    user_first_name, 
    user_last_name, 
    user_email_notifications, 
    user_email_preferences,
    user_whatsapp_notifications,
    user_whatsapp_preferences
  FROM public.profiles p
  WHERE p.id = _user_id;
  
  RAISE NOTICE '👤 User profile: email=%, phone=%, name=% %, email_notif=%, whatsapp_notif=%', 
    user_email, user_phone, user_first_name, user_last_name, user_email_notifications, user_whatsapp_notifications;
  
  -- Determine if we should send email
  IF user_email IS NOT NULL AND user_email_notifications = true THEN
    IF user_email_preferences IS NOT NULL AND user_email_preferences ? _type THEN
      should_send_email := (user_email_preferences->>_type)::boolean;
    ELSE
      should_send_email := (_priority IN ('high', 'urgent'));
    END IF;
  END IF;
  
  -- Determine if we should send WhatsApp
  IF user_phone IS NOT NULL AND user_whatsapp_notifications = true THEN
    IF user_whatsapp_preferences IS NOT NULL AND user_whatsapp_preferences ? _type THEN
      should_send_whatsapp := (user_whatsapp_preferences->>_type)::boolean;
    ELSE
      should_send_whatsapp := (_priority IN ('high', 'urgent'));
    END IF;
  END IF;
  
  RAISE NOTICE '📧 Should send email: %, 📱 Should send WhatsApp: %', should_send_email, should_send_whatsapp;
  
  -- Send email asynchronously via pg_net (non-blocking)
  IF should_send_email THEN
    BEGIN
      personalized_message := REPLACE(_message, 'Usuario', COALESCE(user_first_name, 'Usuario'));
      
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
    <div style="margin-bottom: 20px;">
      <a href="https://favoron.app" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
        Visitar Favoron
      </a>
    </div>
    <p>Este es un mensaje automático de Favoron. No responder a este correo.</p>
    <p>© 2024 Favoron. Todos los derechos reservados.</p>
  </div>
</body>
</html>';
      
      RAISE NOTICE '📬 Sending async email via Resend API (pg_net) to: %', user_email;
      
      PERFORM net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.resend_api_key', true)
        ),
        body := jsonb_build_object(
          'from', 'Favoron <noreply@favoron.app>',
          'to', ARRAY[user_email],
          'subject', 'Favoron - ' || _title,
          'html', email_body
        )
      );
      
      RAISE NOTICE '✅ Email queued asynchronously for user % (notification: %)', _user_id, notification_id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '💥 Exception while queuing email for user % (notification: %): %', _user_id, notification_id, SQLERRM;
    END;
  END IF;
  
  -- Send WhatsApp asynchronously via pg_net (non-blocking)
  IF should_send_whatsapp THEN
    BEGIN
      RAISE NOTICE '📱 Sending async WhatsApp notification to: %', user_phone;
      
      PERFORM net.http_post(
        url := 'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-whatsapp-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        ),
        body := jsonb_build_object(
          'user_id', _user_id::text,
          'title', _title,
          'message', _message,
          'type', _type,
          'priority', _priority,
          'action_url', _action_url
        )
      );
      
      RAISE NOTICE '✅ WhatsApp queued asynchronously for user % (notification: %)', _user_id, notification_id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '💥 Exception while queuing WhatsApp for user % (notification: %): %', _user_id, notification_id, SQLERRM;
    END;
  END IF;
  
  RETURN notification_id;
END;
$$;