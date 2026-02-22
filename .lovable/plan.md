

## Fix: Tip de compensacion muestra Q90 en vez de Q75 (no excluye productos cancelados)

### Problema
En el tab de pagos a viajeros ("Detalle de Compensaciones"), cada paquete muestra el tip usando `quote.price` directamente, que es el valor original sin descontar productos cancelados. En el caso del pedido de Makeup (106aac44), `quote.price = Q90` pero el producto "Makeup Amarillo" (Q15) fue cancelado, por lo que deberia mostrar Q75.

El mismo error afecta:
1. El tip por paquete individual en la lista (linea 358)
2. El total de compensaciones (linea 239)
3. La comparacion de mismatch entre monto pagado y compensacion total (linea 240)

### Solucion
Reemplazar `parseFloat(pkg.quote?.price || 0)` con `getActiveTipFromPackage(pkg)` en ambos lugares. Esta funcion ya existe, ya esta importada en el archivo, y ya se usa correctamente en la seccion expandida de detalle por producto (linea 831). Solo falta usarla en la seccion de resumen colapsada.

### Detalles tecnicos

**Archivo: `src/components/admin/AdminTravelerPaymentsTab.tsx`**

- **Linea 239**: Cambiar el calculo de `totalCompensation`:
  - De: `packages.reduce((sum, pkg) => sum + parseFloat(pkg.quote?.price || 0), 0)`
  - A: `packages.reduce((sum, pkg) => sum + getActiveTipFromPackage(pkg), 0)`

- **Linea 358**: Cambiar el display por paquete:
  - De: `Q{parseFloat(pkg.quote?.price || 0).toFixed(2)}`
  - A: `Q{getActiveTipFromPackage(pkg).toFixed(2)}`

Ambos cambios usan la funcion `getActiveTipFromPackage` que ya esta importada en linea 18 del mismo archivo y que correctamente suma solo los `adminAssignedTip` de productos no cancelados.

### Resultado esperado
- El pedido de Makeup mostrara Q75.00 en vez de Q90.00
- El total de compensaciones se reducira de Q520 a Q505 (que coincide con el monto real del acumulador)
- El indicador de "mismatch" entre monto pagado y compensacion total sera mas preciso

