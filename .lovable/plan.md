

## Por qué tarda: No es la BD, es la sincronización del UI

### Hallazgo clave

El RPC `assign_package_to_travelers` es rápido (~200-500ms). Solo hace:
1. Filtrar trips duplicados
2. Insertar 1-3 filas en `package_assignments`
3. UPDATE de 1 fila en `packages`

Hay **22 triggers** en la tabla `packages`, pero la mayoría salen inmediatamente porque no aplican al status `matched` (no hay `matched_trip_id`, no es payment, no es rejection, etc.). Las llamadas HTTP (email/WhatsApp vía `pg_net`) son async y no bloquean.

### El problema real

No es que las filas tarden en crearse. Es que **el UI nunca se entera de que ya se crearon**:

```text
t=0ms     UI optimista: status='matched', cierra modal
t=50ms    fetchAssignments() → tabla vacía (RPC aún no termina)
t=500ms   RPC termina → filas existen en BD
          → NADIE le dice al UI → viajeros no aparecen
t=???     Admin cambia de tab o hace scroll → re-fetch → aparecen
```

### Solución: Re-fetch post-RPC

En lugar de Realtime (complejo), simplemente hacer un re-fetch de las asignaciones del paquete DESPUÉS de que el RPC confirme éxito. El hook `useDashboardActions` ya sabe cuándo termina el RPC.

### Cambios

**1. `src/hooks/useDashboardActions.tsx`**
- Después de que el RPC retorna éxito (línea ~1376), emitir un evento custom o llamar a un callback que dispare `fetchAssignments()` para el `packageId` específico
- Agregar prop/callback `onAssignmentCreated?: (packageId: string) => void` al hook

**2. `src/components/admin/AdminMatchingTab.tsx`**
- Exponer una función `refreshAssignmentsForPackage(packageId)` que haga fetch parcial solo de ese paquete
- Pasar esa función como callback al flujo de matching

**3. Alternativa más simple (sin cambiar la interfaz entre componentes)**
- En `AdminMatchingTab`, después de detectar que un paquete cambió a status `matched` (via el array `packages` que viene como prop), programar un `setTimeout` de 1 segundo para re-fetch las asignaciones de ese paquete específico
- Usar un ref para trackear qué paquetes ya se re-fetchearon y no repetir

### Archivo principal a modificar
- `src/components/admin/AdminMatchingTab.tsx` — agregar re-fetch automático post-match

