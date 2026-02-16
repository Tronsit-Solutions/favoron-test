
## Corregir inconsistencias en el calculo de tips para ordenes de pago

### Problema

Hay 4 lugares que calculan el monto acumulado de tips para viajeros, y solo 1 esta correcto. Los otros 3 no incluyen todos los estados post-entrega (`ready_for_pickup`, `ready_for_delivery`) y no excluyen productos cancelados.

### Donde esta cada calculo

| Lugar | Estados para sumar tips | Excluye cancelados | Correcto? |
|---|---|---|---|
| `useCreateTripPaymentAccumulator.tsx` (cliente) | completed, delivered_to_office, ready_for_pickup, ready_for_delivery | Si (usa `getActiveTipFromPackage`) | Si |
| `recalculate-trip-accumulator/index.ts` (edge function) | completed, delivered_to_office | No (usa `quote.price` directo) | **No** |
| `admin_confirm_office_delivery` (funcion SQL) | completed, delivered_to_office | No (usa `quote->>'price'` directo) | **No** |
| `AdminTravelerPaymentsTab.tsx` (UI admin) | Todos los post-entrega | Si (usa `getActiveTipFromPackage`) | Si |

### Cambios necesarios

**1. Edge Function `recalculate-trip-accumulator/index.ts`**

- Agregar `ready_for_pickup` y `ready_for_delivery` al filtro de paquetes entregados (linea 48)
- Agregar `ready_for_pickup` y `ready_for_delivery` al filtro de paquetes totales elegibles (linea 86)
- Agregar `products_data` y `admin_assigned_tip` al SELECT (linea 46)
- Replicar la logica de `getActiveTipFromPackage` inline (la edge function no puede importar utilidades del cliente):
  - Si hay `products_data`, sumar solo `adminAssignedTip` de productos no cancelados
  - Fallback a `admin_assigned_tip` del paquete
  - Fallback final a `quote.price`
- Agregar verificacion de `admin_confirmation` para `ready_for_pickup` y `ready_for_delivery` (estos estados implican confirmacion previa, asi que se cuentan directamente)

**2. Migracion SQL para `admin_confirm_office_delivery`**

Crear nueva migracion que actualice la funcion para:
- Agregar `ready_for_pickup` y `ready_for_delivery` a la consulta de paquetes entregados (linea 96)
- Agregar `ready_for_pickup` y `ready_for_delivery` a la consulta de paquetes totales (linea 104)
- Cambiar el calculo de tip para considerar productos cancelados:
  - Si `products_data` existe y tiene productos, sumar solo `adminAssignedTip` de productos donde `cancelled` no es `true`
  - Fallback a `admin_assigned_tip` si es mayor que 0
  - Fallback final a `quote->>'price'`
- Excluir paquetes con `incident_flag = true` (ya se hace en el cliente pero no en la funcion SQL)

### Resultado esperado

Todos los calculos de tips en la plataforma usaran la misma logica:
1. Mismos estados considerados como "entregado"
2. Mismos estados considerados como "elegible"  
3. Exclusion consistente de productos cancelados
4. Exclusion consistente de paquetes con incidencia
