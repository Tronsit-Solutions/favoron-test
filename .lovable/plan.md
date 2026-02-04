

## Agregar Campo "Necesita Etiqueta/Envoltorio Original"

### Objetivo
Agregar un campo Sí/No en el formulario de productos para indicar si el shopper necesita que el producto llegue con su empaque/etiqueta original.

### Ubicacion en el formulario
**Step 2 (Productos)** - Dentro de cada tarjeta de producto, despues del campo de Cantidad para compras online, o despues de las fotos para pedidos personales.

### Cambios tecnicos

#### 1. Modificar interface `Product` en `src/types/index.ts`

```typescript
export interface Product {
  itemDescription: string;
  estimatedPrice: string;
  itemLink?: string;
  requestType?: 'online' | 'personal';
  instructions?: string;
  weight?: number;
  declaredValue?: number;
  productPhotos?: Array<...>;
  quantity?: string;
  needsOriginalPackaging?: boolean;  // NUEVO campo
}
```

#### 2. Modificar `ProductData` en `src/types/index.ts`

```typescript
export interface ProductData {
  // ... campos existentes
  needsOriginalPackaging?: boolean;  // NUEVO campo
}
```

#### 3. Modificar `PackageRequestForm.tsx`

**Agregar campo en cada producto (ambos tipos: online y personal):**

Despues del campo de Cantidad (para online, linea ~994) y despues de las fotos (para personal, linea ~1084):

```tsx
{/* Necesita empaque original */}
<div className="pt-2 border-t border-border/50 mt-3">
  <div className="flex items-center justify-between">
    <div>
      <Label className="text-xs text-muted-foreground">
        ¿Necesitas la etiqueta/empaque original?
      </Label>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        Indica si es importante conservar el empaque de fabrica
      </p>
    </div>
    <RadioGroup
      value={product.needsOriginalPackaging === true ? 'yes' : 'no'}
      onValueChange={(value) => updateProduct(index, 'needsOriginalPackaging', value === 'yes')}
      className="flex space-x-4"
    >
      <div className="flex items-center space-x-1">
        <RadioGroupItem value="yes" id={`packaging-yes-${index}`} />
        <Label htmlFor={`packaging-yes-${index}`} className="text-xs cursor-pointer">Si</Label>
      </div>
      <div className="flex items-center space-x-1">
        <RadioGroupItem value="no" id={`packaging-no-${index}`} />
        <Label htmlFor={`packaging-no-${index}`} className="text-xs cursor-pointer">No</Label>
      </div>
    </RadioGroup>
  </div>
</div>
```

### Valor por defecto
- `needsOriginalPackaging: false` (No) - El valor predeterminado sera "No" para no obligar al usuario a seleccionar

### Resultado visual esperado

```text
+------------------------------------------+
| Producto #1                              |
| Link del producto *                      |
| [https://amazon.com/producto...]         |
|                                          |
| Descripcion del producto *               |
| [iPhone 15 Pro Max 256GB Color Azul...]  |
|                                          |
| Precio (USD) *     | Cantidad *          |
| [$ 299.99]         | [1]                 |
|                                          |
| ---------------------------------------- |
| ¿Necesitas la etiqueta/empaque original? |
| Indica si es importante conservar...     |
|                           (o) Si  (o) No |
+------------------------------------------+
```

### Archivos a modificar
1. `src/types/index.ts` - Agregar campo `needsOriginalPackaging`
2. `src/components/PackageRequestForm.tsx` - Agregar UI del campo

