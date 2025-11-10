-- Enable HTTP extension for making calls to edge functions
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Function to send WhatsApp notification when a chat message is sent
-- NOTE: To enable WhatsApp notifications, you need to configure the service_role_key:
-- 1. Go to Supabase Dashboard > Project Settings > API
-- 2. Copy the service_role key (secret)
-- 3. Run this SQL in SQL Editor:
--    ALTER ROLE authenticator SET app.settings.supabase_service_role_key = 'your_service_role_key_here';
CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_package RECORD;
  v_trip RECORD;
  v_sender_profile RECORD;
  v_recipient_id uuid;
  v_sender_role text;
  v_package_desc text;
  v_sender_name text;
  v_message_title text;
  v_message_body text;
  v_service_key text;
BEGIN
  -- Only process text messages and file uploads (not status_updates)
  IF NEW.message_type NOT IN ('text', 'file_upload') THEN
    RETURN NEW;
  END IF;

  -- Get package information
  SELECT * INTO v_package
  FROM public.packages
  WHERE id = NEW.package_id;

  -- Get trip information if exists
  IF v_package.matched_trip_id IS NOT NULL THEN
    SELECT * INTO v_trip
    FROM public.trips
    WHERE id = v_package.matched_trip_id;
  END IF;

  -- Get sender profile
  SELECT first_name, last_name INTO v_sender_profile
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Build sender name
  v_sender_name := COALESCE(
    TRIM(CONCAT(v_sender_profile.first_name, ' ', v_sender_profile.last_name)),
    'un usuario'
  );

  -- Determine recipient and sender role
  IF NEW.user_id = v_package.user_id THEN
    -- Sender is shopper, recipient is traveler
    IF v_trip.user_id IS NULL THEN
      -- No traveler assigned yet, skip notification
      RETURN NEW;
    END IF;
    v_recipient_id := v_trip.user_id;
    v_sender_role := 'shopper';
  ELSIF v_trip.user_id IS NOT NULL AND v_trip.user_id = NEW.user_id THEN
    -- Sender is traveler, recipient is shopper
    v_recipient_id := v_package.user_id;
    v_sender_role := 'traveler';
  ELSE
    -- Could be admin or other user, skip notification
    RETURN NEW;
  END IF;

  -- Prepare short package description (first 50 characters)
  v_package_desc := SUBSTRING(v_package.item_description, 1, 50);
  IF LENGTH(v_package.item_description) > 50 THEN
    v_package_desc := v_package_desc || '...';
  END IF;

  -- Build notification title and message
  IF NEW.message_type = 'file_upload' THEN
    v_message_title := '📎 Nuevo archivo en el chat';
  ELSE
    v_message_title := '💬 Nuevo mensaje en el chat';
  END IF;

  IF v_sender_role = 'shopper' THEN
    v_message_body := 'El comprador ' || v_sender_name || ' te envió un ' ||
      CASE 
        WHEN NEW.message_type = 'file_upload' THEN 'archivo'
        ELSE 'mensaje'
      END ||
      ' sobre el paquete "' || v_package_desc || '".' || E'\n\n' ||
      'Responde en el chat del paquete.';
  ELSE
    v_message_body := 'El viajero ' || v_sender_name || ' te envió un ' ||
      CASE 
        WHEN NEW.message_type = 'file_upload' THEN 'archivo'
        ELSE 'mensaje'
      END ||
      ' sobre tu paquete "' || v_package_desc || '".' || E'\n\n' ||
      'Responde en el chat del paquete.';
  END IF;

  -- Try to get service role key
  BEGIN
    v_service_key := current_setting('app.settings.supabase_service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    v_service_key := NULL;
  END;

  -- Only send WhatsApp notification if service key is configured
  IF v_service_key IS NOT NULL THEN
    BEGIN
      PERFORM
        extensions.http_post(
          url := 'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-whatsapp-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_service_key
          ),
          body := jsonb_build_object(
            'user_id', v_recipient_id::text,
            'title', v_message_title,
            'message', v_message_body,
            'type', 'package',
            'priority', 'medium',
            'action_url', 'https://favoron.app/dashboard'
          )::text
        );
      
      RAISE NOTICE '📱 WhatsApp notification queued for user % (chat message)', v_recipient_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️ Failed to send WhatsApp notification for chat message: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️ Service role key not configured, skipping WhatsApp notification';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on package_messages
DROP TRIGGER IF EXISTS on_chat_message_sent ON public.package_messages;
CREATE TRIGGER on_chat_message_sent
  AFTER INSERT ON public.package_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_message();