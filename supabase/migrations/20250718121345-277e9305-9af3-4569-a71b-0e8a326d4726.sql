-- Eliminar sistema de pagos por paquete individual
-- 1. Eliminar órdenes de pago por paquete individual (mantener solo por trip_id)
DELETE FROM public.payment_orders WHERE package_id IS NOT NULL;

-- 2. Remover la columna package_id de payment_orders ya que solo usaremos trip_id
ALTER TABLE public.payment_orders DROP COLUMN IF EXISTS package_id;

-- 3. Hacer trip_id obligatorio
ALTER TABLE public.payment_orders ALTER COLUMN trip_id SET NOT NULL;

-- 4. Eliminar constraint que permitía package_id o trip_id
ALTER TABLE public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_package_or_trip_check;

-- 5. Remover estados de pago por paquete de la aplicación
-- Actualizar todos los paquetes que tengan estados de pago individual a 'approved'
UPDATE public.packages 
SET status = 'approved', updated_at = now()
WHERE status IN ('payment_pending', 'payment_confirmed');

-- 6. Limpiar campos de payment_receipt de los paquetes ya que no los usamos más
UPDATE public.packages 
SET payment_receipt = NULL, updated_at = now()
WHERE payment_receipt IS NOT NULL;