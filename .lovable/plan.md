

## Diagnóstico: El botón "Confirmando..." tarda mucho

### Causa raíz

Cuando el RPC `assign_package_to_travelers` actualiza `packages.status = 'matched'`, se disparan varios triggers de Postgres. El trigger `notify_traveler_package_status` llama a `create_notification`, que a su vez hace una **llamada HTTP síncrona y bloqueante** (`extensions.http()`) al edge function `send-notification-email`.

```text
handleMatch (click) 
  → RPC assign_package_to_travelers
    → UPDATE packages SET status = 'matched'
      → TRIGGER notify_traveler_package_status
        → create_notification()
          → extensions.http() → edge function (BLOQUEANTE, 2-5s)
      → TRIGGER notify_shopper_package_status (posiblemente otro HTTP)
    → COMMIT (espera a que terminen todos los triggers)
  → respuesta al cliente
```

Cada llamada HTTP síncrona dentro de la transacción bloquea todo hasta que el edge function responde. Si hay 2+ notificaciones, se multiplica.

### Solución: Cambiar de `extensions.http()` a `net.http_post()` (asíncrono)

`pg_net` (`net.http_post`) envía la petición HTTP de forma **asíncrona** — no bloquea la transacción. Ya tienen la extensión `pg_net` habilitada.

### Cambio

**1. Migración SQL**: Actualizar `create_notification` para usar `net.http_post` en vez de `extensions.http`

Reemplazar el bloque de llamada HTTP (líneas 70-81 del function body) de:

```sql
SELECT INTO http_result * FROM extensions.http((
  'POST',
  'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-notification-email',
  ARRAY[...],
  'application/json',
  payload::text
));
```

A:

```sql
PERFORM net.http_post(
  url := 'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-notification-email',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
  ),
  body := payload::jsonb
);
```

Esto elimina toda la lógica de verificación del `http_result.status` (ya no hay resultado síncrono), y elimina la variable `http_result`. La notificación de email se envía en background sin bloquear.

### Archivos a modificar
- **1 migración SQL** (nueva): actualizar función `create_notification`

### Impacto
- El botón "Confirmando..." debería resolver en <500ms en vez de 2-5s
- Los emails de notificación seguirán enviándose, pero de forma asíncrona
- Si el email falla, no hay rollback (mismo comportamiento actual con el `EXCEPTION WHEN OTHERS`)

