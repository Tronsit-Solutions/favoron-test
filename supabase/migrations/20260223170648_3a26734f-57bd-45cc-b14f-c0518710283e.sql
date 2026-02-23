CREATE OR REPLACE FUNCTION public.register_referral(
  p_referred_id uuid,
  p_referral_code text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
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

  INSERT INTO referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, p_referred_id, 'pending')
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN true;
END;
$$;