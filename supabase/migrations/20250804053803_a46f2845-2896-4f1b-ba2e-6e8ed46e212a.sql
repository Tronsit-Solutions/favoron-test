-- Update the create_notification function to use net.http_post for better edge function calls
CREATE OR REPLACE FUNCTION public.create_notification(_user_id uuid, _title text, _message text, _type text DEFAULT 'general'::text, _priority text DEFAULT 'normal'::text, _action_url text DEFAULT NULL::text, _metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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
      
      -- Call the edge function using net.http_post  
      SELECT INTO http_result * FROM net.http_post(
        url := 'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-notification-email',
        body := payload::text,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        )
      );
      
      RAISE NOTICE '📬 HTTP response status: %, body: %', http_result.status_code, http_result.content;
      
      -- Check if the HTTP call was successful
      IF http_result.status_code BETWEEN 200 AND 299 THEN
        RAISE NOTICE '✅ Email notification sent successfully for user % (notification: %)', _user_id, notification_id;
      ELSE
        RAISE WARNING '❌ Failed to send email notification for user % (notification: %): HTTP status %', _user_id, notification_id, http_result.status_code;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the notification creation
      RAISE WARNING '💥 Exception while sending email notification for user % (notification: %): %', _user_id, notification_id, SQLERRM;
    END;
  END IF;
  
  RETURN notification_id;
END;
$function$;