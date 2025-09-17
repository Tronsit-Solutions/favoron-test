-- Security Hardening: Update all database functions with proper SECURITY DEFINER and search_path
-- This addresses the database configuration security issues found in the security scan

-- Update create_notification function
CREATE OR REPLACE FUNCTION public.create_notification(_user_id uuid, _title text, _message text, _type text DEFAULT 'general'::text, _priority text DEFAULT 'normal'::text, _action_url text DEFAULT NULL::text, _metadata jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update log_admin_action function
CREATE OR REPLACE FUNCTION public.log_admin_action(_package_id uuid, _admin_id uuid, _action_type text, _action_description text, _additional_data jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update log_admin_profile_access function
CREATE OR REPLACE FUNCTION public.log_admin_profile_access(_accessed_profile_id uuid, _access_type text, _reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only allow admins to log access
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can log profile access';
  END IF;

  INSERT INTO public.admin_profile_access_log (
    admin_user_id,
    accessed_profile_id,
    access_type,
    reason,
    session_info
  ) VALUES (
    auth.uid(),
    _accessed_profile_id,
    _access_type,
    _reason,
    jsonb_build_object(
      'timestamp', NOW(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent',
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
    )
  );
END;
$function$;

-- Update validate_banking_info function
CREATE OR REPLACE FUNCTION public.validate_banking_info(_bank_name text, _account_number text, _account_holder text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Basic validation rules
  IF LENGTH(_bank_name) < 2 OR LENGTH(_bank_name) > 100 THEN
    RETURN FALSE;
  END IF;
  
  IF LENGTH(_account_number) < 4 OR LENGTH(_account_number) > 50 THEN
    RETURN FALSE;
  END IF;
  
  IF LENGTH(_account_holder) < 2 OR LENGTH(_account_holder) > 100 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for suspicious patterns
  IF _account_number ~ '^[0-9]+$' AND LENGTH(_account_number) < 8 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Update get_public_stats function
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(total_packages_completed bigint, total_users bigint, total_trips bigint, total_tips_distributed numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update get_public_trips function
CREATE OR REPLACE FUNCTION public.get_public_trips()
RETURNS TABLE(id uuid, from_city text, to_city text, arrival_date timestamp with time zone, departure_date timestamp with time zone, status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    t.id,
    t.from_city,
    t.to_city,
    t.arrival_date,
    t.departure_date,
    t.status
  FROM public.trips t
  WHERE t.status IN ('approved', 'active')
    AND t.arrival_date::date >= CURRENT_DATE
  ORDER BY t.arrival_date ASC;
$function$;

-- Create enhanced security audit function
CREATE OR REPLACE FUNCTION public.audit_financial_data_access(_user_id uuid, _access_type text, _data_type text, _masked boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Log financial data access for audit purposes
  INSERT INTO public.client_errors (
    user_id,
    type,
    name,
    message,
    context,
    severity,
    created_at
  ) VALUES (
    auth.uid(),
    'security_audit',
    'financial_data_access',
    format('Financial data accessed: %s for user %s', _data_type, _user_id),
    jsonb_build_object(
      'accessed_user_id', _user_id,
      'access_type', _access_type,
      'data_type', _data_type,
      'masked', _masked,
      'session_info', jsonb_build_object(
        'timestamp', NOW(),
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      )
    ),
    'info',
    NOW()
  );
END;
$function$;

-- Create function to mask sensitive financial data
CREATE OR REPLACE FUNCTION public.mask_account_number(_account_number text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF _account_number IS NULL OR LENGTH(_account_number) <= 4 THEN
    RETURN '****';
  END IF;
  
  RETURN '****' || RIGHT(_account_number, 4);
END;
$function$;