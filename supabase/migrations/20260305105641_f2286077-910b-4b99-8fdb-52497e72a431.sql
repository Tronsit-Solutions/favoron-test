
-- 1. Change the default from 30 to 20
ALTER TABLE referrals ALTER COLUMN reward_amount SET DEFAULT 20;

-- 2. Fix existing records
UPDATE referrals SET reward_amount = 20 WHERE reward_amount = 30;

-- 3. Recreate register_referral to read both values from app_settings
CREATE OR REPLACE FUNCTION public.register_referral(p_referred_id uuid, p_referral_code text)
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
  -- Find the referrer by their referral code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = p_referred_id THEN
    RETURN false;
  END IF;

  -- Check if the referred user already has a referral
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN
    RETURN false;
  END IF;

  -- Read reward amount from app_settings (fallback to 20)
  SELECT COALESCE((value)::numeric, 20) INTO v_reward_amount
  FROM app_settings
  WHERE key = 'referral_reward_amount';

  IF v_reward_amount IS NULL THEN
    v_reward_amount := 20;
  END IF;

  -- Read referred user discount from app_settings (fallback to 20)
  SELECT COALESCE((value)::numeric, 20) INTO v_referred_discount
  FROM app_settings
  WHERE key = 'referred_user_discount';

  IF v_referred_discount IS NULL THEN
    v_referred_discount := 20;
  END IF;

  -- Store referrer name on the referred user's profile
  UPDATE profiles
  SET referrer_name = (
    SELECT COALESCE(first_name || ' ' || last_name, first_name, 'Usuario')
    FROM profiles WHERE id = v_referrer_id
  )
  WHERE id = p_referred_id;

  -- Insert the referral with both amounts from app_settings
  INSERT INTO referrals (referrer_id, referred_id, reward_amount, referred_reward_amount, status)
  VALUES (v_referrer_id, p_referred_id, v_reward_amount, v_referred_discount, 'pending');

  RETURN true;
END;
$$;
