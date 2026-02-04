

## Agregar Opción de Empaque Original al Modal de Edición

### Objetivo
Permitir que los shoppers y admins puedan modificar la preferencia de empaque original para cada producto al editar un paquete existente.

---

### Cambios Propuestos

#### 1. Actualizar Interface Product
**Archivo:** `src/components/dashboard/EditPackageModal.tsx` (lineas 28-35)

Agregar el campo `needsOriginalPackaging` a la interfaz:

```tsx
interface Product {
  itemLink?: string;
  itemDescription?: string;
  estimatedPrice?: string | number;
  quantity?: string | number;
  requestType?: string;
  additionalNotes?: string;
  needsOriginalPackaging?: boolean;  // <-- Agregar
}
```

---

#### 2. Agregar Import de Checkbox
**Archivo:** `src/components/dashboard/EditPackageModal.tsx` (linea 1-24)

Agregar import del componente Checkbox:

```tsx
import { Checkbox } from "@/components/ui/checkbox";
```

---

#### 3. Agregar Control de Empaque en cada Producto
**Archivo:** `src/components/dashboard/EditPackageModal.tsx` (despues de la linea 277, dentro del map de productos)

Agregar un checkbox despues del row de precio/cantidad:

```tsx
{/* Empaque Original */}
<div className="flex items-center space-x-2 pt-2 border-t border-muted/40 mt-3">
  <Checkbox
    id={`packaging-${index}`}
    checked={product.needsOriginalPackaging || false}
    onCheckedChange={(checked) => 
      updateProduct(index, "needsOriginalPackaging", checked === true)
    }
  />
  <Label 
    htmlFor={`packaging-${index}`} 
    className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
  >
    📦 Conservar empaque/caja original
  </Label>
</div>
```

---

#### 4. Actualizar Funcion updateProduct
**Archivo:** `src/components/dashboard/EditPackageModal.tsx` (lineas 134-140)

Modificar el tipo del parametro `value` para aceptar boolean:

```tsx
const updateProduct = (index: number, field: keyof Product, value: string | number | boolean) => {
  setProducts(prev => {
    const updated = [...prev];
    updated[index] = { ...updated[index], [field]: value };
    return updated;
  });
};
```

---

### Resumen Visual

| Seccion | Antes | Despues |
|---------|-------|---------|
| Interfaz Product | Sin needsOriginalPackaging | Con needsOriginalPackaging |
| Cada tarjeta de producto | Solo link, descripcion, precio, cantidad | + Checkbox de empaque original |
| Funcion updateProduct | Solo string/number | + boolean |

---

### Ubicacion del Control en UI

Dentro de cada tarjeta de producto, despues de precio/cantidad:

```
┌─────────────────────────────────────┐
│ Producto 1                          │
│ ─────────────────────────────────── │
│ Link: [________________]            │
│ Descripcion: [________________]     │
│ Precio: [___] Cantidad: [___]       │
│ ─────────────────────────────────── │
│ ☑ 📦 Conservar empaque/caja original│  <-- Nuevo
└─────────────────────────────────────┘
```

---

### Archivo a Modificar

1. `src/components/dashboard/EditPackageModal.tsx`
   - Agregar import de Checkbox
   - Extender interface Product
   - Actualizar funcion updateProduct para aceptar boolean
   - Agregar control de empaque por cada producto

