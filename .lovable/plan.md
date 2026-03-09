

## Simplificar vista de cotización expirada en cards móvil

### Cambios en `src/components/dashboard/CollapsiblePackageCard.tsx`

**1. Status badge (línea 443)** — Ya muestra "Cotización Expirada" via `getStatusBadge` cuando detecta expiración. No requiere cambios.

**2. Eliminar caja amarilla y dejar solo el botón (líneas 635-646)** — Quitar el `div` con fondo `bg-amber-50` y el texto explicativo. Dejar únicamente el botón "Solicitar Nueva Cotización" directamente:

```tsx
{(pkg.status === 'quote_expired' || ...) && onRequestRequote && (
  <Button size="sm" variant="shopper" onClick={...} className="text-xs w-full flex items-center gap-2">
    <RefreshCw className="h-3 w-3" />
    Solicitar Nueva Cotización
  </Button>
)}
```

