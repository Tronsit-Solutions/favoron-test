
## Eliminar avisos preventivos de asignación

### Contexto actual
La función `send_assignment_warnings()` envía 3 notificaciones preventivas a los viajeros antes de que expire su asignación:

| Tiempo restante | Título | Prioridad |
|----------------|--------|-----------|
| 12 horas | "⏰ Recordatorio: 12 horas restantes" | normal |
| 4 horas | "⚠️ Solo quedan 4 horas" | high |
| 1 hora | "🚨 ¡Última hora para responder!" | urgent |

### Cambio propuesto
Vaciar el cuerpo de la función `send_assignment_warnings()` para que no haga nada, pero manteniendo la función para evitar errores si el cron job la sigue llamando.

### Detalle técnico
Crear una migración SQL que redefina la función con cuerpo vacío:

```sql
CREATE OR REPLACE FUNCTION public.send_assignment_warnings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Función deshabilitada: los avisos preventivos fueron eliminados
  -- para reducir el ruido de notificaciones a viajeros
  NULL;
END;
$function$;
```

### Alternativa
Opcionalmente, también podríamos eliminar el cron job `favoron-assignment-warnings-hourly` que ejecuta esta función cada hora, para ahorrar recursos:

```sql
SELECT cron.unschedule('favoron-assignment-warnings-hourly');
SELECT cron.unschedule('send-assignment-warnings');
```

### Resultado esperado
- Los viajeros ya no recibirán avisos preventivos a las 12h, 4h, y 1h antes de expirar la asignación
- La notificación de **expiración** (cuando ya expiró) seguirá funcionando normalmente a través de `expire_unresponded_assignments()`
- Menos notificaciones = menos ruido para los usuarios
