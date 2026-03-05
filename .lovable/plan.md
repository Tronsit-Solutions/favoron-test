

## Aplicar Códigos de Descuento desde Admin

### Contexto

Actualmente los códigos de descuento solo los puede aplicar el shopper desde el `QuoteDialog` al aceptar la cotización. El admin no tiene forma de aplicar un descuento desde el panel de administración.

Ya existe toda la infraestructura necesaria:
- Tabla `discount_codes` con códigos activos
- Tabla `discount_code_usage` para tracking
- RPC `validate_discount_code` para validar códigos
- El quote JSONB ya soporta campos `discountCode`, `discountCodeId`, `discountAmount`, `originalTotalPrice`, `finalTotalPrice`
- `getQuoteValues()` ya lee y calcula estos campos automáticamente

### Plan

**Modificar `QuoteEditModal.tsx`** para agregar una sección de código de descuento:

1. **Nueva sección en el modal** (debajo del delivery fee, antes del total):
   - Input para ingresar código de descuento
   - Botón "Aplicar" que llama a `validate_discount_code` RPC
   - Si ya hay descuento aplicado, mostrar badge con el código y botón para removerlo
   - Mostrar el monto del descuento y el total final ajustado

2. **Lógica de validación**:
   - Usar el mismo RPC `validate_discount_code` que ya usan los shoppers
   - Pasar el `user_id` del shopper (dueño del paquete) para validar uso único por usuario
   - Calcular descuento sobre el subtotal de Favorón (tip + serviceFee)

3. **Guardar en `useQuoteManagement.tsx`**:
   - Extender `QuoteUpdateParams` para aceptar campos de descuento opcionales (`discountCode`, `discountCodeId`, `discountAmount`, `finalTotalPrice`)
   - Al guardar, incluir estos campos en el objeto `updatedQuote`
   - Registrar el uso del código en `discount_code_usage` vía insert

4. **Mostrar descuento en `PackageDetailModal.tsx`**:
   - Ya existe lógica parcial en `PaymentsTab`. Agregar en la sección de cotización del admin una línea que muestre el descuento aplicado (si existe) entre el total y los demás campos.

### Archivos a modificar

- `src/components/admin/QuoteEditModal.tsx` — Agregar UI de código de descuento
- `src/hooks/useQuoteManagement.tsx` — Extender para guardar datos de descuento y registrar uso
- `src/components/admin/PackageDetailModal.tsx` — Mostrar descuento aplicado en la sección de cotización

