

## Problema: El optimistic update del match se pierde

### Causa raíz

Cuando se confirma un match, el flujo es:

1. `setLocalPackages` actualiza el paquete a `status: 'matched'` (optimistic)
2. El modal se cierra (`showMatchDialog = false`)
3. El RPC se ejecuta en background (~2-12s)

Pero durante ese tiempo:
- **El sync effect (línea 130-139)** detecta que `showMatchDialog` es `false` y no hay modales abiertos, así que sobrescribe `localPackages` con la prop `packages` — que todavía tiene `status: 'approved'` porque el parent no ha refetcheado.
- **El realtime handler** tampoco tiene protección `recentMutationsRef` (no se le pasa), así que puede también sobrescribir con datos viejos.

Resultado: el paquete vuelve a aparecer como `approved` en la lista.

### Solución

**1. Agregar un ref de "optimistic overrides" en AdminDashboard**

Crear un `optimisticOverridesRef` que almacene `{ [packageId]: { status, timestamp } }`. Cuando se hace un match optimístico, se registra el packageId con su nuevo status y un timestamp.

**2. Proteger el sync effect**

En el effect de línea 130-139, antes de aplicar `setLocalPackages(packages)`, filtrar los paquetes que tienen un override activo (menos de 15 segundos) y preservar su status optimístico.

**3. Pasar protección al realtime handler**

Pasar `recentMutationsRef` (o el nuevo `optimisticOverridesRef`) a `useConsolidatedRealtimeAdmin` para que ignore updates de paquetes recientemente mutados.

**4. Limpiar el override cuando el RPC termina**

En el `try` exitoso y en el `catch` (rollback), limpiar el override del packageId.

### Archivo a modificar

**`src/components/AdminDashboard.tsx`**:
- Agregar `optimisticOverridesRef = useRef<Record<string, number>>({})`
- En `handleMatchConfirm`: registrar `optimisticOverridesRef.current[matchPackageId] = Date.now()`
- En el sync effect: aplicar `packages` pero preservar status de paquetes con override activo (<15s)
- En el catch (rollback): eliminar el override
- En el try (success): eliminar el override
- Pasar el ref a `useConsolidatedRealtimeAdmin` como `recentMutationsRef`

### Detalle técnico

```text
Antes:
  optimistic update → modal closes → sync effect runs → packages prop (stale) overwrites → "approved" again

Después:
  optimistic update → register override → modal closes → sync effect runs 
    → checks override → preserves "matched" for 15s → RPC completes → parent refetches → real "matched" arrives → override cleared
```

