
-- 1. Create boost_codes table
CREATE TABLE public.boost_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  boost_type text NOT NULL DEFAULT 'fixed',
  boost_value numeric NOT NULL,
  max_boost_amount numeric,
  max_uses integer,
  single_use_per_user boolean DEFAULT false,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create boost_code_usage table
CREATE TABLE public.boost_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boost_code_id uuid NOT NULL REFERENCES public.boost_codes(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boost_amount numeric NOT NULL,
  used_at timestamptz DEFAULT now()
);

-- 3. Add boost_amount column to trip_payment_accumulator
ALTER TABLE public.trip_payment_accumulator
  ADD COLUMN boost_amount numeric NOT NULL DEFAULT 0;

-- 4. Enable RLS
ALTER TABLE public.boost_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boost_code_usage ENABLE ROW LEVEL SECURITY;

-- 5. RLS for boost_codes: admin full CRUD
CREATE POLICY "Admins can manage boost_codes"
  ON public.boost_codes FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 6. RLS for boost_code_usage: admin full access
CREATE POLICY "Admins can manage boost_code_usage"
  ON public.boost_code_usage FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Travelers can view their own usage
CREATE POLICY "Travelers can view own boost usage"
  ON public.boost_code_usage FOR SELECT
  TO authenticated
  USING (traveler_id = auth.uid());

-- Travelers can insert their own usage (for applying boost codes)
CREATE POLICY "Travelers can insert own boost usage"
  ON public.boost_code_usage FOR INSERT
  TO authenticated
  WITH CHECK (traveler_id = auth.uid());

-- 7. RPC validate_boost_code
CREATE OR REPLACE FUNCTION public.validate_boost_code(
  _code text,
  _trip_id uuid,
  _traveler_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _boost_code boost_codes%ROWTYPE;
  _usage_count integer;
  _user_usage_count integer;
  _accumulated numeric;
  _calculated_boost numeric;
  _existing_boost numeric;
BEGIN
  -- Find boost code
  SELECT * INTO _boost_code
  FROM boost_codes
  WHERE code = upper(_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Código no encontrado o inactivo');
  END IF;

  -- Check expiration
  IF _boost_code.expires_at IS NOT NULL AND _boost_code.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'El código ha expirado');
  END IF;

  -- Check max uses
  IF _boost_code.max_uses IS NOT NULL THEN
    SELECT count(*) INTO _usage_count FROM boost_code_usage WHERE boost_code_id = _boost_code.id;
    IF _usage_count >= _boost_code.max_uses THEN
      RETURN jsonb_build_object('valid', false, 'error', 'El código ha alcanzado el máximo de usos');
    END IF;
  END IF;

  -- Check single use per user
  IF _boost_code.single_use_per_user THEN
    SELECT count(*) INTO _user_usage_count
    FROM boost_code_usage
    WHERE boost_code_id = _boost_code.id AND traveler_id = _traveler_id;
    IF _user_usage_count > 0 THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Ya usaste este código');
    END IF;
  END IF;

  -- Check if this trip already has a boost applied
  SELECT count(*) INTO _existing_boost
  FROM boost_code_usage
  WHERE trip_id = _trip_id;
  IF _existing_boost > 0 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Este viaje ya tiene un boost aplicado');
  END IF;

  -- Calculate boost amount
  IF _boost_code.boost_type = 'fixed' THEN
    _calculated_boost := _boost_code.boost_value;
  ELSIF _boost_code.boost_type = 'percentage' THEN
    -- Get accumulated tip amount for this trip
    SELECT COALESCE(accumulated_amount, 0) INTO _accumulated
    FROM trip_payment_accumulator
    WHERE trip_id = _trip_id AND traveler_id = _traveler_id;

    IF _accumulated IS NULL OR _accumulated <= 0 THEN
      RETURN jsonb_build_object('valid', false, 'error', 'No hay tips acumulados para calcular el boost');
    END IF;

    _calculated_boost := (_accumulated * _boost_code.boost_value / 100);

    -- Apply cap if max_boost_amount is set
    IF _boost_code.max_boost_amount IS NOT NULL AND _calculated_boost > _boost_code.max_boost_amount THEN
      _calculated_boost := _boost_code.max_boost_amount;
    END IF;
  ELSE
    RETURN jsonb_build_object('valid', false, 'error', 'Tipo de boost inválido');
  END IF;

  -- Round to 2 decimals
  _calculated_boost := round(_calculated_boost, 2);

  -- Register usage
  INSERT INTO boost_code_usage (boost_code_id, trip_id, traveler_id, boost_amount)
  VALUES (_boost_code.id, _trip_id, _traveler_id, _calculated_boost);

  -- Update trip_payment_accumulator
  UPDATE trip_payment_accumulator
  SET boost_amount = _calculated_boost, updated_at = now()
  WHERE trip_id = _trip_id AND traveler_id = _traveler_id;

  RETURN jsonb_build_object(
    'valid', true,
    'boost_amount', _calculated_boost,
    'boost_type', _boost_code.boost_type,
    'boost_value', _boost_code.boost_value,
    'code', _boost_code.code,
    'description', _boost_code.description
  );
END;
$$;
