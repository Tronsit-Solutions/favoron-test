
-- Habilitar extensiones necesarias (si no lo están)
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Limpieza inmediata
select public.expire_old_quotes();
select public.expire_unresponded_assignments();

-- Índices para acelerar consultas por expiración
create index if not exists idx_packages_status_quote_expires_at 
  on public.packages (status, quote_expires_at);

create index if not exists idx_packages_status_matched_assignment_expires_at 
  on public.packages (status, matched_assignment_expires_at);

-- Reemplazar programaciones previas si existieran
select cron.unschedule('favoron-expire-quotes-hourly');
select cron.unschedule('favoron-assignment-warnings-hourly');
select cron.unschedule('favoron-expire-assignments-30m');

-- Programar: expirar cotizaciones + avisos (edge function) cada hora
select
cron.schedule(
  'favoron-expire-quotes-hourly',
  '0 * * * *',  -- cada hora
  $$
  select
    net.http_post(
      url:='https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/expire-quotes',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaG9kdWlybXFiYXJqbnNwYmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTE4NjYsImV4cCI6MjA2NzYyNzg2Nn0.w1PWz_sugNUIlOfVb1dqKFulcDVPiKb_0SdkhUho8wY"}'::jsonb,
      body:='{}'::jsonb
    );
  $$
);

-- Programar: avisos de asignación por expirar cada hora
select
cron.schedule(
  'favoron-assignment-warnings-hourly',
  '15 * * * *',
  $$ select public.send_assignment_warnings(); $$
);

-- Programar: expirar asignaciones sin respuesta cada 30 minutos
select
cron.schedule(
  'favoron-expire-assignments-30m',
  '*/30 * * * *',
  $$ select public.expire_unresponded_assignments(); $$
);
