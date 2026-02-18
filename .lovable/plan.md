

## Fix: Resolver incidencia no actualiza la UI

### Problema
Cuando se resuelve una incidencia, los datos se guardan en la base de datos pero la UI no se actualiza. El fix anterior (agregar `closeModal`) era necesario pero insuficiente.

**Causa raiz:** El callback `onRefresh` del `AdminActionsModal` solo llama `processQueuedUpdates()`, que procesa actualizaciones de realtime pendientes. Pero resolver una incidencia es una mutacion directa a la base de datos -- no genera un evento en la cola de realtime. Por lo tanto, `processQueuedUpdates()` no tiene nada que procesar y la UI queda sin cambios.

Otros componentes como `AdminPaymentsUnifiedTab` ya usan `refreshAdminData` (que re-fetch completo de la base de datos) como su `onRefresh`, y funciona correctamente.

### Solucion
Cambiar el `onRefresh` del `AdminActionsModal` para que llame `refreshAdminData` en lugar de solo `processQueuedUpdates`.

### Cambios

**Archivo: `src/components/AdminDashboard.tsx` (lineas ~675-682 y ~689-696)**

Para ambas instancias de `AdminActionsModal`, cambiar:
```
onRefresh={() => {
  console.log('...');
  if (!hasOpenModals()) {
    processQueuedUpdates();
  } else {
    console.log('...');
  }
}}
```

A:
```
onRefresh={async () => {
  console.log('AdminActionsModal refresh - fetching latest data');
  if (refreshAdminData) {
    await refreshAdminData();
  }
}}
```

Esto garantiza que despues de cualquier accion en el modal (cambio de estado, resolucion de incidencia, reasignacion), se haga un re-fetch real de los datos desde la base de datos.

### Seccion tecnica
- `processQueuedUpdates()` solo aplica eventos de realtime acumulados. Mutaciones directas via `supabase.from('packages').update()` no generan entradas en esa cola.
- `refreshAdminData` es una funcion pasada como prop que hace un fetch completo de paquetes y viajes desde Supabase, garantizando que la UI refleje el estado actual de la base de datos.
- El `closeModal(modalId)` agregado anteriormente sigue siendo necesario para que el modal se cierre, pero ya no necesita desbloquear el refresh porque `refreshAdminData` no tiene el check de `hasOpenModals()`.
