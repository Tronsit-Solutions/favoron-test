

## Dead Code encontrado

### 1. `getStatusIcon` y `getStatusColor` locales en `PendingRequestsTab.tsx` (líneas 32-57)
Ambas funciones están definidas pero **nunca se llaman** dentro del componente. El componente usa `getStatusBadge` del hook `useStatusHelpers` en su lugar.

**Acción:** Eliminar las dos funciones (líneas 32-57).

### 2. `useGuatemalaDeliveryBackfill.tsx` — hook de backfill one-time
No se importa en ningún otro archivo. Fue un hook de corrección de datos que ya cumplió su propósito.

**Acción:** Eliminar `src/hooks/useGuatemalaDeliveryBackfill.tsx`.

### 3. `useGuatemalaCityDeliveryBackfill.tsx` — hook de backfill one-time
Igual que el anterior, no se importa en ningún lado.

**Acción:** Eliminar `src/hooks/useGuatemalaCityDeliveryBackfill.tsx`.

### Resumen de cambios
| Archivo | Acción |
|---|---|
| `PendingRequestsTab.tsx` | Eliminar `getStatusIcon` y `getStatusColor` (líneas 32-57) |
| `useGuatemalaDeliveryBackfill.tsx` | Eliminar archivo completo |
| `useGuatemalaCityDeliveryBackfill.tsx` | Eliminar archivo completo |

Tres eliminaciones simples, sin riesgo de romper nada ya que ninguno de estos se referencia en el código activo.

