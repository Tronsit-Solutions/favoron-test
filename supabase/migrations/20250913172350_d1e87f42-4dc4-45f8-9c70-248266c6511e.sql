-- Corregir la constraint de tipos de notificación para incluir 'prime'

-- Eliminar la constraint existente si existe
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Crear la nueva constraint que incluye 'prime'
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('general', 'package', 'trip', 'payment', 'quote', 'delivery', 'approval', 'prime', 'system'));

-- Verificar que la constraint se creó correctamente
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.notifications'::regclass 
  AND contype = 'c' 
  AND conname = 'notifications_type_check';