-- Add payment_type to payment_orders table to differentiate payment types
ALTER TABLE public.payment_orders 
ADD COLUMN payment_type text NOT NULL DEFAULT 'trip_payment';

-- Add prime membership expiration to profiles table
ALTER TABLE public.profiles 
ADD COLUMN prime_expires_at timestamp with time zone;

-- Create function to handle Prime membership activation
CREATE OR REPLACE FUNCTION public.activate_prime_membership(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update user's trust level to prime and set expiration to 1 year from now
  UPDATE public.profiles 
  SET 
    trust_level = 'prime',
    prime_expires_at = NOW() + INTERVAL '1 year',
    updated_at = NOW()
  WHERE id = _user_id;
  
  -- Log the action
  RAISE NOTICE 'Prime membership activated for user %', _user_id;
END;
$$;

-- Create function to check and expire Prime memberships
CREATE OR REPLACE FUNCTION public.expire_prime_memberships()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  expired_count INTEGER := 0;
BEGIN
  -- Update expired Prime memberships back to basic
  UPDATE public.profiles 
  SET 
    trust_level = 'basic',
    prime_expires_at = NULL,
    updated_at = NOW()
  WHERE trust_level = 'prime' 
    AND prime_expires_at IS NOT NULL 
    AND prime_expires_at < NOW();
    
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RAISE NOTICE 'Expired % Prime memberships', expired_count;
END;
$$;

-- Create trigger to activate Prime when payment is approved
CREATE OR REPLACE FUNCTION public.handle_prime_payment_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only process Prime membership payments that are being approved
  IF NEW.payment_type = 'prime_membership' 
     AND NEW.status = 'completed' 
     AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Activate Prime membership for the traveler
    PERFORM public.activate_prime_membership(NEW.traveler_id);
    
    -- Create notification for the user
    PERFORM public.create_notification(
      NEW.traveler_id,
      '✨ ¡Bienvenido a Favorón Prime!',
      'Tu membresía Prime ha sido activada y estará vigente por 1 año. ¡Disfruta de todos los beneficios exclusivos!',
      'payment',
      'high',
      NULL,
      jsonb_build_object(
        'payment_order_id', NEW.id,
        'membership_type', 'prime',
        'expires_at', (
          SELECT prime_expires_at 
          FROM public.profiles 
          WHERE id = NEW.traveler_id
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for Prime payment approval
CREATE TRIGGER handle_prime_payment_approval_trigger
  AFTER UPDATE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_prime_payment_approval();