
CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE (
  id uuid,
  referred_id uuid,
  referred_name text,
  status text,
  reward_amount numeric,
  completed_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.referred_id,
    COALESCE(p.first_name || ' ' || p.last_name, 'Usuario') AS referred_name,
    r.status,
    r.reward_amount,
    r.completed_at,
    r.created_at
  FROM referrals r
  LEFT JOIN profiles p ON p.id = r.referred_id
  WHERE r.referrer_id = auth.uid()
  ORDER BY r.created_at DESC;
$$;
