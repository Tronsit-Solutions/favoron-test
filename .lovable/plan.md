
## Eliminar filtro `.not('quote', 'is', null)` de la edge function

### Problema
La edge function `recalculate-trip-accumulator` filtra paquetes donde `quote IS NULL` (linea 88). Esto excluye paquetes que no tienen quote pero si tienen `products_data` con `adminAssignedTip` o `admin_assigned_tip` a nivel de paquete.

En el caso de Sabrina Castaneda, el paquete `218f40ad` tiene Q250 en tips de productos pero `quote: null`, por lo que se excluye del calculo y solo se acumulan Q160 en vez de Q410.

### Causa raiz
El filtro `.not('quote', 'is', null)` era necesario cuando el unico metodo de calculo era `quote.price`. Ahora que la funcion `getActiveTipFromPackage` tiene 3 niveles de fallback (products_data -> admin_assigned_tip -> quote.price), el filtro es innecesario y contraproducente.

### Cambio

**Archivo:** `supabase/functions/recalculate-trip-accumulator/index.ts`

Eliminar la linea 88 (`.not('quote', 'is', null)`).

Tambien verificar el hook del cliente `useCreateTripPaymentAccumulator.tsx` para confirmar que no tiene el mismo filtro.

### Verificacion

Despues de desplegar, ejecutar la edge function nuevamente para el viaje `51a73d73` y confirmar que devuelve:
- `accumulatedAmount: 410`
- `deliveredPackagesCount: 3`

### Impacto
Este mismo filtro podria estar afectando a otros viajeros con paquetes sin quote pero con tips asignados via productos o admin_assigned_tip.
