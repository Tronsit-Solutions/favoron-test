

## Fix: Resolver incidencia no actualiza la UI (la UI no se refresca)

### Problema
Aunque los datos se guardan correctamente en la base de datos (PATCH retorna 204), la UI no se actualiza porque no se ejecuta un re-fetch de los datos despues de resolver la incidencia.

**Causa raiz:** En `handleIncidentAction`, se llama `closeModal(modalId)` primero y luego `onRefresh?.()` sin await. `closeModal` elimina los datos del modal del contexto global, lo que causa que `AdminActionsModal` se desmonte (porque `pkg` se vuelve `null` y retorna `null`). El `onRefresh?.()` inicia la cadena asincrona, pero como el componente se esta desmontando, la promesa puede no completarse o ejecutarse correctamente.

Los logs de red confirman: despues del PATCH exitoso, no se ejecuta ningun GET para refrescar los datos.

### Solucion
Cambiar el orden de operaciones: primero ejecutar y esperar (`await`) el refresh de datos, y solo despues cerrar el modal. Esto garantiza que los datos se refrescan antes de que el componente se desmonte.

### Cambios

**Archivo: `src/components/admin/AdminActionsModal.tsx` (lineas ~444-445)**

Cambiar:
```typescript
closeModal(modalId);
onRefresh?.();
```

A:
```typescript
await onRefresh?.();
closeModal(modalId);
```

Tambien actualizar la firma del prop `onRefresh` para reflejar que es asincrono:

```typescript
onRefresh?: () => void | Promise<void>;
```

### Por que funciona
- Al hacer `await onRefresh?.()`, el refresh completa el fetch de datos desde la base de datos ANTES de que `closeModal` desmonte el componente
- Los datos actualizados ya estaran en el estado global cuando el componente se cierre
- El modal se cerrara despues con los datos frescos ya disponibles en la UI

### Nota sobre consistencia
Este mismo patron (await refresh, luego close) debe aplicarse a los otros handlers que ya llaman `closeModal` + `onRefresh`, como `handleStatusChange` y `handleReassignTrip`, para prevenir el mismo tipo de problema.
