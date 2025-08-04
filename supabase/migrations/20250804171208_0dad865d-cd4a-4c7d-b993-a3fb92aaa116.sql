-- Optimizar políticas RLS para mejorar rendimiento
-- Los warnings surgen porque auth.uid() se evalúa múltiples veces

-- 1. Crear función optimizada para obtener user ID
CREATE OR REPLACE FUNCTION auth.user_id() 
RETURNS UUID 
LANGUAGE SQL 
STABLE SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- 2. Recrear políticas de profiles con función optimizada
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.user_id() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.user_id() = id);

-- 3. Optimizar políticas de packages
DROP POLICY IF EXISTS "Users can create their own packages" ON public.packages;
DROP POLICY IF EXISTS "Users can update their own packages or admins can update any" ON public.packages;
DROP POLICY IF EXISTS "Users can view packages they created or that are matched to the" ON public.packages;

CREATE POLICY "Users can create their own packages" 
ON public.packages 
FOR INSERT 
WITH CHECK (auth.user_id() = user_id);

CREATE POLICY "Users can update their own packages or admins can update any" 
ON public.packages 
FOR UPDATE 
USING ((auth.user_id() = user_id) OR has_role(auth.user_id(), 'admin'::user_role));

CREATE POLICY "Users can view packages they created or that are matched to their trips" 
ON public.packages 
FOR SELECT 
USING (
  (auth.user_id() = user_id) OR 
  (matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.user_id())) OR 
  has_role(auth.user_id(), 'admin'::user_role)
);

-- 4. Optimizar políticas de trips
DROP POLICY IF EXISTS "Users can create their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update their own trips or admins can update any" ON public.trips;
DROP POLICY IF EXISTS "Users can view all approved trips and their own trips or admins" ON public.trips;

CREATE POLICY "Users can create their own trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (auth.user_id() = user_id);

CREATE POLICY "Users can update their own trips or admins can update any" 
ON public.trips 
FOR UPDATE 
USING ((auth.user_id() = user_id) OR has_role(auth.user_id(), 'admin'::user_role));

CREATE POLICY "Users can view all approved trips and their own trips or admins" 
ON public.trips 
FOR SELECT 
USING (
  (status <> 'pending_approval'::text) OR 
  (auth.user_id() = user_id) OR 
  has_role(auth.user_id(), 'admin'::user_role)
);

-- 5. Optimizar políticas de package_messages
DROP POLICY IF EXISTS "Users can insert messages for packages they're involved in" ON public.package_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.package_messages;
DROP POLICY IF EXISTS "Users can view messages for packages they're involved in or adm" ON public.package_messages;

CREATE POLICY "Users can insert messages for packages they're involved in" 
ON public.package_messages 
FOR INSERT 
WITH CHECK (
  (auth.user_id() = user_id) AND (
    (package_id IN (
      SELECT id FROM packages 
      WHERE (user_id = auth.user_id()) OR 
            (matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.user_id()))
    )) OR 
    has_role(auth.user_id(), 'admin'::user_role)
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.package_messages 
FOR UPDATE 
USING ((auth.user_id() = user_id) OR has_role(auth.user_id(), 'admin'::user_role))
WITH CHECK ((auth.user_id() = user_id) OR has_role(auth.user_id(), 'admin'::user_role));

CREATE POLICY "Users can view messages for packages they're involved in or admins" 
ON public.package_messages 
FOR SELECT 
USING (
  (package_id IN (
    SELECT id FROM packages 
    WHERE (user_id = auth.user_id()) OR 
          (matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.user_id()))
  )) OR 
  has_role(auth.user_id(), 'admin'::user_role)
);

-- 6. Optimizar políticas de notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.user_id() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.user_id() = user_id);

-- 7. Optimizar políticas de trip_payment_accumulator
DROP POLICY IF EXISTS "Travelers can view their own trip payment accumulator" ON public.trip_payment_accumulator;
DROP POLICY IF EXISTS "Travelers can update their own trip payment accumulator" ON public.trip_payment_accumulator;

CREATE POLICY "Travelers can view their own trip payment accumulator" 
ON public.trip_payment_accumulator 
FOR SELECT 
USING (auth.user_id() = traveler_id);

CREATE POLICY "Travelers can update their own trip payment accumulator" 
ON public.trip_payment_accumulator 
FOR UPDATE 
USING (auth.user_id() = traveler_id);

-- 8. Optimizar políticas de payment_orders
DROP POLICY IF EXISTS "Travelers can view their own payment orders" ON public.payment_orders;

CREATE POLICY "Travelers can view their own payment orders" 
ON public.payment_orders 
FOR SELECT 
USING (
  (auth.user_id() = traveler_id) OR 
  (trip_id IN (SELECT id FROM trips WHERE user_id = auth.user_id()))
);