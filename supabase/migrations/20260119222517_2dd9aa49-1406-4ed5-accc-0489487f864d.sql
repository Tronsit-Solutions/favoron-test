-- Eliminar el cron job actual (hourly)
SELECT cron.unschedule('expire-unresponded-assignments-hourly');

-- Crear nuevo cron job que corre cada 15 minutos
SELECT cron.schedule(
  'expire-unresponded-assignments',
  '*/15 * * * *',
  $$SELECT public.expire_unresponded_assignments();$$
);