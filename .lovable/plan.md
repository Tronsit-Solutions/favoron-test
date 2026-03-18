

## Problema

El botón "Ver Cotizaciones" ya existe en el código (`CollapsiblePackageCard.tsx` líneas 673 y 1010), pero no aparece porque `shopperAssignmentsMap` está vacío. La función `fetchShopperAssignments` (Dashboard.tsx línea 330) solo se ejecuta cuando cambia `packages` o `userPackages.length`, pero no hay suscripción realtime a la tabla `package_assignments`. Cuando un viajero envía su cotización (cambia `package_assignments.status` a `bid_submitted`), nada dispara la re-consulta del lado del shopper.

Además, hay dos estados del botón:
- `isCompeting && hasMultiQuotes` → Botón verde "Ver Cotizaciones" (cuando hay al menos un `bid_submitted`)
- `isCompeting && !hasMultiQuotes` → Botón deshabilitado "Esperando cotizaciones..." (cuando todos están en `bid_pending`)

Ambos dependen de que `multiAssignments` tenga datos, lo cual requiere que `fetchShopperAssignments` haya corrido exitosamente.

## Solución

**Archivo: `src/components/Dashboard.tsx`**

1. **Extraer `fetchShopperAssignments` fuera del `useEffect`** para poder reutilizarla desde múltiples lugares (usando `useCallback`).

2. **Agregar suscripción realtime a `package_assignments`** en un segundo `useEffect`:
   - Escuchar eventos `INSERT` y `UPDATE` en `package_assignments`
   - Cuando el `package_id` del evento pertenece a un paquete del shopper (`multiMatchedPkgIds`), re-ejecutar `fetchShopperAssignments`
   - Limpiar el canal en el cleanup del effect

```text
Flujo actual (roto):
  Traveler envía quote → package_assignments UPDATE → (nada) → shopper no ve botón

Flujo corregido:
  Traveler envía quote → package_assignments UPDATE → realtime event → fetchShopperAssignments() → shopperAssignmentsMap se actualiza → botón aparece
```

### Cambios específicos

**Dashboard.tsx:**
- Mover la función `fetchShopperAssignments` a un `useCallback` a nivel del componente
- Mantener el `useEffect` existente (línea 329) que llama a la función en mount y cuando cambian dependencias
- Agregar un nuevo `useEffect` con suscripción realtime a `package_assignments` que llame a la misma función cuando haya cambios relevantes
- Cleanup del canal en el return del effect

No se requieren cambios en la base de datos, RLS, ni en `CollapsiblePackageCard.tsx` — los botones y el modal ya están correctamente implementados.

