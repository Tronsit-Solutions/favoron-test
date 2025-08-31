-- Function: apply_quote_pricing to compute totalPrice with 1.4x + 25 for delivery
CREATE OR REPLACE FUNCTION public.apply_quote_pricing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_price numeric;
  delivery_fee numeric := 0;
  service_multiplier numeric := 1.4;
  computed_total numeric;
BEGIN
  -- Only act if quote exists and has a base price
  IF NEW.quote IS NULL OR (NEW.quote ? 'price') IS FALSE THEN
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

  -- Delivery fee only when delivery_method = 'delivery'
  IF NEW.delivery_method = 'delivery' THEN
    delivery_fee := 25;
  ELSE
    delivery_fee := 0;
  END IF;

  -- Compute total and round to 2 decimals
  computed_total := ROUND(base_price * service_multiplier + delivery_fee, 2);

  -- Write totalPrice as a string with 2 decimals
  NEW.quote := jsonb_set(
    COALESCE(NEW.quote, '{}'::jsonb),
    '{totalPrice}',
    to_jsonb(to_char(computed_total, 'FM999999990.00')),
    true
  );

  RETURN NEW;
END;
$$;

-- Trigger to apply pricing when quote or delivery_method changes
DROP TRIGGER IF EXISTS packages_apply_quote_pricing ON public.packages;
CREATE TRIGGER packages_apply_quote_pricing
BEFORE INSERT OR UPDATE OF quote, delivery_method ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.apply_quote_pricing();

-- Backfill: ensure all existing quotes have correct totalPrice
DO $$
DECLARE
  _r RECORD;
  _base numeric;
  _fee numeric;
  _total numeric;
BEGIN
  FOR _r IN 
    SELECT id, quote, delivery_method
    FROM public.packages
    WHERE quote IS NOT NULL AND (quote ? 'price')
  LOOP
    BEGIN
      _base := NULLIF(_r.quote->>'price','')::numeric;
    EXCEPTION WHEN others THEN
      _base := NULL;
    END;

    IF _base IS NULL THEN
      CONTINUE;
    END IF;

    _fee := CASE WHEN _r.delivery_method = 'delivery' THEN 25 ELSE 0 END;
    _total := ROUND(_base * 1.4 + _fee, 2);

    UPDATE public.packages p
    SET quote = jsonb_set(COALESCE(p.quote, '{}'::jsonb), '{totalPrice}', to_jsonb(to_char(_total, 'FM999999990.00')), true),
        updated_at = NOW()
    WHERE p.id = _r.id;
  END LOOP;
END $$;