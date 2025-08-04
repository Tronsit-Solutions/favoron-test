-- Verificar si el trigger existe y recrearlo si es necesario
-- Primero eliminar el trigger existente
DROP TRIGGER IF EXISTS trigger_notify_traveler_package_status ON public.packages;

-- Recrear el trigger
CREATE TRIGGER trigger_notify_traveler_package_status
  AFTER UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_traveler_package_status();

-- Verificar que el trigger esté activo
SELECT t.tgname as trigger_name, t.tgenabled as enabled, c.relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'packages' AND t.tgname = 'trigger_notify_traveler_package_status';