

## Fix: Limpiar assignment `bid_won` al solicitar recotización

### Problema
Cuando un shopper solicita recotización (`handleRequestRequote` en `Dashboard.tsx` línea 612), el paquete se actualiza a `approved` y se limpia `matched_trip_id`, pero **no se actualiza la tabla `package_assignments`**. La asignación ganadora (`bid_won`) permanece activa, causando:
- El viajero sigue viendo el paquete como ganado
- Al re-asignar, la lógica de duplicados detecta la asignación existente y puede fallar

### Solución — `src/components/Dashboard.tsx`

En `handleRequestRequote` (~línea 618-628), después del update al paquete, agregar una segunda query para marcar todas las asignaciones activas como `bid_cancelled`:

```ts
// After the package update succeeds:
await supabase
  .from('package_assignments')
  .update({ status: 'bid_cancelled', updated_at: new Date().toISOString() })
  .eq('package_id', pkg.id)
  .in('status', ['bid_won', 'bid_submitted', 'bid_pending']);
```

Esto cancela cualquier asignación activa cuando el shopper solicita recotización, permitiendo que el paquete vuelva limpiamente al flujo de matching.

### Archivos
- **Modificar**: `src/components/Dashboard.tsx` — función `handleRequestRequote` (~línea 628)

