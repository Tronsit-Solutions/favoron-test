

## Plan: Cambiar frecuencia del cron de expiración de viajes a 1 vez al día

La expiración de viajes se basa en fechas (no horas), así que ejecutarlo una vez al día al inicio es suficiente.

### Cambio

Ejecutar un SQL para actualizar el cron job existente de `expire-quotes` de cada hora (`0 * * * *`) a una vez al día a medianoche (`0 0 * * *`):

```sql
SELECT cron.schedule(
  'invoke-expire-quotes',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/expire-quotes',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaG9kdWlybXFiYXJqbnNwYmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNTE4NjYsImV4cCI6MjA2NzYyNzg2Nn0.w1PWz_sugNUIlOfVb1dqKFulcDVPiKb_0SdkhUho8wY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

**Nota importante**: Este cambio también afecta la frecuencia de expiración de cotizaciones y deadlines que corren en la misma función. Si esas necesitan seguir ejecutándose cada hora, habría que separarlas. ¿Te parece bien que todo corra una vez al día, o solo los viajes deberían ser diarios?

