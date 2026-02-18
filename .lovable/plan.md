

## Fix: La UI no se actualiza al resolver incidencias

### Problema
Los datos SI se guardan correctamente en la base de datos (verificado: el paquete tiene `incident_status: 'resolved'` y el `incident_history` contiene la entrada de resolucion). Sin embargo, la interfaz no refleja el cambio.

**Causa raiz:** Cuando `handleIncidentAction` termina exitosamente, llama `onRefresh()` pero NO cierra el modal. En `AdminDashboard.tsx`, el callback `onRefresh` verifica `hasOpenModals()` y bloquea el refresh si hay modales abiertos. Como el `AdminActionsModal` sigue abierto, el refresh nunca se ejecuta.

### Solucion
Modificar `handleIncidentAction` en `AdminActionsModal.tsx` para que, tras el exito, actualice el estado local del paquete y/o cierre el modal antes de llamar `onRefresh`.

### Cambios

**Archivo: `src/components/admin/AdminActionsModal.tsx` (linea ~444)**

Despues del toast de exito, agregar `closeModal(modalId)` antes de `onRefresh()`, igual que hacen los otros handlers (cambio de estado, reasignacion). Esto permite que `onRefresh` se ejecute sin ser bloqueado por el modal.

Cambiar:
```typescript
toast({ ... });
onRefresh?.();
```

A:
```typescript
toast({ ... });
closeModal(modalId);
onRefresh?.();
```

### Seccion tecnica
- Los otros handlers exitosos del modal (`handleStatusChange`, `handleReassignTrip`) ya siguen este patron de `closeModal` + `onRefresh`.
- `handleIncidentAction` es el unico que omite `closeModal`, causando que `hasOpenModals()` retorne `true` y bloquee el refresh.
- El `IncidentReasonModal` hijo ya llama su propio `onClose` internamente, pero eso no cierra el `AdminActionsModal` padre.

