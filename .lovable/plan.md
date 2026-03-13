

## Problem

The `register_referral` function crashes silently because it tries to cast a JSONB object (`{"amount": 20}`) directly to `numeric`:

```sql
SELECT COALESCE((value)::numeric, 20) INTO v_reward_amount
FROM app_settings WHERE key = 'referral_reward_amount';
```

This fails because `value` is `{"amount": 20}` (a JSON object), not a plain number. The cast throws an error, the RPC returns an error, and the frontend catches it silently — so no referral is ever created.

This is exactly the bug we identified before: the old duplicate function was dropped, but **the remaining function still has the same broken cast**.

## Fix

### Step 1: Fix the `register_referral` function (DB migration)
Replace `(value)::numeric` with `(value->>'amount')::numeric` in both places (reward amount and discount amount).

```sql
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
  SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = p_referral_code;
  IF v_referrer_id IS NULL THEN RETURN false; END IF;
  IF v_referrer_id = p_referred_id THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN RETURN false; END IF;

  -- Fixed: extract 'amount' from JSONB before casting
  SELECT COALESCE((value->>'amount')::numeric, 20) INTO v_reward_amount
  FROM app_settings WHERE key = 'referral_reward_amount';
  IF v_reward_amount IS NULL THEN v_reward_amount := 20; END IF;

  SELECT COALESCE((value->>'amount')::numeric, 20) INTO v_referred_discount
  FROM app_settings WHERE key = 'referred_user_discount';
  IF v_referred_discount IS NULL THEN v_referred_discount := 20; END IF;

  UPDATE profiles SET referrer_name = (
    SELECT COALESCE(first_name || ' ' || last_name, first_name, 'Usuario')
    FROM profiles WHERE id = v_referrer_id
  ) WHERE id = p_referred_id;

  INSERT INTO referrals (referrer_id, referred_id, reward_amount, referred_reward_amount, status)
  VALUES (v_referrer_id, p_referred_id, v_reward_amount, v_referred_discount, 'pending');

  RETURN true;
END;
$$;
```

### Step 2: Manually fix Willy Lehrer's referral
Run an INSERT to create the missing referral record for Willy (`26986ca0-...`) referred by the admin (`5e3c944e-...`, code `9GYTT8`), and update his `referrer_name` on his profile.

No frontend code changes needed — the `registerReferral` function already has proper error logging from the previous fix.

