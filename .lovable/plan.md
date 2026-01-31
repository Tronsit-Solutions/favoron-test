
## Corregir: Notas Adicionales de Productos No Se Guardan

### Problema Identificado

En `useDashboardActions.tsx`, el código sobrescribe las notas individuales de cada producto con las notas a nivel de paquete:

| Campo | Propósito | Qué pasa |
|-------|-----------|----------|
| `products_data[].additionalNotes` | Notas por producto | ❌ Se sobrescribe |
| `package.additional_notes` | Notas generales del paquete | Se usa para sobrescribir |

```typescript
// Líneas 1749-1755 - CÓDIGO PROBLEMÁTICO
updateData.products_data = updateData.products_data.map((product: any) => ({
  ...product,
  additionalNotes: updateData.additional_notes || null  // ← Sobrescribe notas del producto
}));
```

---

### Solución

**Eliminar** el bloque que sobrescribe las notas de productos, ya que cada producto ya trae su `additionalNotes` correcto desde el modal de edición.

---

### Archivo a Modificar

**`src/hooks/useDashboardActions.tsx`** (líneas 1746-1758)

**Código actual:**
```typescript
// Prepare update data (remove ID and set status)
const { id, ...updateData } = editedPackageData;
updateData.status = needsReapproval ? 'pending_approval' : originalPackage.status;

// Add additional notes to products_data if it exists
if (updateData.products_data && Array.isArray(updateData.products_data)) {
  updateData.products_data = updateData.products_data.map((product: any) => ({
    ...product,
    additionalNotes: updateData.additional_notes || null
  }));
}

// Update package in Supabase
await updatePackage(id, updateData);
```

**Código corregido:**
```typescript
// Prepare update data (remove ID and set status)
const { id, ...updateData } = editedPackageData;
updateData.status = needsReapproval ? 'pending_approval' : originalPackage.status;

// products_data already contains correct additionalNotes from PackageDetailModal
// No need to overwrite - each product has its own notes

// Update package in Supabase
await updatePackage(id, updateData);
```

---

### Resultado Esperado

1. Admin edita un producto y agrega notas en "Notas adicionales (opcional)"
2. Al guardar, las notas se preservan correctamente en `products_data[].additionalNotes`
3. Notas a nivel de paquete (`additional_notes`) se guardan por separado sin interferir
