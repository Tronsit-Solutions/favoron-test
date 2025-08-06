-- Actualizar la política RLS para permitir que viajeros asignados actualicen paquetes
-- para poder enviar cotizaciones

DROP POLICY IF EXISTS "Users can update packages optimized" ON public.packages;

CREATE POLICY "Users can update packages optimized" 
ON public.packages 
FOR UPDATE 
USING (
  -- El dueño del paquete puede actualizarlo
  (user_id = auth.uid()) 
  OR 
  -- El viajero asignado puede actualizarlo (para cotizaciones)
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
);