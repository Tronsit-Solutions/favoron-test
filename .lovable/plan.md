

## Mostrar tips calculados desde paquetes pagados

### Cambio

**`src/components/dashboard/TripCard.tsx`**:

1. Importar `getActiveTipFromPackage` desde `@/utils/tipHelpers`
2. Reemplazar línea 83:
   ```tsx
   // Antes:
   const tipsAmount = tripPayment?.accumulated_amount ?? 0;
   
   // Después:
   const tipsAmount = packages
     .filter(pkg => ['paid', 'in_transit', 'delivered_to_office', 'received_by_traveler', 'pending_office_confirmation', 'ready_for_pickup', 'ready_for_delivery', 'completed'].includes(pkg.status))
     .reduce((sum, pkg) => sum + getActiveTipFromPackage(pkg), 0);
   ```

Esto suma los tips directamente de los paquetes asignados que ya fueron pagados, sin depender del acumulador del `trip_payment`.

