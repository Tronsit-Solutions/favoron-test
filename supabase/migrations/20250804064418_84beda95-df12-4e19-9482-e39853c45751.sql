-- Verificar si el trigger existe y está activo
SELECT t.tgname, t.tgenabled, p.proname 
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname LIKE '%notify_traveler%';

-- Verificar si la función existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'notify_traveler_package_status';

-- Test manual de la función con un paquete de ejemplo
-- Primero verificar la estructura de los datos
SELECT id, user_id, matched_trip_id, status, item_description 
FROM packages 
WHERE matched_trip_id IS NOT NULL 
LIMIT 3;