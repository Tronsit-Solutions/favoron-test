-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule existing jobs if they exist to avoid duplicates (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invoke-expire-quotes-hourly') THEN
    PERFORM cron.unschedule('invoke-expire-quotes-hourly');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-unresponded-assignments-hourly') THEN
    PERFORM cron.unschedule('expire-unresponded-assignments-hourly');
  END IF;
END $$;

-- Schedule hourly invocation of the expire-quotes edge function (handles expiring quotes + warnings)
SELECT
  cron.schedule(
    'invoke-expire-quotes-hourly',
    '0 * * * *', -- hourly
    $$
    SELECT
      net.http_post(
        url := 'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/expire-quotes',
        headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaG9kdWlybXFiYXJqbnNwYmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTE4NjYsImV4cCI6MjA2NzYyNzg2Nn0.w1PWz_sugNUIlOfVb1dqKFulcDVPiKb_0SdkhUho8wY"}'::jsonb,
        body := '{}'::jsonb
      ) AS request_id;
    $$
  );

-- Schedule hourly DB-side cleanup for expired unresponded assignments
SELECT
  cron.schedule(
    'expire-unresponded-assignments-hourly',
    '0 * * * *', -- hourly
    $$
    SELECT public.expire_unresponded_assignments();
    $$
  );