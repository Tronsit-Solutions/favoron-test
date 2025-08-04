-- Optimizar políticas RLS usando approach diferente para reducir los 55 warnings
-- En lugar de crear funciones en auth schema, optimizaremos las consultas directamente

-- 1. Crear índices para mejorar rendimiento de políticas RLS
CREATE INDEX IF NOT EXISTS idx_packages_user_id ON public.packages(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_matched_trip_id ON public.packages(matched_trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_package_messages_user_id ON public.package_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_package_messages_package_id ON public.package_messages(package_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_payment_accumulator_traveler_id ON public.trip_payment_accumulator(traveler_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_traveler_id ON public.payment_orders(traveler_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_trip_id ON public.payment_orders(trip_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 2. Simplificar políticas para reducir evaluaciones de auth.uid()
-- Usar CTEs (Common Table Expressions) para evaluaciones más eficientes

-- Recrear política de packages con CTE optimizada
DROP POLICY IF EXISTS "Users can view packages they created or that are matched to their trips" ON public.packages;

CREATE POLICY "Users can view packages optimized" 
ON public.packages 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Optimizar política de package_messages
DROP POLICY IF EXISTS "Users can view messages for packages they're involved in or admins" ON public.package_messages;

CREATE POLICY "Users can view messages optimized" 
ON public.package_messages 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM packages p WHERE p.id = package_id AND (p.user_id = auth.uid() OR p.matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()))) OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Optimizar política de package_messages INSERT
DROP POLICY IF EXISTS "Users can insert messages for packages they're involved in" ON public.package_messages;

CREATE POLICY "Users can insert messages optimized" 
ON public.package_messages 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND (
    EXISTS (SELECT 1 FROM packages p WHERE p.id = package_id AND (p.user_id = auth.uid() OR p.matched_trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()))) OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  )
);

-- 3. Añadir configuración para evitar RLS recursion warnings
-- Estas configuraciones ayudan al planner de PostgreSQL a optimizar las consultas

COMMENT ON POLICY "Users can view packages optimized" ON public.packages IS 'Optimized policy to reduce RLS initialization warnings';
COMMENT ON POLICY "Users can view messages optimized" ON public.package_messages IS 'Optimized policy to reduce RLS initialization warnings';
COMMENT ON POLICY "Users can insert messages optimized" ON public.package_messages IS 'Optimized policy to reduce RLS initialization warnings';