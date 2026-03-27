

## Problema: Toast de confirmación tarda porque espera al RPC

### Diagnóstico
El flujo actual es:
1. Click "Confirmar Match" → modal se cierra inmediatamente ✅
2. `await supabase.rpc('assign_package_to_travelers')` → **espera respuesta del servidor**
3. Actualización local + toast "¡Match exitoso!"

El toast no aparece hasta que el RPC responde. Con latencia de red (servidor Supabase remoto), esto puede tomar 1-3 segundos. No hay triggers ni queries lentas — es puramente latencia de red.

### Solución: Toast y actualización optimistas

Mostrar el toast y actualizar el estado local **antes** de esperar el RPC. Si el RPC falla, revertir y mostrar error.

### Cambios

**`src/components/AdminDashboard.tsx`** — `handleMatch`:
- Mover el toast y `setLocalPackages` **antes** del `await onMatchPackage()`
- Si `onMatchPackage` falla, revertir el estado local y mostrar toast de error

```
// Flujo actual:
await onMatchPackage(...);  // espera red
setLocalPackages(...);      // actualiza UI
toast("¡Match exitoso!");   // muestra confirmación

// Flujo propuesto:
setLocalPackages(...);      // actualiza UI inmediatamente
toast("¡Match exitoso!");   // muestra confirmación inmediatamente
onMatchPackage(...)         // ejecuta en background
  .catch(() => {
    revertLocalPackages();  // rollback si falla
    toast("Error...");
  });
```

### Detalle técnico
- El `setMatchingPackageIds` ya oculta el paquete de "Solicitudes", así que la transición visual ya es inmediata
- Solo falta adelantar el toast y la actualización de `localPackages` al estado `matched`
- El `recentMatchRef` sigue protegiendo contra sobrescrituras stale del realtime
- El `handleMatchPackage` en `useDashboardActions` sigue haciendo `await` del RPC internamente, pero `AdminDashboard.handleMatch` no necesita esperar su resultado para dar feedback

Esto hará que la confirmación sea **instantánea** (<100ms) tras hacer click.

