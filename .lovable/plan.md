

## Ajustes al Indicador de "Empaque Original"

### Cambios solicitados

1. **Agregar indicador en la tarjeta preview de aprobación** (`AdminApprovalsTab.tsx`)
2. **Quitar el resaltado amarillo en la vista de detalles** (`PackageDetailModal.tsx`)

---

### 1. AdminApprovalsTab.tsx - Agregar indicador en preview card

**Ubicación**: Después de las notas adicionales (línea ~298), antes de los botones de acción

**Lógica**: Revisar `products_data` del paquete para determinar si algún producto requiere empaque original

```tsx
{/* Indicador de empaque original */}
{pkg.products_data && pkg.products_data.length > 0 && (
  <p className="text-xs text-muted-foreground">
    📦 {pkg.products_data.some((p: any) => p.needsOriginalPackaging) 
      ? 'Conservar empaque original' 
      : 'No requiere empaque original'}
  </p>
)}
```

---

### 2. PackageDetailModal.tsx - Quitar resaltado amarillo

**Ubicación**: Líneas 1560-1566

**Cambio**: Eliminar las clases de fondo (`bg-amber-50` y `bg-muted/30`) para mantener solo el texto coloreado

**Antes**:
```tsx
<div className={`mt-2 px-2 py-1 rounded text-xs flex items-center gap-1 ${
  product.rawProduct?.needsOriginalPackaging 
    ? 'text-amber-600 bg-amber-50' 
    : 'text-muted-foreground bg-muted/30'
}`}>
```

**Después**:
```tsx
<div className={`mt-2 text-xs flex items-center gap-1 ${
  product.rawProduct?.needsOriginalPackaging 
    ? 'text-amber-600' 
    : 'text-muted-foreground'
}`}>
```

---

### Resumen de archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/AdminApprovalsTab.tsx` | Agregar indicador de empaque en preview card |
| `src/components/admin/PackageDetailModal.tsx` | Quitar fondo amarillo/gris del indicador |

