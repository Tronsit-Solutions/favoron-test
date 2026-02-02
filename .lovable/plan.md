
# Plan: Actualizar package_destination_country al Editar Paquete

## Problema Identificado
En el archivo `src/components/admin/PackageDetailModal.tsx`, cuando el admin edita el destino de un paquete:
- Se guarda `package_destination` (la ciudad)
- **NO** se guarda `package_destination_country` (el país)

El estado `selectedDestinationCountry` ya existe (línea 176) pero no se incluye en el objeto `updates` de `handleSaveChanges`.

## Solución

### Archivo: `src/components/admin/PackageDetailModal.tsx`

**Cambio en `handleSaveChanges` (líneas 629-637)**:

Agregar `package_destination_country` al objeto de actualizaciones:

```typescript
const updates = {
  products_data: normalizedProducts,
  item_description: autoDescription,
  item_link: normalizedProducts[0]?.itemLink || null,
  estimated_price: totalPrice,
  purchase_origin: editForm.purchase_origin,
  package_destination: editForm.package_destination,
  package_destination_country: selectedDestinationCountry || 'guatemala', // AGREGAR
  additional_notes: editForm.additional_notes?.trim() || null
};
```

## Resultado
Cuando el admin cambie el destino del paquete, tanto el país como la ciudad se actualizarán en la base de datos, manteniendo la consistencia de datos.
