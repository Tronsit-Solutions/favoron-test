CREATE OR REPLACE FUNCTION public.register_referral(p_referral_code text, p_referred_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_reward_amount numeric;
  v_referred_discount numeric;
BEGIN
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;

  IF v_referrer_id = p_referred_id THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN
    RETURN false;
  END IF;

  -- FIX: Extract 'amount' field from jsonb object before casting
  SELECT COALESCE((value->>'amount')::numeric, 20) INTO v_reward_amount
  FROM app_settings
  WHERE key = 'referral_reward_amount';

  IF v_reward_amount IS NULL THEN
    v_reward_amount := 20;
  END IF;

  SELECT COALESCE((value->>'amount')::numeric, 20) INTO v_referred_discount
  FROM app_settings
  WHERE key = 'referred_user_discount';

  IF v_referred_discount IS NULL THEN
    v_referred_discount := 20;
  END IF;

  UPDATE profiles
  SET referrer_name = (
    SELECT COALESCE(first_name || ' ' || last_name, first_name, 'Usuario')
    FROM profiles WHERE id = v_referrer_id
  )
  WHERE id = p_referred_id;

  INSERT INTO referrals (referrer_id, referred_id, reward_amount, referred_reward_amount, status)
  VALUES (v_referrer_id, p_referred_id, v_reward_amount, v_referred_discount, 'pending');

  RETURN true;
END;
$$;