-- Fix the apply_quote_pricing trigger to respect manually edited quotes
-- and use correct trust levels for service fee calculation

CREATE OR REPLACE FUNCTION public.apply_quote_pricing()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_price numeric;
  delivery_fee numeric := 0;
  service_fee numeric;
  computed_total numeric;
  shopper_trust_level text;
  service_rate numeric;
  city_area text;
  is_guatemala_city boolean;
BEGIN
  -- Only act if quote exists and has a base price
  IF NEW.quote IS NULL OR (NEW.quote ? 'price') IS FALSE THEN
    RETURN NEW;
  END IF;

  -- CRITICAL: RESPECT MANUALLY EDITED QUOTES - DO NOT RECALCULATE
  IF COALESCE((NEW.quote->>'manually_edited')::boolean, false) = true THEN
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

  -- Get shopper's trust level
  SELECT COALESCE(trust_level::text, 'basic') INTO shopper_trust_level
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Set service rate based on trust level
  IF shopper_trust_level = 'prime' THEN
    service_rate := 0.25;  -- 25% for Prime
  ELSIF shopper_trust_level = 'confiable' THEN
    service_rate := 0.35;  -- 35% for Confiable
  ELSE
    service_rate := 0.40;  -- 40% for standard/basic
  END IF;
  
  service_fee := ROUND(base_price * service_rate, 2);

  -- Calculate delivery fee based on delivery method, trust level, and city
  IF NEW.delivery_method = 'delivery' THEN
    -- Get city area from confirmed_delivery_address
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
      delivery_fee := 0;  -- Free delivery for Prime in Guatemala City
    ELSIF shopper_trust_level = 'prime' AND NOT is_guatemala_city THEN
      delivery_fee := 35;  -- Q35 for Prime outside Guatemala City (Q60 - Q25 discount)
    ELSIF is_guatemala_city THEN
      delivery_fee := 25;  -- Q25 for standard in Guatemala City
    ELSE
      delivery_fee := 60;  -- Q60 for standard outside Guatemala City
    END IF;
  ELSE
    delivery_fee := 0;  -- No delivery fee for pickup
  END IF;

  -- Compute total: base_price + service_fee + delivery_fee
  computed_total := ROUND(base_price + service_fee + delivery_fee, 2);

  -- Update quote with correct values
  NEW.quote := jsonb_set(
    NEW.quote,
    '{serviceFee}',
    to_jsonb(service_fee),
    true
  );
  
  NEW.quote := jsonb_set(
    NEW.quote,
    '{deliveryFee}',
    to_jsonb(delivery_fee),
    true
  );

  NEW.quote := jsonb_set(
    NEW.quote,
    '{totalPrice}',
    to_jsonb(computed_total),
    true
  );

  RETURN NEW;
END;
$$;