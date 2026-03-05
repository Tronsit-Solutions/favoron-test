

## Implementar uso de crédito de referidos como descuento en cotizaciones

### Resumen

Permitir que los usuarios (shoppers) apliquen su saldo de referidos como descuento al momento de pagar una cotización. El crédito es **opcional**, se puede aplicar/quitar antes de pagar, y solo se marca como "usado" cuando el pago se confirma (receipt uploaded o card payment success).

### Tipos de crédito

Hay dos fuentes de crédito:
1. **Referrer balance**: suma de `reward_amount` de referrals con `status = 'completed'` donde el usuario es `referrer_id` (ya calculado en `useReferrals`)
2. **Referred reward**: `referred_reward_amount` del registro donde el usuario es `referred_id` y `referred_reward_used = false` (ya en `useReferredReward`)

### Diseño

**Base de datos:**
- Agregar columna `referral_credit_applied` (numeric, nullable) a `packages` para trackear cuánto crédito de referido se aplicó a un paquete
- Crear RPC `use_referral_credit` que: valide el saldo disponible del usuario, aplique el descuento al quote del paquete, y guarde el monto en `referral_credit_applied` -- pero NO marque como usado todavía
- Crear RPC `confirm_referral_credit_usage` que se llame cuando el pago se confirma (desde el trigger existente de payment confirmation o desde `PaymentReceiptUpload`): marca los referrals como `reward_used = true` / reduce el balance, y registra el uso

**Alternativa más simple (recomendada):** En lugar de RPCs complejas, manejar el crédito de forma similar al discount code existente:
- Guardar en el quote JSON: `referralCreditAmount`, `referralCreditApplied: true`
- Al confirmar pago, una función/trigger marca el crédito como consumido

**Frontend - 3 puntos de integración:**

1. **`QuotePaymentStep.tsx`** (wizard de aceptar cotización + pagar): Agregar toggle/botón debajo del discount code para "Usar crédito de referidos (Q20 disponible)". Al activar, recalcula `totalAmount` restando el crédito y guarda en el quote.

2. **`ShopperPaymentInfoModal.tsx`** (modal de pago standalone): Mismo toggle de crédito de referidos.

3. **`PaymentReceiptUpload.tsx`** / trigger de confirmación de pago: Al confirmar pago, ejecutar lógica para marcar el crédito como usado en la tabla `referrals`.

### Flujo del usuario

1. Shopper acepta cotización, ve pantalla de pago
2. Debajo del código de descuento, ve: "💰 Tienes Q20 de crédito de referidos. ¿Usar?" con un switch/botón
3. Al activar, el total se reduce (ej: Q150 → Q130) y se guarda en el quote JSON
4. El shopper puede desactivar el crédito antes de pagar
5. Sube comprobante o paga con tarjeta
6. Al confirmarse el pago → se marca el crédito como usado en `referrals`

### Cambios técnicos

1. **Migración SQL**: 
   - Agregar `referral_credit_applied numeric` a `packages`
   - Crear RPC `mark_referral_credit_used(p_user_id uuid, p_amount numeric, p_package_id uuid)` que deduzca del balance (marca referrals completados como usados hasta cubrir el monto)

2. **Hook `useReferralCredit`**: Nuevo hook que combine el balance de referrer + referred reward disponible para dar el crédito total aplicable

3. **UI en `QuotePaymentStep.tsx` y `ShopperPaymentInfoModal.tsx`**: Componente reutilizable `ReferralCreditToggle` que muestre el saldo disponible y permita aplicar/quitar

4. **Confirmación de uso**: En `PaymentReceiptUpload.tsx` (al confirmar upload) y en el callback de `RecurrenteCheckout` (pago con tarjeta), llamar al RPC para marcar el crédito como consumido

