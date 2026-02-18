

## Fix: Boton "Acciones" no funciona en la pestana de Incidencias Activas

### Problema
El boton "Acciones" en la pestana de Soporte/Incidencias Activas no abre ningun modal. La causa es un desajuste en los IDs de modal:

- La pestana de soporte llama `openModal("admin-actions-${pkg.id}", ...)` con un ID dinamico (ej: `"admin-actions-f56904bf"`)
- El componente `AdminActionsModal` solo escucha el ID fijo `"admin-actions"` 
- Como los IDs no coinciden, `isModalOpen` siempre retorna `false` y el modal nunca se abre

### Solucion
Cambiar la llamada en `AdminDashboard.tsx` linea 648-651 para que la pestana de soporte use el mismo `modalId` fijo que el componente `AdminActionsModal` ya tiene registrado.

### Cambio

**Archivo: `src/components/AdminDashboard.tsx` (linea ~648-651)**

Cambiar:
```
onOpenActionsModal={(pkg) => {
  const modalId = `admin-actions-${pkg.id}`;
  openModal(modalId, 'admin-actions', pkg);
}}
```

A:
```
onOpenActionsModal={(pkg) => {
  openModal("admin-actions", 'admin-actions', pkg);
}}
```

Esto hace que use el mismo ID `"admin-actions"` que el `AdminActionsModal` ya esta escuchando (linea 674), identico a como funciona correctamente en la pestana de Matches.

