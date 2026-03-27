

## Dividir paquetes en secciones: Confirmados vs Pendientes

### Cambio

Dentro de cada viaje en "Mis Viajes", separar los paquetes en dos grupos visuales:

1. **Confirmados** — paquetes con status en el flujo post-pago: `pending_purchase`, `payment_pending_approval`, `paid`, `shipped`, `in_transit`, `received_by_traveler`, `pending_office_confirmation`, `delivered_to_office`, `ready_for_pickup`, `ready_for_delivery`, `completed`
2. **Pendientes / Otros** — paquetes en `matched` (bid pending/submitted), `quote_sent`, `quote_expired`, `payment_pending`, y multi-assignments no confirmados

### Implementación

**Archivo: `src/components/Dashboard.tsx`** (líneas ~980-1005)

Después de calcular `tripPackages`, dividir en dos arrays:

```typescript
const confirmedPackages = tripPackages.filter(pkg => 
  PAID_OR_POST_PAYMENT.includes(pkg.status)
);
const pendingPackages = tripPackages.filter(pkg => 
  !PAID_OR_POST_PAYMENT.includes(pkg.status)
);
```

Reemplazar el bloque actual de renderizado de paquetes con dos secciones:

```text
📦 X paquetes asignados

── ✅ Confirmados (Y) ──────────
   [PackageCard...]
   [PackageCard...]

── ⏳ Pendientes (Z) ───────────
   [PackageCard...]
```

- Cada sección tiene un encabezado con icono y conteo
- Si una sección está vacía, no se muestra
- Los confirmados van primero (son los que el viajero debe gestionar activamente)
- Los pendientes incluyen los que esperan cotización, selección, o están cancelados/expirados

### Diseño visual
- Encabezado de sección: texto `text-sm font-medium` con color diferenciado (verde para confirmados, amber para pendientes)
- Separación con `space-y-2` entre secciones

