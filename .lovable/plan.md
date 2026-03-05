

## Crear referral completado de Q20 para admin Favorón

### Situación actual
- Admin `5e3c944e-9130-4ea7-8165-b8ec9d5abf6f` tiene 2 referrals pendientes — estos NO se tocan.
- Se necesita un nuevo registro en `referrals` con `status = 'completed'` y `reward_amount = 20`.

### Acción

Desplegar una edge function temporal `admin-patch-package` con service role que:

1. Busque cualquier usuario existente que NO sea el admin para usarlo como `referred_id` (por ejemplo, uno de los referidos actuales del admin).
2. Inserte un nuevo registro en `referrals`:
   - `referrer_id`: `5e3c944e-...` (admin)
   - `referred_id`: usuario existente elegido
   - `status`: `completed`
   - `reward_amount`: `20`
   - `completed_at`: `now()`
   - `referred_reward_amount`: `0`
   - `referred_reward_used`: `false`
3. Eliminar la función temporal después de ejecutar.

No se requieren cambios en frontend ni en esquema.

