-- =====================================================
-- TRIGGER: Enviar correo de bienvenida automáticamente
-- =====================================================

-- Función que llama a la edge function send-welcome-email
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  http_result RECORD;
  payload JSONB;
BEGIN
  -- Solo enviar si tenemos email y grupo A/B
  IF NEW.email IS NOT NULL AND NEW.ab_test_group IS NOT NULL THEN
    BEGIN
      -- Construir payload
      payload := jsonb_build_object(
        'user_id', NEW.id::text,
        'email', NEW.email,
        'first_name', COALESCE(NEW.first_name, ''),
        'ab_test_group', NEW.ab_test_group
      );
      
      RAISE NOTICE '📧 Sending welcome email to % (Group %)', NEW.email, NEW.ab_test_group;
      
      -- Llamar a la edge function
      SELECT INTO http_result * FROM extensions.http((
        'POST',
        'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-welcome-email',
        ARRAY[
          extensions.http_header('Content-Type', 'application/json'),
          extensions.http_header('Authorization', 'Bearer ' || current_setting('app.service_role_key', true))
        ],
        'application/json',
        payload::text
      ));
      
      IF http_result.status BETWEEN 200 AND 299 THEN
        RAISE NOTICE '✅ Welcome email sent successfully to %', NEW.email;
      ELSE
        RAISE WARNING '❌ Failed to send welcome email to %: HTTP status %', NEW.email, http_result.status;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the profile creation
      RAISE WARNING '💥 Exception while sending welcome email to %: %', NEW.email, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger que se ejecuta después de insertar un nuevo perfil
DROP TRIGGER IF EXISTS on_profile_created_send_welcome_email ON public.profiles;

CREATE TRIGGER on_profile_created_send_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email_on_signup();