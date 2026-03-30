

## Cambiar mensaje de notificación al viajero

### Problema
Cuando el admin confirma la recepción de un paquete en oficina, el viajero recibe la notificación con el mensaje "Tu pago está siendo procesado", lo cual es incorrecto. Debería indicarle que ya puede crear su orden de cobro.

### Cambio
Una migración SQL que actualiza la función `notify_traveler_package_status`, cambiando únicamente el mensaje del bloque #5 (confirmación en oficina):

**Antes:**
> "¡Perfecto! Favorón ha confirmado la recepción del paquete "X" en nuestras oficinas. Tu pago está siendo procesado."

**Después:**
> "¡Perfecto! Favorón ha confirmado la recepción del paquete "X" en nuestras oficinas. Ya puedes crear tu orden de cobro."

### Archivo
| Archivo | Acción |
|---|---|
| `supabase/migrations/new_migration.sql` | `CREATE OR REPLACE FUNCTION` con mensaje corregido |

Solo se modifica una línea dentro de la función existente.

