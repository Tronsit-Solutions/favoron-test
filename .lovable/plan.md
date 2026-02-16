

## Marcar en rojo cuando el monto no coincide con el total de compensaciones

### Problema
Actualmente, el monto de la orden de pago (`order.amount`) siempre se muestra en verde, aunque no coincida con la suma real de compensaciones de los paquetes del viaje. En el ejemplo de Jessica Borrayo, el monto es Q250 pero el total de compensaciones es Q370.

### Cambio

**Archivo:** `src/components/admin/AdminTravelerPaymentsTab.tsx`

1. **Comparar `order.amount` con `totalCompensation`** dentro de `CompactOrderRow`. Si no coinciden, mostrar el monto en rojo en lugar de verde.

2. **Mover el calculo de `totalCompensation` antes del return** (ya esta asi) y agregar una variable `amountMismatch`:
```text
const amountMismatch = totalCompensation > 0 && Math.abs(order.amount - totalCompensation) > 0.01;
```

3. **Cambiar el color del monto** en la celda de la tabla (linea ~303):
   - Si `amountMismatch` es true: clase `text-red-600` en lugar de `text-green-600`
   - Agregar un tooltip o icono de alerta indicando la discrepancia

4. **Tambien marcar el total en la seccion expandida** para que sea evidente la diferencia entre ambos montos.

### Detalle tecnico

- En la celda del monto (linea 301-305), cambiar la clase condicionalmente:
  ```text
  className={`font-bold text-lg ${amountMismatch ? 'text-red-600' : 'text-green-600'}`}
  ```
- Agregar un icono `AlertCircle` junto al monto cuando hay discrepancia
- Nota: El calculo de `totalCompensation` en la linea 258 usa `pkg.quote?.price` del `historical_packages`. Esto es correcto para comparar contra el monto snapshot de la orden. No se debe cambiar a `getActiveTipFromPackage` aqui porque los historical_packages son datos guardados al momento de crear la orden.

### Archivos a modificar
- `src/components/admin/AdminTravelerPaymentsTab.tsx`

