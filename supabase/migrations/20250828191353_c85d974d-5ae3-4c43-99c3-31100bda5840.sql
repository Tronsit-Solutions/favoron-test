-- Harden payment_orders against anonymous access while preserving current functionality
-- 1) Ensure RLS is enabled (idempotent)
ALTER TABLE IF EXISTS public.payment_orders ENABLE ROW LEVEL SECURITY;

-- 2) Revoke broad/default grants from PUBLIC and anon
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'payment_orders'
  ) THEN
    REVOKE ALL ON TABLE public.payment_orders FROM PUBLIC;
    REVOKE ALL ON TABLE public.payment_orders FROM anon;
    -- Reset authenticated grants to avoid privilege drift
    REVOKE ALL ON TABLE public.payment_orders FROM authenticated;

    -- 3) Grant explicit minimal privileges to authenticated; RLS will further restrict
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payment_orders TO authenticated;

    COMMENT ON TABLE public.payment_orders IS 'Sensitive financial data. Access limited to authenticated role; enforced by RLS policies for admins and travelers.';
  END IF;
END $$;