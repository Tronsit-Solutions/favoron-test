

## Problema: Tarifa de reward incorrecta en referidos

### Diagnóstico

- La tabla `app_settings` tiene `referral_reward_amount = Q20` y `referred_user_discount = Q20`.
- Sin embargo, la columna `reward_amount` en la tabla `referrals` tiene un **default hardcoded de Q30**.
- La función `register_referral` lee el descuento del referido desde `app_settings`, pero **no lee el reward del referidor** — usa el default de la columna (Q30).
- Resultado: todos los referidos existentes tienen `reward_amount = 30` cuando debería ser `20`.

### Solución

1. **Actualizar la función `register_referral`** para leer `referral_reward_amount` desde `app_settings` y usarlo explícitamente en el INSERT, en lugar de depender del default de la columna.

2. **Cambiar el default de la columna** `referrals.reward_amount` de `30` a `20` (como fallback).

3. **Corregir los registros existentes**: UPDATE los 3 referidos que tienen `reward_amount = 30` a `reward_amount = 20`.

### Cambios técnicos

**Migración SQL**:
- `ALTER TABLE referrals ALTER COLUMN reward_amount SET DEFAULT 20;`
- `UPDATE referrals SET reward_amount = 20 WHERE reward_amount = 30;`
- Recrear `register_referral` para leer ambos valores (`reward_amount` y `referred_discount`) desde `app_settings`.

No se requieren cambios en el frontend — el hook `useAdminReferrals` ya lee los valores directamente de la tabla.

