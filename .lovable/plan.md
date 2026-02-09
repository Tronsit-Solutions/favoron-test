
## Corregir visualización del desglose de reembolso para usar el serviceFee guardado

### Problema
En `AdminRefundsTab.tsx`, el desglose de reembolsos:
1. **Línea 380**: Usa un fallback de 40% si no hay `serviceFee` guardado, pero debería usar el `serviceFee` real del quote
2. **Línea 411**: La etiqueta dice fijo "Fee de Favoron (40%)" pero el porcentaje real varía (50% para usuarios básicos, 25% para Prime, etc.)

### Ejemplo del problema
Para el producto "Whoop" con tip Q140:
- **Lo que muestra actualmente**: "Fee de Favoron (40%): Q56.00" y Total: Q191
- **Lo que debería mostrar**: "Fee de Favoron (50%): Q70.00" y Total: Q205

### Solución
Modificar `AdminRefundsTab.tsx` para:
1. Usar el `serviceFee` guardado en el producto cancelado (viene del quote original)
2. Calcular el porcentaje real dinámicamente para la etiqueta
3. Mantener fallback solo si el dato no existe (backwards compatibility)

### Cambios técnicos

**Archivo:** `src/components/admin/AdminRefundsTab.tsx`

**Línea 379-380** - Cambiar el cálculo del fallback:
```tsx
// Antes:
const serviceFee = p.serviceFee ?? Math.round(tip * 0.4 * 100) / 100;

// Después: Usar el serviceFee guardado, el fallback es 50% (tarifa básica) no 40%
const serviceFee = p.serviceFee ?? Math.round(tip * 0.5 * 100) / 100;
```

**Línea 410-413** - Cambiar la etiqueta fija por una dinámica:
```tsx
// Antes:
<span className="text-muted-foreground">Fee de Favoron (40%):</span>

// Después: Calcular el porcentaje real
const serviceFeePercent = tip > 0 ? Math.round((serviceFee / tip) * 100) : 50;
// Y en el JSX:
<span className="text-muted-foreground">Fee de Favoron ({serviceFeePercent}%):</span>
```

### Lógica completa del bloque corregido

```tsx
{selectedRefund.cancelled_products?.map((p: any, i: number) => {
  const productName = p.description || p.itemDescription || 'Producto sin descripción';
  const quantity = p.quantity || 1;
  const tip = p.tip || p.adminAssignedTip || 0;
  
  // Use stored serviceFee, fallback to 50% (basic rate) if not stored
  const serviceFee = p.serviceFee ?? Math.round(tip * 0.5 * 100) / 100;
  
  // Calculate dynamic percentage for display
  const serviceFeePercent = tip > 0 ? Math.round((serviceFee / tip) * 100) : 50;
  
  // ... resto del código ...
  
  return (
    // En la etiqueta:
    <span className="text-muted-foreground">Fee de Favoron ({serviceFeePercent}%):</span>
  );
})}
```

### Resultado esperado
Para el producto "Whoop" con tip Q140 y serviceFee guardado de Q70:
- "Fee de Favoron (50%): Q70.00"
- Total: Q140 + Q70 - Q5 = **Q205.00**

### Archivos a modificar
1. `src/components/admin/AdminRefundsTab.tsx` - Líneas 379-413
