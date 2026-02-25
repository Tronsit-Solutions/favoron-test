-- Add columns for referred user reward
ALTER TABLE referrals ADD COLUMN referred_reward_amount numeric DEFAULT 0;
ALTER TABLE referrals ADD COLUMN referred_reward_used boolean DEFAULT false;

-- Insert app_settings for referred user discount
INSERT INTO app_settings (key, value, description)
VALUES ('referred_user_discount', '{"amount": 15, "enabled": true}', 'Monto del descuento para el usuario referido en su primer pedido')
ON CONFLICT (key) DO NOTHING;

-- Update register_referral RPC to also set referred_reward_amount
CREATE OR REPLACE FUNCTION register_referral(p_referred_id uuid, p_referral_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id uuid;
  v_referred_discount numeric := 0;
  v_setting jsonb;
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

  -- Read referred user discount from app_settings
  SELECT value INTO v_setting
  FROM app_settings
  WHERE key = 'referred_user_discount';

  IF v_setting IS NOT NULL AND (v_setting->>'enabled')::boolean = true THEN
    v_referred_discount := COALESCE((v_setting->>'amount')::numeric, 0);
  END IF;

  INSERT INTO referrals (referrer_id, referred_id, status, referred_reward_amount)
  VALUES (v_referrer_id, p_referred_id, 'pending', v_referred_discount)
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN true;
END;
$$;

-- Create RPC for referred user to check their pending reward
CREATE OR REPLACE FUNCTION get_my_referred_reward()
RETURNS TABLE(reward_amount numeric, reward_used boolean, referrer_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;