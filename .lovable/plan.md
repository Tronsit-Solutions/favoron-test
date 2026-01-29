
# Plan: Limpiar traveler_dismissal de paquetes en estado matched

## Problema

Los paquetes en estado `matched` tienen flags de `traveler_dismissal` heredados de viajeros anteriores. Esto causa que el viajero actual no pueda ver los paquetes asignados en su dashboard.

## Datos afectados

Según la consulta anterior, hay **6 paquetes** asignados a Rodolfo Jiménez (y posiblemente más de otros viajeros) que tienen:
- `status = 'matched'`
- `traveler_dismissal IS NOT NULL` (contiene datos de viajeros anteriores)

## Solución

Ejecutar una migración SQL que limpie estos campos para **todos** los paquetes en estado `matched`:

```sql
-- Clean traveler_dismissal flags from all matched packages
-- These flags contain data from previous travelers and should not affect current assignments
UPDATE packages
SET 
  traveler_dismissal = NULL,
  traveler_dismissed_at = NULL,
  updated_at = NOW()
WHERE status = 'matched'
  AND traveler_dismissal IS NOT NULL;
```

## Resultado esperado

| Campo | Antes | Después |
|-------|-------|---------|
| `traveler_dismissal` | Datos de viajeros anteriores | `NULL` |
| `traveler_dismissed_at` | Timestamp antiguo | `NULL` |
| Visibilidad para viajero actual | Oculto | Visible |

## Impacto

- **Inmediato**: Los paquetes matched serán visibles para sus viajeros asignados
- **Sin efectos secundarios**: Solo afecta paquetes ya asignados a un viajero
- **Historial preservado**: La información del rechazo anterior permanece en `traveler_rejection` si existe
