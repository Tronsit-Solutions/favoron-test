

# Plan: Desactivar Notificaciones por Email Temporalmente

## Problema Identificado

La función `expire_old_quotes` está procesando paquetes expirados y disparando la función `create_notification` de la base de datos, que a su vez llama al edge function `send-notification-email` para cada paquete. Esto está enviando muchos emails de:
- "Cotización expirada" (a compradores)
- "Asignación expirada" (a viajeros)

### Flujo actual:
```
expire_old_quotes (RPC) 
  → create_notification (RPC con HTTP call interno)
    → send-notification-email (Edge Function)
      → Resend API
```

## Opciones para Desactivar

### Opción 1: Desactivar la API Key de Resend (Más Rápido)
- **Acción**: Eliminar o renombrar el secret `RESEND_API_KEY`
- **Efecto**: Todos los emails fallarán silenciosamente
- **Pros**: Inmediato, no requiere código
- **Contras**: Afecta TODOS los emails (incluyendo los legítimos)

### Opción 2: Modificar la función `create_notification` (Recomendado)
- **Acción**: Agregar un flag para deshabilitar el envío de emails
- **Efecto**: Las notificaciones se crean pero no se envían emails
- **Pros**: Control granular, reversible
- **Contras**: Requiere migración SQL

### Opción 3: Modificar el Edge Function `send-notification-email`
- **Acción**: Agregar un "kill switch" al inicio de la función
- **Efecto**: El edge function retorna inmediatamente sin enviar emails
- **Pros**: Fácil de activar/desactivar
- **Contras**: Afecta todos los emails vía este edge function

## Solución Recomendada: Opción 2 + 3

### Paso 1: Agregar Kill Switch al Edge Function

Modificar `supabase/functions/send-notification-email/index.ts` para agregar un flag de desactivación:

```typescript
// At the top of the handler, add:
const EMAIL_NOTIFICATIONS_ENABLED = Deno.env.get("EMAIL_NOTIFICATIONS_ENABLED") !== "false";

if (!EMAIL_NOTIFICATIONS_ENABLED) {
  console.log('⏸️ Email notifications are disabled via EMAIL_NOTIFICATIONS_ENABLED=false');
  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Email notifications disabled',
    skipped: true 
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
```

### Paso 2: Agregar Secret para Control

Agregar un nuevo secret `EMAIL_NOTIFICATIONS_ENABLED` con valor `"false"` para desactivar.

### Paso 3: Para Reactivar

Cambiar el valor del secret a `"true"` o eliminarlo (por defecto está activo).

## Alternativa Inmediata (Sin Código)

Si necesitas desactivar los emails **AHORA MISMO**:

1. Ve a Supabase Dashboard → Edge Functions → Settings
2. Encuentra el secret `RESEND_API_KEY`
3. Renómbralo temporalmente a `RESEND_API_KEY_DISABLED`

Esto hará que el edge function falle al intentar enviar emails, pero las notificaciones in-app seguirán funcionando.

## Secciones Técnicas

### Función `create_notification` Actual

La función hace una llamada HTTP directa al edge function:
```sql
SELECT INTO http_result * FROM extensions.http((
  'POST',
  'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-notification-email',
  ...
));
```

### Función `expire_old_quotes` 

Esta función se ejecuta (probablemente via cron) y:
1. Busca paquetes con `status = 'quote_sent' OR status = 'payment_pending'` que tengan `quote_expires_at < NOW()`
2. Los marca como `quote_expired`
3. Llama a `create_notification` para el comprador Y para el viajero

Hay **14 paquetes en `payment_pending`** con cotizaciones expiradas desde diciembre 2025, lo que explica la ola de emails.

