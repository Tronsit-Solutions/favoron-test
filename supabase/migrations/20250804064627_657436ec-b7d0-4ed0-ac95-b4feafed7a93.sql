-- Verificar si los triggers existen y están habilitados
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('packages', 'trips')
AND t.tgname LIKE '%notify%'
ORDER BY c.relname, t.tgname;