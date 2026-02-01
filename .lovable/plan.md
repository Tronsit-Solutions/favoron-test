
# Plan: Separar indicador "Maleta" en dos categorías

## Problema Actual
El badge "Maleta" en verde muestra el total combinado de todos los paquetes asignados a un viaje, sin distinguir entre:
- Paquetes pendientes de confirmación (cotización enviada, esperando pago)
- Paquetes ya pagados (en proceso de compra, tránsito, etc.)

## Solución Propuesta
Crear dos indicadores separados con colores distintos:

1. **"Pendiente"** (amarillo/naranja): Total de paquetes en estados pre-pago
   - `matched`, `quote_sent`, `payment_pending`, `payment_pending_approval`
   
2. **"Confirmado"** (verde): Total de paquetes ya pagados
   - `paid`, `pending_purchase`, `in_transit`, `received_by_traveler`, `pending_office_confirmation`, `delivered_to_office`, `completed`

## Cambios Técnicos

### Archivo: `src/components/admin/AdminMatchDialog.tsx`

1. **Crear nueva función** para calcular totales por categoría:

```typescript
const calculateTripPackagesTotals = (tripId: string) => {
  const pendingStatuses = ['matched', 'quote_sent', 'payment_pending', 'payment_pending_approval'];
  const confirmedStatuses = ['paid', 'pending_purchase', 'in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'];
  
  const tripPackages = packages.filter(pkg => pkg.matched_trip_id === tripId);
  
  let pendingTotal = 0;
  let confirmedTotal = 0;
  
  tripPackages.forEach(pkg => {
    const value = calculatePackageValue(pkg);
    if (pendingStatuses.includes(pkg.status)) {
      pendingTotal += value;
    } else if (confirmedStatuses.includes(pkg.status)) {
      confirmedTotal += value;
    }
  });
  
  return { pendingTotal, confirmedTotal };
};
```

2. **Actualizar UI** para mostrar ambos indicadores:

```text
Antes:
┌──────────────┐
│ Maleta       │  (verde)
│ $387.87      │
└──────────────┘

Después:
┌──────────────┐  ┌──────────────┐
│ Pendiente    │  │ Confirmado   │  
│ $150.00      │  │ $237.87      │
│ (amarillo)   │  │ (verde)      │
└──────────────┘  └──────────────┘
```

## Detalles de Implementación

- Aplicar en las dos secciones donde aparece "Maleta" (líneas ~954 y ~1137)
- Solo mostrar cada badge si el total correspondiente es > 0
- Mantener el diseño compacto para no afectar el espacio horizontal

## Resultado Visual Esperado

| Estado del viaje | Indicadores mostrados |
|------------------|----------------------|
| Solo paquetes pendientes | 🟡 "Pendiente $X" |
| Solo paquetes confirmados | 🟢 "Confirmado $X" |
| Ambos tipos | 🟡 "Pendiente $X" + 🟢 "Confirmado $X" |
| Sin paquetes | (ninguno) |
