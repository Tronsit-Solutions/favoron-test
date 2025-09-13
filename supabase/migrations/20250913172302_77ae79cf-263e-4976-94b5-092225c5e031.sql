-- Verificar y corregir la constraint de tipos de notificación
-- Agregar 'prime' a los tipos permitidos en notifications

-- Primero verificar la constraint actual
SELECT con.conname, con.consrc
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname = 'notifications'
  AND con.contype = 'c'
  AND con.conname LIKE '%type%';

-- Actualizar la constraint para incluir 'prime'
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('general', 'package', 'trip', 'payment', 'quote', 'delivery', 'approval', 'prime', 'system'));

-- Verificar la nueva constraint
SELECT con.conname, con.consrc
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname = 'notifications'
  AND con.contype = 'c'
  AND con.conname = 'notifications_type_check';