

## Agregar informacion del viaje al modal de orden de pago

### Cambio
Agregar una seccion con origen, destino y fecha de llegada del viaje en el modal "Detalles de la orden de pago" dentro de `AdminTravelerPaymentsTab.tsx`.

### Detalles tecnicos

**Archivo: `src/components/admin/AdminTravelerPaymentsTab.tsx`**

Despues del bloque de "Viajero / Monto" (linea 137) y antes de "Informacion bancaria" (linea 139), insertar una nueva seccion:

```
{order.trips && (
  <div>
    <Label className="text-sm font-medium">Informacion del Viaje</Label>
    <div className="bg-muted/30 rounded p-3 mt-1">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div><span className="font-medium">Origen:</span> {order.trips.from_city}</div>
        <div><span className="font-medium">Destino:</span> {order.trips.to_city}</div>
        <div><span className="font-medium">Fecha llegada:</span> {new Date(order.trips.arrival_date).toLocaleDateString('es-GT')}</div>
      </div>
    </div>
  </div>
)}
```

Los datos del viaje (`from_city`, `to_city`, `arrival_date`) ya estan disponibles en `order.trips` gracias al query de `usePaymentOrders` que hace join con la tabla `trips`. No se necesitan cambios en queries ni hooks.

