

# Plan: Agregar Campo de Instrucciones en Modo Edición Admin

## Problema Identificado

Cuando un administrador edita pedidos personales (`requestType === 'personal'`), el campo "Instrucciones" no está disponible para editar, aunque sí se muestra en modo visualización.

**Ubicación del problema:**
- Archivo: `src/components/admin/PackageDetailModal.tsx`
- Modo visualización (líneas 1500-1506): El campo `instructions` SÍ se muestra
- Modo edición (líneas 1285-1296): Solo existe el campo `additionalNotes`, pero falta `instructions`

## Solución Propuesta

Agregar un campo de texto para editar las instrucciones cuando el producto es de tipo "personal", justo después del campo de notas adicionales en el formulario de edición.

## Cambios Técnicos

### 1. Actualizar el Tipo de Estado `editProducts`

**Ubicación:** Líneas 160-170

Agregar `instructions` al tipo del estado:

```typescript
const [editProducts, setEditProducts] = useState<Array<{
  itemDescription: string;
  estimatedPrice: string;
  quantity: string;
  itemLink: string;
  additionalNotes?: string;
  adminAssignedTip?: number;
  requestType?: string;
  weight?: string;
  instructions?: string;  // <-- AGREGAR
  [key: string]: any;
}>>([]);
```

### 2. Agregar Campo de Instrucciones en Modo Edición

**Ubicación:** Después de línea 1296 (campo de notas adicionales)

Agregar el siguiente bloque condicional:

```tsx
{/* Instructions field for personal orders */}
{(product.requestType === 'personal' || product.instructions) && (
  <div className="md:col-span-2">
    <label className="text-xs font-medium text-muted-foreground">
      Instrucciones para pedido personal
    </label>
    <Textarea
      value={product.instructions || ''}
      onChange={(e) => handleProductChange(idx, 'instructions', e.target.value)}
      placeholder="Instrucciones especiales para el viajero..."
      className="mt-1"
      rows={3}
    />
  </div>
)}
```

## Comportamiento Esperado

| Escenario | Antes | Después |
|-----------|-------|---------|
| Producto tipo "personal" con instrucciones | Campo no visible para editar | Campo visible y editable |
| Producto tipo "online" sin instrucciones | Sin cambio | Sin cambio (campo oculto) |
| Producto con `instructions` pero sin `requestType` | Campo no visible | Campo visible (como fallback) |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/PackageDetailModal.tsx` | Agregar tipo `instructions` al estado y campo de edición condicional |

## Notas Importantes

- El campo `instructions` ya se preserva en la inicialización gracias al spread `...p` en línea 199
- La función `handleProductChange` existente funcionará sin modificaciones
- El campo solo aparecerá para productos de tipo "personal" o que ya tengan instrucciones

