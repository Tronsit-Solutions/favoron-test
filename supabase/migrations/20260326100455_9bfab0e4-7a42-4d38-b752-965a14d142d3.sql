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
  payload JSONB;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, priority, action_url, metadata)
  VALUES (_user_id, _title, _message, _type, _priority, _action_url, _metadata)
  RETURNING id INTO notification_id;

  SELECT p.email, p.first_name, p.email_notifications, p.email_notification_preferences
  INTO user_email, user_first_name, user_email_notifications, user_preferences
  FROM public.profiles p
  WHERE p.id = _user_id;

  IF user_email IS NOT NULL AND user_email_notifications = true THEN
    IF user_preferences IS NOT NULL AND user_preferences ? _type THEN
      should_send_email := (user_preferences->>_type)::boolean;
    ELSE
      should_send_email := (_priority IN ('high', 'urgent'));
    END IF;
  END IF;

  IF should_send_email THEN
    BEGIN
      payload := jsonb_build_object(
        'user_id', _user_id::text,
        'title', _title,
        'message', _message,
        'type', _type,
        'priority', _priority,
        'action_url', _action_url
      );

      PERFORM net.http_post(
        url := 'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-notification-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        ),
        body := payload
      );

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Exception while queuing email notification for user % (notification: %): %', _user_id, notification_id, SQLERRM;
    END;
  END IF;

  RETURN notification_id;
END;
$function$;