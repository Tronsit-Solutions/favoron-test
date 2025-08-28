-- Harden payment_orders RLS: restrict traveler SELECT strictly to own records via traveler_id
DO $$
BEGIN
  -- Drop existing traveler SELECT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payment_orders' 
      AND policyname = 'Travelers can view their own payment orders'
      AND cmd = 'SELECT'
  ) THEN
    EXECUTE 'DROP POLICY "Travelers can view their own payment orders" ON public.payment_orders';
  END IF;
END $$;

-- Recreate stricter SELECT policy for travelers
CREATE POLICY "Travelers can view their own payment orders"
ON public.payment_orders
FOR SELECT
TO authenticated
USING (auth.uid() = traveler_id);

-- Ensure existing admin policy remains (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payment_orders' 
      AND policyname = 'Admins can manage all payment orders'
  ) THEN
    CREATE POLICY "Admins can manage all payment orders"
    ON public.payment_orders
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
  END IF;
END $$;