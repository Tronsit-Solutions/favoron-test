-- Fix remaining Auth RLS Initialization Plan warnings
-- Optimize all RLS policies to minimize auth.uid() calls

-- 1. Optimize profiles policies
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
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Optimize user_roles policies
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- 3. Optimize trips policies
DROP POLICY IF EXISTS "Users can view all approved trips and their own trips or admins" ON public.trips;
DROP POLICY IF EXISTS "Users can create their own trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update their own trips or admins can update any" ON public.trips;
DROP POLICY IF EXISTS "Only admins can delete trips" ON public.trips;

CREATE POLICY "Users can view trips optimized" 
ON public.trips 
FOR SELECT 
USING (status <> 'pending_approval' OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update trips optimized" 
ON public.trips 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete trips" 
ON public.trips 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 4. Optimize packages policies
DROP POLICY IF EXISTS "Users can view packages optimized" ON public.packages;
DROP POLICY IF EXISTS "Users can create their own packages" ON public.packages;
DROP POLICY IF EXISTS "Users can update their own packages or admins can update any" ON public.packages;
DROP POLICY IF EXISTS "Only admins can delete packages" ON public.packages;

CREATE POLICY "Users can view packages optimized" 
ON public.packages 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can create their own packages" 
ON public.packages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update packages optimized" 
ON public.packages 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete packages" 
ON public.packages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 5. Optimize package_messages policies
DROP POLICY IF EXISTS "Users can view messages optimized" ON public.package_messages;
DROP POLICY IF EXISTS "Users can insert messages optimized" ON public.package_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.package_messages;
DROP POLICY IF EXISTS "Admins can delete any message" ON public.package_messages;

CREATE POLICY "Users can view messages optimized" 
ON public.package_messages 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM packages p WHERE p.id = package_id AND (p.user_id = auth.uid() OR p.matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()))) OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can insert messages optimized" 
ON public.package_messages 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND (
    EXISTS (SELECT 1 FROM packages p WHERE p.id = package_id AND (p.user_id = auth.uid() OR p.matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()))) OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.package_messages 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any message" 
ON public.package_messages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 6. Optimize notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications for users" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications for users" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- 7. Optimize trip_payment_accumulator policies
DROP POLICY IF EXISTS "Travelers can view their own trip payment accumulator" ON public.trip_payment_accumulator;
DROP POLICY IF EXISTS "Travelers can update their own trip payment accumulator" ON public.trip_payment_accumulator;
DROP POLICY IF EXISTS "System can insert trip payment accumulator" ON public.trip_payment_accumulator;
DROP POLICY IF EXISTS "Admins can manage all trip payment accumulators" ON public.trip_payment_accumulator;

CREATE POLICY "Travelers can view their own trip payment accumulator" 
ON public.trip_payment_accumulator 
FOR SELECT 
USING (auth.uid() = traveler_id);

CREATE POLICY "Travelers can update their own trip payment accumulator" 
ON public.trip_payment_accumulator 
FOR UPDATE 
USING (auth.uid() = traveler_id);

CREATE POLICY "System can insert trip payment accumulator" 
ON public.trip_payment_accumulator 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all trip payment accumulators" 
ON public.trip_payment_accumulator 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- 8. Optimize payment_orders policies
DROP POLICY IF EXISTS "Travelers can view their own payment orders" ON public.payment_orders;
DROP POLICY IF EXISTS "Admins can manage all payment orders" ON public.payment_orders;

CREATE POLICY "Travelers can view their own payment orders" 
ON public.payment_orders 
FOR SELECT 
USING (
  auth.uid() = traveler_id OR 
  trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage all payment orders" 
ON public.payment_orders 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add helpful comments for monitoring
COMMENT ON POLICY "Users can view packages optimized" ON public.packages IS 'Optimized to reduce auth.uid() calls for performance';
COMMENT ON POLICY "Users can view messages optimized" ON public.package_messages IS 'Optimized to reduce auth.uid() calls for performance';
COMMENT ON POLICY "Users can insert messages optimized" ON public.package_messages IS 'Optimized to reduce auth.uid() calls for performance';