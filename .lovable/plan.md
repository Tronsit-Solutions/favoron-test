

## Agregar Checkbox de Empaque Original al Modal de Admin

### Problema
El checkbox de "empaque original" se agregó al modal de edición del shopper, pero falta en el modal de administración (`PackageDetailModal.tsx`) que se usa en el panel de matching/aprobaciones.

---

### Cambios Propuestos

#### 1. Agregar Import de Checkbox
**Archivo:** `src/components/admin/PackageDetailModal.tsx` (inicio del archivo)

```tsx
import { Checkbox } from "@/components/ui/checkbox";
```

---

#### 2. Actualizar Interface de editProducts
**Lineas 177-188** - Agregar `needsOriginalPackaging`:

```tsx
const [editProducts, setEditProducts] = useState<Array<{
  itemDescription: string;
  estimatedPrice: string;
  quantity: string;
  itemLink: string;
  additionalNotes?: string;
  adminAssignedTip?: number;
  requestType?: string;
  weight?: string;
  instructions?: string;
  needsOriginalPackaging?: boolean;  // <-- Agregar
  [key: string]: any;
}>>([]);
```

---

#### 3. Actualizar handleProductChange para aceptar boolean
**Lineas 594-603**:

```tsx
const handleProductChange = (index: number, field: string, value: string | boolean) => {
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

---

#### 4. Agregar Checkbox en el Formulario de Productos
**Despues de linea 1373** (despues del campo de Peso), agregar:

```tsx
{/* Empaque Original */}
<div className="md:col-span-2">
  <div className="flex items-center space-x-2 pt-2 border-t border-muted/40 mt-2">
    <Checkbox
      id={`packaging-${idx}`}
      checked={product.needsOriginalPackaging || false}
      onCheckedChange={(checked) => 
        handleProductChange(idx, 'needsOriginalPackaging', checked === true)
      }
    />
    <label 
      htmlFor={`packaging-${idx}`} 
      className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
    >
      📦 Conservar empaque/caja original
    </label>
  </div>
</div>
```

---

### Ubicacion del Control

Dentro del formulario de cada producto en el admin:

```
┌─────────────────────────────────────┐
│ Producto #1                Tip: Q__ │
│ ─────────────────────────────────── │
│ Descripcion: [________________]     │
│ Precio: [___]    Cantidad: [___]    │
│ Link: [________________________]    │
│ Notas adicionales: [___________]    │
│ Peso (lbs): [___]                   │
│ ─────────────────────────────────── │
│ ☑ 📦 Conservar empaque/caja original│  <-- Nuevo
│ ─────────────────────────────────── │
│            Subtotal: $808.99        │
└─────────────────────────────────────┘
```

---

### Archivos a Modificar

1. `src/components/admin/PackageDetailModal.tsx`
   - Agregar import de Checkbox
   - Extender tipado de editProducts
   - Actualizar handleProductChange
   - Agregar checkbox en cada producto

---

### Resultado Esperado
Los administradores podran ver y modificar la preferencia de empaque original para cada producto directamente desde el modal de detalle/edicion en el panel de matching.

