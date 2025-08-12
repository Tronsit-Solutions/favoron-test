
-- Extensiones necesarias para tareas programadas
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Índice para acelerar el barrido por fecha de llegada
create index if not exists idx_trips_arrival_date on public.trips (arrival_date);

-- Programar tarea cada hora a los 15 minutos
select
  cron.schedule(
    'complete-past-trips-hourly',
    '15 * * * *', -- cada hora al minuto 15
    $$
    select public.complete_past_trips_without_packages();
    $$
  );

-- Ejecutar una vez ahora para normalizar estados existentes
select public.complete_past_trips_without_packages();
