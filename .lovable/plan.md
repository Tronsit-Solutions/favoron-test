

## Agregar crédito de referidos en QuoteEditModal (admin)

### Situacion actual

El `QuoteEditModal` ya tiene una seccion de "Codigo de Descuento" (lineas 361-407) donde el admin puede aplicar codigos promocionales. El credito de referidos es un mecanismo separado que actualmente solo el shopper puede activar desde `QuotePaymentStep` y `ShopperPaymentInfoModal` usando el componente `ReferralCreditToggle`.

La infraestructura ya existe:
- Campo `referral_credit_applied` en la tabla `packages`
- Campos `referralCreditApplied` y `referralCreditAmount` en el quote JSONB
- `getQuoteValues()` ya suma `referralCreditAmount` al descuento total automaticamente
- Hook `useReferralCredit` obtiene el saldo disponible del usuario
- RPC `mark_referral_credit_used` para marcar creditos como usados

### Plan

**Modificar `QuoteEditModal.tsx`** — Agregar seccion de credito de referidos debajo del codigo de descuento:

1. Consultar el saldo de referidos del **shopper** (no del admin) usando una query directa a `get_my_referrals` y `get_my_referred_reward` con el `user_id` del paquete (ya que el hook `useReferralCredit` usa el usuario logueado, no el shopper)
2. Si el shopper tiene credito disponible, mostrar un toggle similar al `ReferralCreditToggle` con el monto disponible y el monto aplicable
3. El monto aplicable = `min(creditoDisponible, subtotalFavoron - descuentoCodigo)`
4. Al guardar, incluir `referralCreditApplied: true`, `referralCreditAmount` en el quote JSONB, y actualizar `referral_credit_applied` en el paquete

**Modificar `useQuoteManagement.tsx`** — Extender `QuoteUpdateParams` para aceptar `referralCreditAmount` opcional, incluirlo en el quote JSONB y actualizar la columna `referral_credit_applied` del paquete. Llamar a `mark_referral_credit_used` si se aplico credito.

### UI

Debajo de la seccion de codigo de descuento, una nueva seccion con borde superior:
- Icono Gift + "Credito de Referidos del Shopper"
- Si tiene saldo: mostrar monto disponible + switch para activar/desactivar
- Si no tiene saldo: texto gris "Sin credito disponible"
- El total final se recalcula incluyendo ambos descuentos

### Archivos a modificar
- `src/components/admin/QuoteEditModal.tsx` — UI de credito de referidos + query de saldo del shopper
- `src/hooks/useQuoteManagement.tsx` — Persistir referralCredit en quote y columna

