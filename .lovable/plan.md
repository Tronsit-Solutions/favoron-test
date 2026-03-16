

## Fix: Modal se cierra al guardar edición

### Problema
En `PackageDetailModal.tsx`, la función `handleSaveChanges` (línea 689) llama `closeModal(modalId)` después de guardar, lo que cierra todo el modal en lugar de solo salir del modo edición.

### Solución
Eliminar la línea `closeModal(modalId)` de `handleSaveChanges` y agregar un `refetchPackageDetails()` para que los datos actualizados se reflejen inmediatamente sin cerrar el modal.

### Cambio en `src/components/admin/PackageDetailModal.tsx`

**Líneas 723-726** — Cambiar de:
```ts
onUpdatePackage(pkg.id, updates);
}
setEditMode(false);
closeModal(modalId);
```

A:
```ts
onUpdatePackage(pkg.id, updates);
refetchPackageDetails();
}
setEditMode(false);
```

Se elimina `closeModal(modalId)` y se agrega `refetchPackageDetails()` para refrescar los datos en el modal después de guardar.

