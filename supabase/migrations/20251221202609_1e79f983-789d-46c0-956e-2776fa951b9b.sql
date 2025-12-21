-- Fix the welcome email trigger by removing the Authorization header
-- Since the edge function has verify_jwt = false, no auth is needed

CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  http_result RECORD;
  payload JSONB;
BEGIN
  -- Only send if email and ab_test_group are set
  IF NEW.email IS NOT NULL AND NEW.ab_test_group IS NOT NULL THEN
    BEGIN
      payload := jsonb_build_object(
        'user_id', NEW.id::text,
        'email', NEW.email,
        'first_name', COALESCE(NEW.first_name, ''),
        'ab_test_group', NEW.ab_test_group
      );
      
      RAISE LOG '📧 Sending welcome email to % (Group %)', NEW.email, NEW.ab_test_group;
      
      -- Call WITHOUT Authorization header since verify_jwt = false
      SELECT INTO http_result * FROM extensions.http((
        'POST',
        'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-welcome-email',
        ARRAY[
          extensions.http_header('Content-Type', 'application/json')
        ],
        'application/json',
        payload::text
      ));
      
      IF http_result.status BETWEEN 200 AND 299 THEN
        RAISE LOG '✅ Welcome email sent successfully to %', NEW.email;
      ELSE
        RAISE WARNING '❌ Failed to send welcome email to %: HTTP status %, body: %', 
          NEW.email, http_result.status, http_result.content;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '💥 Exception while sending welcome email to %: %', NEW.email, SQLERRM;
    END;
  ELSE
    RAISE LOG '⚠️ Skipping welcome email - email: %, ab_test_group: %', NEW.email, NEW.ab_test_group;
  END IF;
  
  RETURN NEW;
END;
$$;