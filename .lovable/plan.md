

## Fix: Actualizar delivery fee según municipio seleccionado en el Sheet

### Causa raíz
Los cálculos `recalculatedTotal` y `standardDeliveryFee` (líneas 139-172) usan `packageDetails.cityArea` — el cityArea original del paquete. Cuando el shopper selecciona un municipio en el DeliveryAddressSheet, el nuevo `deliveryAddress.cityArea` **no se usa** para recalcular el precio.

### Solución

**Archivo: `src/components/dashboard/MultiQuoteSelector.tsx`**

1. Crear un `effectiveCityArea` que priorice `deliveryAddress.cityArea` sobre `packageDetails.cityArea`:
```ts
const effectiveCityArea = (selectedDeliveryMethod === 'delivery' && deliveryAddress?.cityArea)
  ? deliveryAddress.cityArea
  : packageDetails.cityArea;
```

2. Reemplazar `packageDetails.cityArea` por `effectiveCityArea` en los dos `useMemo` que calculan precios:
   - `recalculatedTotal` (línea 148)
   - `standardDeliveryFee` (línea 166)

3. Agregar `deliveryAddress` a las dependencias de ambos `useMemo`.

Esto hará que al cambiar el municipio en el Sheet, el delivery fee y el total se recalculen inmediatamente.

