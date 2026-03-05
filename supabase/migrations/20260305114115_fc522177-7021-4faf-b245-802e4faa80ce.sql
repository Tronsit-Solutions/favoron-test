
-- Add referral_credit_applied to packages
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS referral_credit_applied numeric;

-- Add reward_used to referrals (for referrer side tracking)
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS reward_used boolean DEFAULT false;

-- Create RPC to mark referral credit as used when payment is confirmed
CREATE OR REPLACE FUNCTION public.mark_referral_credit_used(
  p_user_id uuid,
  p_amount numeric,
  p_package_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining numeric := p_amount;
  ref_record record;
BEGIN
  -- First, update referral_credit_applied on the package
  UPDATE packages 
  SET referral_credit_applied = p_amount 
  WHERE id = p_package_id AND user_id = p_user_id;

  -- Mark referrer rewards as used (completed referrals where user is referrer)
  FOR ref_record IN
    SELECT id, reward_amount 
    FROM referrals 
    WHERE referrer_id = p_user_id 
      AND status = 'completed' 
      AND (reward_used = false OR reward_used IS NULL)
    ORDER BY completed_at ASC
  LOOP
    EXIT WHEN remaining <= 0;
    
    UPDATE referrals SET reward_used = true WHERE id = ref_record.id;
    remaining := remaining - ref_record.reward_amount;
  END LOOP;

  -- If still remaining, mark referred reward as used
  IF remaining > 0 THEN
    UPDATE referrals 
    SET referred_reward_used = true 
    WHERE referred_id = p_user_id 
      AND (referred_reward_used = false OR referred_reward_used IS NULL)
      AND referred_reward_amount > 0;
  END IF;
END;
$$;
