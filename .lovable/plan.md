

## Mostrar indicador de Tip Booster en Órdenes de Pago

### Problema
Cuando un viajero solicita pago con un Tip Booster activo, el admin no puede distinguir qué parte del monto es boost vs tips base.

### Solución
En `CompactOrderRow` dentro de `AdminTravelerPaymentsTab.tsx`, consultar el `trip_payment_accumulator` para obtener el `boost_amount` y mostrarlo visualmente cuando sea > 0.

### Implementación

**Archivo: `src/components/admin/AdminTravelerPaymentsTab.tsx`**

1. **Fetch boost_amount**: En `CompactOrderRow`, agregar un `useEffect` que consulte `trip_payment_accumulator` por `trip_id` y `traveler_id` del order para obtener `boost_amount`.

2. **Mostrar en la columna Monto** (líneas ~301-311): Debajo del monto total, si hay boost > 0, mostrar un indicador:
```tsx
{boostAmount > 0 && (
  <div className="text-xs text-purple-600 flex items-center justify-end gap-1">
    <Rocket className="h-3 w-3" />
    Incluye boost +Q{boostAmount.toFixed(2)}
  </div>
)}
```

3. **Mostrar en el desglose expandido** (líneas ~392-395): Después del total de compensaciones, agregar línea de boost:
```tsx
{boostAmount > 0 && (
  <div className="flex justify-between items-center">
    <span className="text-sm flex items-center gap-1">
      <Rocket className="h-3.5 w-3.5 text-purple-500" />
      Tip Boost
    </span>
    <span className="text-sm font-semibold text-purple-600">+Q{boostAmount.toFixed(2)}</span>
  </div>
)}
```

4. **Import**: Agregar `Rocket` de lucide-react.

### Notas
- La consulta al accumulator es ligera (una fila por trip/traveler).
- El boost se muestra en púrpura para diferenciarlo del verde de tips base.
- Compatible con órdenes históricas: si no hay accumulator, simplemente no muestra nada.

