
DROP FUNCTION IF EXISTS public.get_my_referrals();

CREATE FUNCTION public.get_my_referrals()
RETURNS TABLE(
  id uuid,
  referred_id uuid,
  referred_name text,
  status text,
  reward_amount numeric,
  completed_at timestamptz,
  created_at timestamptz,
  reward_used boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.referred_id,
    COALESCE(p.first_name || ' ' || LEFT(COALESCE(p.last_name, ''), 1) || '.', p.username, 'Usuario') as referred_name,
    r.status,
    r.reward_amount,
    r.completed_at,
    r.created_at,
    COALESCE(r.reward_used, false) as reward_used
  FROM referrals r
  LEFT JOIN profiles p ON p.id = r.referred_id
  WHERE r.referrer_id = auth.uid()
  ORDER BY r.created_at DESC;
$$;
