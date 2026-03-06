

## Agregar crédito de referidos al perfil financiero de cada usuario

Agregar una sección en `UserFinancialSummary.tsx` que muestre el crédito de referidos del usuario y en qué pedidos lo ha usado.

### Datos a consultar

En `UserFinancialSummary.tsx`, agregar un `useEffect` que reciba el `userId` y consulte:

1. **Tabla `referrals`**: donde `referrer_id = userId` para calcular:
   - Balance disponible: suma de `reward_amount` donde `status = 'completed'` y `reward_used = false`
   - Recompensas ya usadas: suma donde `reward_used = true`
   - Conteo de referidos completados/pendientes

2. **Tabla `referrals`**: donde `referred_id = userId` para obtener:
   - Descuento de registro (`referred_reward_amount`) y si ya fue usado (`referred_reward_used`)

3. **De los `packages` que ya se reciben como prop**: filtrar los que tienen `referral_credit_applied > 0` para mostrar en qué pedidos se usó crédito.

### Cambios

**`src/components/admin/UserFinancialSummary.tsx`**:
- Agregar prop `userId: string` 
- Agregar `useEffect` para fetch de datos de referrals
- Agregar nueva Card "Crédito de Referidos" con:
  - Grid mostrando: crédito disponible total, como referidor, como referido, ya usado
  - Código de referido del usuario (de `profiles.referral_code` — se puede pasar como prop o consultar)
- Agregar sección "Pedidos con crédito aplicado": lista de paquetes donde `referral_credit_applied > 0`, mostrando descripción del pedido, monto aplicado, y fecha

**`src/components/admin/UserDetailModal.tsx`**:
- Pasar `userId={profileId}` al componente `UserFinancialSummary`

