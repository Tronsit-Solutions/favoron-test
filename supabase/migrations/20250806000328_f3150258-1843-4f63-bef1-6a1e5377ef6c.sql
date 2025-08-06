-- Fix Auth RLS Initialization Plan issues by updating problematic RLS policies

-- 1. Drop and recreate policies for user_roles table
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Users can view all roles" ON public.user_roles
FOR SELECT USING (true);

-- 2. Update trips policies
DROP POLICY IF EXISTS "Users can view trips optimized" ON public.trips;
DROP POLICY IF EXISTS "Users can update trips optimized" ON public.trips;
DROP POLICY IF EXISTS "Only admins can delete trips" ON public.trips;

CREATE POLICY "Users can view trips optimized" ON public.trips
FOR SELECT USING (
  status <> 'pending_approval' 
  OR user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Users can update trips optimized" ON public.trips
FOR UPDATE USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Only admins can delete trips" ON public.trips
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 3. Update notifications policies
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

CREATE POLICY "Admins can manage all notifications" ON public.notifications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 4. Update trip_payment_accumulator policies
DROP POLICY IF EXISTS "Admins can manage all trip payment accumulators" ON public.trip_payment_accumulator;

CREATE POLICY "Admins can manage all trip payment accumulators" ON public.trip_payment_accumulator
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 5. Update packages policies
DROP POLICY IF EXISTS "Users can view packages optimized" ON public.packages;
DROP POLICY IF EXISTS "Users can update packages optimized" ON public.packages;
DROP POLICY IF EXISTS "Only admins can delete packages" ON public.packages;

CREATE POLICY "Users can view packages optimized" ON public.packages
FOR SELECT USING (
  user_id = auth.uid() 
  OR matched_trip_id IN (
    SELECT id FROM public.trips WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Users can update packages optimized" ON public.packages
FOR UPDATE USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Only admins can delete packages" ON public.packages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 6. Update package_messages policies
DROP POLICY IF EXISTS "Admins can delete any message" ON public.package_messages;
DROP POLICY IF EXISTS "Users can insert messages optimized" ON public.package_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.package_messages;
DROP POLICY IF EXISTS "Users can view messages optimized" ON public.package_messages;

CREATE POLICY "Admins can delete any message" ON public.package_messages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Users can insert messages optimized" ON public.package_messages
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM public.packages p
      WHERE p.id = package_messages.package_id 
      AND (
        p.user_id = auth.uid() 
        OR p.matched_trip_id IN (
          SELECT id FROM public.trips WHERE user_id = auth.uid()
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
);

CREATE POLICY "Users can update their own messages" ON public.package_messages
FOR UPDATE USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Users can view messages optimized" ON public.package_messages
FOR SELECT USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.packages p
    WHERE p.id = package_messages.package_id 
    AND (
      p.user_id = auth.uid() 
      OR p.matched_trip_id IN (
        SELECT id FROM public.trips WHERE user_id = auth.uid()
      )
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 7. Update payment_orders policies
DROP POLICY IF EXISTS "Admins can manage all payment orders" ON public.payment_orders;

CREATE POLICY "Admins can manage all payment orders" ON public.payment_orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);