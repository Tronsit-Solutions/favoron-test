

## Fix: Paquetes confirmados no aparecen en AdminMatchDialog

### Problema
El screenshot del usuario muestra "0 Paquetes en este Viaje" a pesar de que hay paquetes asignados. Mi plan anterior proponía quitar el filtro de timer, pero el usuario aclara: **los paquetes con timer expirado NO deben contar** — ya no están activos para ese viaje.

### Causa raíz real
La lógica actual (línea 616) es correcta en su intención: solo muestra paquetes con timer activo o post-pago. Si aparecen 0 paquetes, es porque:
- Los paquetes están en estado `matched`/`quote_sent` con timers expirados (correctamente excluidos)
- Los paquetes están en bidding (`bid_pending`/`bid_submitted`) — estos SÍ se traen via assignments (línea 599-603) pero **solo se muestran si el segundo fetch funciona**

El problema real es probablemente que los paquetes están en la sección de **bidding** (assignments) pero la UI no los distingue claramente, o el conteo de "Paquetes en este Viaje" solo cuenta `filtered` (directos) y no incluye `biddingPkgs`.

Necesito ver cómo se muestra el conteo en la UI para confirmar.

### Solución — `src/components/admin/AdminMatchDialog.tsx`

1. **Verificar el conteo**: El título "Paquetes en este Viaje" probablemente usa `travelerPackages.length`. Si `filtered` está vacío (timers expirados) y `biddingPkgs` tiene datos, el total debería ser correcto ya que línea 647 concatena ambos. El issue puede ser que los assignments tampoco retornan datos (quizás RLS o estado incorrecto).

2. **Asegurar que el conteo incluya ambas categorías**: Confirmar que la UI muestra `travelerPackages.length` que ya incluye ambos arrays.

3. **Agregar logging temporal** para debug: Si el query de assignments no retorna datos, verificar que los assignments existen con el status correcto.

### Cambio concreto
Dado que los matched con timer expirado NO cuentan (correcto), el fix real es **no cambiar el filtro**. En su lugar, investigar por qué los bidding packages tampoco aparecen. Lo más probable es que el viaje tenga paquetes con `matched_trip_id` seteado pero con timer expirado, y no tenga assignments activos — en cuyo caso 0 es correcto.

**Pregunta para el usuario**: ¿Puedes confirmar si ese viaje tiene paquetes con assignments activos (`bid_pending`/`bid_submitted`) en la tabla `package_assignments`? Si los paquetes tienen `matched_trip_id` pero timer expirado y no hay assignments activos, entonces 0 es el resultado correcto — esos paquetes deberían haber vuelto a `approved` por el sistema de expiración automática.

