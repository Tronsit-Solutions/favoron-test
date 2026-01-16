-- Actualizar política RLS para permitir dismiss de paquetes expirados por viajeros
DROP POLICY IF EXISTS "Users can update packages optimized" ON public.packages;

CREATE POLICY "Users can update packages optimized" 
ON public.packages 
FOR UPDATE 
USING (
  -- El dueño del paquete puede actualizarlo
  (user_id = auth.uid()) 
  OR 
  -- El viajero asignado puede actualizarlo (verificando el valor ACTUAL)
  (matched_trip_id IN (
    SELECT trips.id 
    FROM trips 
    WHERE trips.user_id = auth.uid()
  ))
  OR 
  -- Los admins pueden actualizar cualquier paquete
  (EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
  ))
)
WITH CHECK (
  -- El dueño del paquete puede actualizarlo
  (user_id = auth.uid()) 
  OR 
  -- Permitir si el viajero está dismisseando (el nuevo matched_trip_id es null pero tiene dismissed_at)
  (traveler_dismissed_at IS NOT NULL)
  OR
  -- El viajero asignado puede mantener el match
  (matched_trip_id IN (
    SELECT trips.id 
    FROM trips 
    WHERE trips.user_id = auth.uid()
  ))
  OR 
  -- Los admins pueden hacer cualquier cosa
  (EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::user_role
  ))
);