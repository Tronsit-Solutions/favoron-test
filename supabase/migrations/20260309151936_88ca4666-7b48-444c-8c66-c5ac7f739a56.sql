
-- Fix search_path for all functions missing it

-- 1. audit_payment_order_admin_access (trigger)
CREATE OR REPLACE FUNCTION public.audit_payment_order_admin_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  admin_user_id uuid := auth.uid();
  is_admin boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = admin_user_id AND ur.role = 'admin'
  ) INTO is_admin;
  
  IF is_admin AND TG_OP IN ('UPDATE', 'DELETE') THEN
    INSERT INTO public.admin_profile_access_log (
      admin_user_id, accessed_profile_id, access_type, reason, session_info
    ) VALUES (
      admin_user_id,
      COALESCE(NEW.traveler_id, OLD.traveler_id),
      'payment_order_' || lower(TG_OP),
      'Admin accessed payment order ID: ' || COALESCE(NEW.id::text, OLD.id::text),
      jsonb_build_object(
        'payment_order_id', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP,
        'timestamp', NOW(),
        'amount', COALESCE(NEW.amount, OLD.amount)
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 2. auto_approve_prime_payments (trigger)
CREATE OR REPLACE FUNCTION public.auto_approve_prime_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_trust_level TEXT;
  incoming_auto_approved BOOLEAN;
BEGIN
  IF NEW.payment_receipt IS NOT NULL 
     AND (OLD.payment_receipt IS NULL OR OLD.payment_receipt IS DISTINCT FROM NEW.payment_receipt) THEN
    
    incoming_auto_approved := COALESCE((NEW.payment_receipt->>'auto_approved')::boolean, false);
    
    IF incoming_auto_approved = true THEN
      IF NEW.status NOT IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation', 
                            'delivered_to_office', 'out_for_delivery', 'completed', 'cancelled') THEN
        NEW.status := 'pending_purchase';
      END IF;
      RETURN NEW;
    END IF;
    
    SELECT trust_level::text INTO user_trust_level
    FROM profiles
    WHERE id = NEW.user_id;
    
    IF OLD.status NOT IN ('in_transit', 'received_by_traveler', 'pending_office_confirmation', 
                          'delivered_to_office', 'out_for_delivery', 'completed', 'cancelled') THEN
      
      IF user_trust_level IN ('prime', 'confiable') THEN
        NEW.status := 'pending_purchase';
        NEW.payment_receipt := jsonb_set(
          jsonb_set(NEW.payment_receipt, '{auto_approved}', 'true'::jsonb),
          '{trust_level_at_upload}', to_jsonb(user_trust_level)
        );
      ELSE
        NEW.status := 'payment_pending_approval';
        NEW.payment_receipt := jsonb_set(
          jsonb_set(NEW.payment_receipt, '{auto_approved}', 'false'::jsonb),
          '{trust_level_at_upload}', to_jsonb(user_trust_level)
        );
      END IF;
      
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. expire_approved_deadlines
CREATE OR REPLACE FUNCTION public.expire_approved_deadlines()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  expired_count integer;
BEGIN
  UPDATE packages
  SET status = 'deadline_expired',
      updated_at = now()
  WHERE status = 'approved'
    AND delivery_deadline < now()
    AND wants_requote = false;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN jsonb_build_object('expired_count', expired_count);
END;
$function$;

-- 4. get_admin_trips_with_user
CREATE OR REPLACE FUNCTION public.get_admin_trips_with_user()
RETURNS TABLE(id uuid, from_city text, to_city text, from_country text, to_country text, arrival_date text, delivery_date text, first_day_packages text, last_day_packages text, delivery_method text, messenger_pickup_info jsonb, package_receiving_address jsonb, status text, created_at text, updated_at text, user_id uuid, first_name text, last_name text, email text, phone_number text, username text, user_display_name text, available_space numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    t.id, t.from_city, t.to_city, t.from_country, t.to_country,
    t.arrival_date::text, t.delivery_date::text,
    t.first_day_packages::text, t.last_day_packages::text,
    t.delivery_method, t.messenger_pickup_info,
    t.package_receiving_address, t.status,
    t.created_at::text, t.updated_at::text, t.user_id,
    p.first_name, p.last_name, p.email, p.phone_number, p.username,
    CONCAT(p.first_name, ' ', p.last_name) as user_display_name,
    t.available_space
  FROM public.trips t
  LEFT JOIN public.profiles p ON p.id = t.user_id
  ORDER BY t.created_at DESC;
$function$;

-- 5. get_my_referred_reward
CREATE OR REPLACE FUNCTION public.get_my_referred_reward()
RETURNS TABLE(reward_amount numeric, reward_used boolean, referrer_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.referred_reward_amount,
    r.referred_reward_used,
    COALESCE(p.first_name || ' ' || p.last_name, p.username, 'Usuario') as referrer_name
  FROM referrals r
  JOIN profiles p ON p.id = r.referrer_id
  WHERE r.referred_id = auth.uid()
  LIMIT 1;
END;
$function$;

-- 6. validate_payment_order_data (trigger, not SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.validate_payment_order_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.bank_account_number IS NOT NULL THEN
    NEW.bank_account_number := REGEXP_REPLACE(NEW.bank_account_number, '\s+', '', 'g');
    
    IF LENGTH(NEW.bank_account_number) < 4 OR LENGTH(NEW.bank_account_number) > 30 THEN
      RAISE EXCEPTION 'Invalid bank account number length';
    END IF;
    
    IF NEW.bank_account_number !~ '^[A-Za-z0-9\-]+$' THEN
      RAISE EXCEPTION 'Invalid bank account number format';
    END IF;
  END IF;
  
  IF NEW.amount IS NOT NULL AND NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  
  IF NEW.bank_account_holder IS NOT NULL THEN
    IF LENGTH(TRIM(NEW.bank_account_holder)) < 2 THEN
      RAISE EXCEPTION 'Bank account holder name too short';
    END IF;
    
    NEW.bank_account_holder := REGEXP_REPLACE(TRIM(NEW.bank_account_holder), '\s+', ' ', 'g');
  END IF;
  
  RETURN NEW;
END;
$function$;
