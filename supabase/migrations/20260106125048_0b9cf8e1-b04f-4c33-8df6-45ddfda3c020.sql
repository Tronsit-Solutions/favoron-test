-- Fix the apply_quote_pricing trigger to use dynamic rates from favoron_company_information
-- instead of hardcoded outdated values (40% for basic was wrong, should be 50%)

CREATE OR REPLACE FUNCTION public.apply_quote_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_price numeric;
  delivery_fee numeric := 0;
  service_fee numeric;
  computed_total numeric;
  shopper_trust_level text;
  service_rate numeric;
  service_rate_standard numeric;
  service_rate_prime numeric;
  city_area text;
  is_guatemala_city boolean;
BEGIN
  -- Only act if quote exists and has a base price
  IF NEW.quote IS NULL OR (NEW.quote ? 'price') IS FALSE THEN
    RETURN NEW;
  END IF;

  -- CRITICAL: RESPECT MANUALLY EDITED QUOTES - DO NOT RECALCULATE
  -- Check both NEW and OLD to handle cases where flag is set in same transaction
  IF COALESCE((NEW.quote->>'manually_edited')::boolean, false) = true 
     OR (OLD IS NOT NULL AND COALESCE((OLD.quote->>'manually_edited')::boolean, false) = true) THEN
    RETURN NEW;
  END IF;

  -- Parse base price safely
  BEGIN
    base_price := NULLIF(NEW.quote->>'price','')::numeric;
  EXCEPTION WHEN others THEN
    base_price := NULL;
  END;

  IF base_price IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get dynamic rates from company configuration
  SELECT 
    COALESCE(service_fee_rate_standard, 0.50),
    COALESCE(service_fee_rate_prime, 0.25)
  INTO service_rate_standard, service_rate_prime
  FROM favoron_company_information
  WHERE is_active = true
  LIMIT 1;

  -- Fallback if no config found
  IF service_rate_standard IS NULL THEN
    service_rate_standard := 0.50;
    service_rate_prime := 0.25;
  END IF;

  -- Get shopper's trust level
  SELECT COALESCE(trust_level::text, 'basic') INTO shopper_trust_level
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Set service rate based on trust level (using dynamic rates)
  IF shopper_trust_level = 'prime' THEN
    service_rate := service_rate_prime;
  ELSE
    -- Both basic and confiable use standard rate
    service_rate := service_rate_standard;
  END IF;
  
  service_fee := ROUND(base_price * service_rate, 2);

  -- Calculate delivery fee based on delivery method and location
  IF NEW.delivery_method = 'delivery' THEN
    city_area := LOWER(COALESCE(
      NEW.confirmed_delivery_address->>'cityArea',
      NEW.confirmed_delivery_address->>'city',
      ''
    ));
    is_guatemala_city := city_area = 'guatemala' 
      OR city_area LIKE 'guatemala city%' 
      OR city_area LIKE 'ciudad de guatemala%'
      OR city_area LIKE '%guatemala%city%';
    
    IF shopper_trust_level = 'prime' AND is_guatemala_city THEN
      delivery_fee := 0;
    ELSIF shopper_trust_level = 'prime' AND NOT is_guatemala_city THEN
      delivery_fee := 35;
    ELSIF is_guatemala_city THEN
      delivery_fee := 25;
    ELSE
      delivery_fee := 60;
    END IF;
  ELSE
    delivery_fee := 0;
  END IF;

  computed_total := ROUND(base_price + service_fee + delivery_fee, 2);

  NEW.quote := jsonb_set(NEW.quote, '{serviceFee}', to_jsonb(service_fee), true);
  NEW.quote := jsonb_set(NEW.quote, '{deliveryFee}', to_jsonb(delivery_fee), true);
  NEW.quote := jsonb_set(NEW.quote, '{totalPrice}', to_jsonb(computed_total), true);

  RETURN NEW;
END;
$function$;

-- Fix the affected package #112d76 with correct values
-- serviceFee should be 15.00 (50% of Q30), not 12.00 (40% of Q30)
-- totalPrice should be 45.00 (30 + 15 + 0), not 42.00
UPDATE packages 
SET quote = jsonb_set(
  jsonb_set(quote, '{serviceFee}', '15.00'),
  '{totalPrice}', '45.00'
)
WHERE id = '112d76dd-4638-42d2-aea3-969620d8d7c5';