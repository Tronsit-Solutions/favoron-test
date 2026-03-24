

## Mostrar Tip Booster en el TripTipsModal

### Problema
1. El TripTipsModal no muestra información del tip booster — el viajero no sabe que tiene un boost activo
2. El boost se aplica recién al crear el acumulador (`applyPendingBoostCode`), que se llama al solicitar cobro. Si el viajero aún no solicitó cobro, el boost no se ha calculado ni mostrado

### Cuándo se aplica el boost (flujo actual)
- El viajero o admin guarda un `boost_code` en `trips.boost_code`
- Al crear/actualizar el acumulador (botón "Solicitar cobro"), se llama `applyPendingBoostCode` que ejecuta el RPC `validate_boost_code`
- El RPC inserta en `boost_code_usage` y actualiza `trip_payment_accumulator.boost_amount`

### Solución

**Archivo: `src/components/dashboard/TripTipsModal.tsx`**

#### 1) Obtener info del boost para mostrar en el modal
- Si ya existe `tripPayment?.boost_amount > 0`: usar ese valor directamente
- Si no hay acumulador pero `trip.boost_code` existe: mostrar que hay un boost pendiente de aplicar (se aplicará al solicitar cobro)
- Fetch del boost code details (tipo y valor) desde `boost_codes` table usando `trip.boost_code` para mostrar el badge descriptivo

#### 2) Agregar sección de desglose en el total
Cambiar la sección de "Total tips de shoppers" para mostrar un desglose:

```
Tips de shoppers:           Q100.00
🚀 Tip Booster (20%):     + Q20.00
────────────────────────────────────
Total a cobrar:             Q120.00
```

- Si el boost ya está aplicado (`tripPayment.boost_amount > 0`): mostrar el monto real
- Si hay boost_code pendiente pero no aplicado: calcular un estimado basado en el tipo de boost (fijo o porcentual) y mostrarlo como "estimado" con texto muted

#### 3) Actualizar el botón de "Solicitar cobro"
- El monto mostrado en el botón debe incluir el boost (si ya se conoce)
- `Solicitar cobro Q120.00` en lugar de `Q100.00`

### Cambios específicos

1. **Estado nuevo**: `boostInfo` con `{ amount, type, value, pending }` obtenido de `boost_code_usage` + `boost_codes` o estimado desde `trip.boost_code`
2. **Fetch adicional en `fetchPackageDetails`**: consultar `boost_codes` si `trip.boost_code` existe para obtener tipo/valor del boost
3. **UI**: Reemplazar el bloque simple de total (líneas 230-240) con desglose que incluya tips base + boost + total
4. **Botón**: Usar `totalTipsFromPackages + boostAmount` como monto del botón

### Archivo
- **Modificar**: `src/components/dashboard/TripTipsModal.tsx`

