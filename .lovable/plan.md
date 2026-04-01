

## Plan: Agregar opción "Acreditar a cuenta" en reembolsos

### Concepto
Al completar un reembolso, el admin tendrá dos opciones:
1. **Transferencia bancaria** (flujo actual)
2. **Acreditar a cuenta** — inserta un registro en `referrals` con `status='completed'` usando el shopper_id como referrer_id y referred_id (placeholder), dándole crédito disponible para su próximo pedido.

### Cambios

**1. Tabla `refund_orders` — nueva columna (migración)**
- Agregar `refund_method` (`text`, default `'bank_transfer'`) para registrar si el reembolso fue por transferencia o crédito a cuenta.
- Valores: `'bank_transfer'` | `'account_credit'`

**2. AdminRefundsTab.tsx — UI del modal de completar**
- Agregar un selector (radio buttons o toggle) entre "Transferencia bancaria" y "Acreditar a cuenta del shopper"
- Si elige "Acreditar a cuenta": ocultar el campo de comprobante (no aplica), mostrar un mensaje confirmando que se acreditará Q{monto} al saldo del shopper
- Si elige "Transferencia": flujo actual sin cambios

**3. useRefundOrders.tsx — lógica de completar con crédito**
- En `updateRefundStatus`, cuando el método es `'account_credit'`:
  - Insertar un registro en `referrals` con `referrer_id = shopper_id`, `referred_id = shopper_id`, `status = 'completed'`, `reward_amount = monto`, `completed_at = now()` (siguiendo el patrón documentado para acreditar saldo manualmente)
  - Guardar `refund_method = 'account_credit'` en la refund_order
- Cuando es `'bank_transfer'`: flujo actual sin cambios

**4. Indicador visual en tablas y detalle**
- Mostrar un badge o icono que distinga si el reembolso completado fue por transferencia o crédito (ej: icono de banco vs icono de gift/wallet)

### Detalle técnico
- Migración: `ALTER TABLE refund_orders ADD COLUMN refund_method text DEFAULT 'bank_transfer'`
- La inserción en `referrals` se hace directamente desde el frontend con el supabase client (mismo patrón que el crédito manual documentado en memoria)
- El crédito quedará disponible automáticamente porque `useReferralCredit` ya suma `reward_amount` de referrals completados no usados

