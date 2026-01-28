
# Plan: Corregir Visibilidad de Paquetes Reasignados

## Problema Identificado

Cuando un paquete es reasignado al mismo viaje despues de haber sido descartado por el viajero, el campo `traveler_dismissed_at` permanece con valor, causando que el paquete quede oculto en el dashboard del viajero.

**Caso actual de Leslie Lopez:**
- "Bagsmart small marron grisaceo" - descartado el 27 enero, reasignado con timer hasta 29 enero
- "Kit fellow 16 oz" - descartado el 26 enero, reasignado con timer hasta 29 enero

Ambos estan en status `matched` con timer activo pero Leslie no los ve porque `traveler_dismissed_at` no fue limpiado.

## Solucion en Dos Partes

### Parte 1: Correccion Inmediata (SQL Manual)

Ejecutar en Supabase SQL Editor para restaurar visibilidad de los paquetes de Leslie:

```sql
UPDATE packages 
SET traveler_dismissed_at = NULL
WHERE id IN (
  '5b9e06d6-2150-403d-a288-3ccfaef729ae',  -- Bagsmart small
  'cc8089c0-cbed-406e-893e-01b56746c615'   -- Kit fellow 16 oz
);
```

### Parte 2: Prevencion Futura (Codigo)

Modificar la logica de asignacion/reasignacion de paquetes para limpiar `traveler_dismissed_at` automaticamente.

#### Archivo: src/components/admin/matching/MatchCard.tsx o funcion de asignacion

Cuando admin asigna un paquete a un viaje, agregar:

```typescript
traveler_dismissed_at: null
```

al objeto de actualizacion del paquete.

#### Archivo: src/hooks/usePackageActions.tsx (si existe logica de asignacion)

Buscar donde se hace `UPDATE packages SET matched_trip_id = ...` y asegurar que incluya:

```typescript
traveler_dismissed_at: null
```

## Archivos a Revisar/Modificar

| Archivo | Cambio |
|---------|--------|
| Admin matching components | Agregar limpieza de `traveler_dismissed_at` al asignar |
| Edge functions de asignacion | Verificar que limpien el campo al reasignar |
| RPCs de Supabase | Si hay funciones de asignacion, actualizar para limpiar el campo |

## Resultado Esperado

1. **Inmediato**: Leslie vera los 2 paquetes despues de ejecutar el SQL
2. **Futuro**: Cualquier paquete reasignado sera visible automaticamente sin intervencion manual
