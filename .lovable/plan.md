

## Hacer el botón "Descartar" más prominente en paquetes terminales

### Cambio

**`src/components/dashboard/CollapsibleTravelerPackageCard.tsx` (líneas 435, 443, 451)**

Cambiar los 3 botones de `variant="outline"` con clases sutiles a `variant="destructive"` con tamaño más visible:

```tsx
// De:
<Button size="sm" variant="outline" className="text-xs h-8 px-3 flex-shrink-0" ...>

// A:
<Button size="sm" variant="destructive" className="text-sm h-9 px-4 flex-shrink-0" ...>
```

Esto aplica a las 3 instancias: `bid_lost`, `bid_expired`, y `bid_cancelled`.

### Archivo
- `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`

