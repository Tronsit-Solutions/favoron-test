
-- 1. Add referral_code column to profiles
ALTER TABLE public.profiles ADD COLUMN referral_code text UNIQUE;

-- 2. Function to generate unique 6-char alphanumeric code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
  attempts int := 0;
BEGIN
  LOOP
    new_code := '';
    FOR i IN 1..6 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_code) THEN
      NEW.referral_code := new_code;
      RETURN NEW;
    END IF;
    
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique referral code after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- 3. Trigger to auto-generate referral code on profile creation
CREATE TRIGGER generate_referral_code_on_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION public.generate_referral_code();

-- 4. Backfill existing profiles that don't have a referral code
DO $$
DECLARE
  r RECORD;
  new_code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE referral_code IS NULL LOOP
    LOOP
      new_code := '';
      FOR i IN 1..6 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      BEGIN
        UPDATE profiles SET referral_code = new_code WHERE id = r.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        -- retry with new code
      END;
    END LOOP;
  END LOOP;
END;
$$;

-- 5. Create referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id),
  referred_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending',
  reward_amount numeric NOT NULL DEFAULT 30,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies
CREATE POLICY "Users can view their own referrals as referrer"
ON public.referrals FOR SELECT
USING (referrer_id = auth.uid());

CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create referral as referred"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referred_id);

-- 8. Trigger function for completing referrals on package/trip completion
CREATE OR REPLACE FUNCTION public.complete_referral_on_first_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_referral_id uuid;
  v_referrer_id uuid;
  v_reward numeric;
  v_has_prior_completed boolean;
BEGIN
  -- Only act when status changes to 'completed'
  IF NEW.status <> 'completed' OR (OLD.status IS NOT NULL AND OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;

  -- Check if user has a pending referral
  SELECT id, referrer_id INTO v_referral_id, v_referrer_id
  FROM referrals
  WHERE referred_id = v_user_id AND status = 'pending'
  LIMIT 1;

  IF v_referral_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if user has any OTHER completed packages or trips (excluding current)
  IF TG_TABLE_NAME = 'packages' THEN
    SELECT EXISTS (
      SELECT 1 FROM packages 
      WHERE user_id = v_user_id AND status = 'completed' AND id <> NEW.id
    ) INTO v_has_prior_completed;
    
    IF NOT v_has_prior_completed THEN
      SELECT EXISTS (
        SELECT 1 FROM trips 
        WHERE user_id = v_user_id AND status = 'completed'
      ) INTO v_has_prior_completed;
    END IF;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM trips 
      WHERE user_id = v_user_id AND status = 'completed' AND id <> NEW.id
    ) INTO v_has_prior_completed;
    
    IF NOT v_has_prior_completed THEN
      SELECT EXISTS (
        SELECT 1 FROM packages 
        WHERE user_id = v_user_id AND status = 'completed'
      ) INTO v_has_prior_completed;
    END IF;
  END IF;

  IF v_has_prior_completed THEN
    RETURN NEW;
  END IF;

  -- Read reward amount from app_settings
  SELECT COALESCE((value->>'amount')::numeric, 30) INTO v_reward
  FROM app_settings
  WHERE key = 'referral_reward_amount';

  IF v_reward IS NULL THEN
    v_reward := 30;
  END IF;

  -- Mark referral as completed
  UPDATE referrals
  SET status = 'completed', reward_amount = v_reward, completed_at = now()
  WHERE id = v_referral_id;

  -- Create notification for referrer
  INSERT INTO notifications (user_id, title, message, type, priority)
  VALUES (
    v_referrer_id,
    '🎉 ¡Ganaste un reward de referido!',
    'Tu amigo completó su primer pedido. ¡Ganaste Q' || v_reward || '!',
    'referral_reward',
    'high'
  );

  RETURN NEW;
END;
$$;

-- 9. Triggers on packages and trips
CREATE TRIGGER complete_referral_on_package_completed
AFTER UPDATE ON public.packages
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
EXECUTE FUNCTION public.complete_referral_on_first_completion();

CREATE TRIGGER complete_referral_on_trip_completed
AFTER UPDATE ON public.trips
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
EXECUTE FUNCTION public.complete_referral_on_first_completion();

-- 10. Insert initial app_setting for reward amount
INSERT INTO public.app_settings (key, value, description)
VALUES ('referral_reward_amount', '{"amount": 30}', 'Monto del reward de referidos en GTQ')
ON CONFLICT (key) DO NOTHING;

-- 11. Index for performance
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id_status ON public.referrals(referred_id, status);
