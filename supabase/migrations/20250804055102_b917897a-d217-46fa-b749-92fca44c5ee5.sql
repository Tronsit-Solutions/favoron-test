-- Create a simplified notification function that sends emails directly
CREATE OR REPLACE FUNCTION public.create_notification_with_direct_email(_user_id uuid, _title text, _message text, _type text DEFAULT 'general'::text, _priority text DEFAULT 'normal'::text, _action_url text DEFAULT NULL::text, _metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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