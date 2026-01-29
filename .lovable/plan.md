

# Plan: Hacer editable el tip por producto en la sección "Editar Productos"

## Problema

En la sección "Editar Productos" del `PackageDetailModal`, el tip de cada producto se muestra como un Badge de solo lectura ("Tip: Q90", "Tip: Q25"), pero el admin necesita poder editarlo directamente en esa misma vista.

## Solución

Reemplazar el Badge de solo lectura por un campo Input editable que permita modificar el `adminAssignedTip` de cada producto.

## Archivo a modificar

**`src/components/admin/PackageDetailModal.tsx`**

## Cambio específico (líneas 1219-1226)

**Código actual:**
```tsx
<div className="flex items-center justify-between">
  <Badge variant="secondary">Producto #{idx + 1}</Badge>
  {product.adminAssignedTip > 0 && (
    <Badge variant="outline" className="bg-green-50 text-green-700">
      Tip: Q{product.adminAssignedTip}
    </Badge>
  )}
</div>
```

**Código nuevo:**
```tsx
<div className="flex items-center justify-between gap-2">
  <Badge variant="secondary">Producto #{idx + 1}</Badge>
  <div className="flex items-center gap-1">
    <label className="text-xs text-muted-foreground">Tip:</label>
    <div className="relative w-24">
      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">Q</span>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={product.adminAssignedTip || ''}
        onChange={(e) => handleProductChange(idx, 'adminAssignedTip', e.target.value)}
        placeholder="0"
        className="h-7 pl-6 text-xs font-mono text-right"
      />
    </div>
  </div>
</div>
```

## Verificación adicional

El `handleProductChange` ya existe y soporta actualizar cualquier campo:

```tsx
const handleProductChange = (index: number, field: string, value: string) => {
  setEditProducts(prev => {
    const updated = [...prev];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    return updated;
  });
};
```

Para `adminAssignedTip`, necesitamos convertir a número al guardar. Verificaré si el `handleSavePackageEdit` ya lo maneja correctamente.

## Beneficio

El admin podrá editar los tips de cada producto directamente en la sección "Editar Productos" sin necesidad de usar un modal separado, haciendo la edición más fluida y rápida.

## Resultado visual esperado

```text
+-----------------------------------------------+
| [Producto #1]                    Tip: [Q|90 ] |
+-----------------------------------------------+
| Descripción del producto                      |
| [Yeti water bottle 64oz                     ] |
|                                               |
| Precio (USD)    | Cantidad                    |
| [65            ]| [1                        ] |
|                 ...                           |
|                         Subtotal: $65.00      |
+-----------------------------------------------+
```

