

## Analisis: Donde guardar el reward del referido

### Opcion 1: Reutilizar la tabla `referrals` (Recomendada)

Agregar columnas a la tabla existente:

```text
referrals (actual)                    referrals (propuesta)
─────────────────────                 ─────────────────────
id                                    id
referrer_id                           referrer_id
referred_id                           referred_id
status                                status
reward_amount (referidor)             reward_amount (referidor)
completed_at                          completed_at
created_at                            created_at
                                      + referred_reward_amount (nuevo)
                                      + referred_discount_code (nuevo)
                                      + referred_reward_used (nuevo)
```

**Ventajas:**
- Todo el contexto de la relacion referidor-referido esta en un solo lugar
- Consultas simples: un solo query para ver ambos lados del incentivo
- El admin ya tiene visibilidad de esta tabla; no hay que integrar otra
- Menos complejidad: no se necesita crear discount_codes separados ni validar codigos

**Como funcionaria:**
- Al registrarse con codigo de referido, se crea el row en `referrals` con `referred_reward_amount = 15` (o lo que configure el admin) y `referred_reward_used = false`
- Cuando el usuario va a pagar su primer pedido, el sistema verifica si tiene un reward pendiente en `referrals` donde `referred_id = auth.uid()` y `referred_reward_used = false`
- Se aplica el descuento automaticamente (sin necesidad de ingresar codigo)

### Opcion 2: Usar `discount_codes` por separado

Crear un codigo en `discount_codes` vinculado al usuario referido.

**Desventajas:**
- El descuento queda desconectado de la relacion de referido
- El usuario tiene que recordar/copiar un codigo para usarlo
- Mas tablas involucradas, mas joins, mas complejidad
- La tabla `discount_codes` no tiene campo `user_id` para vincular a un usuario especifico

### Recomendacion: Opcion 1

Usar la misma tabla `referrals` es mas limpio y practico. Mantiene toda la logica de referidos centralizada y permite aplicar el descuento automaticamente sin que el nuevo usuario tenga que hacer nada extra.

### Cambios necesarios

**Migration SQL:**
- `ALTER TABLE referrals ADD COLUMN referred_reward_amount numeric DEFAULT 0`
- `ALTER TABLE referrals ADD COLUMN referred_reward_used boolean DEFAULT false`
- Actualizar la RPC `register_referral` para leer el monto de `app_settings` key `referred_user_discount` y guardarlo en `referred_reward_amount`

**`src/pages/AdminControl.tsx`:**
- Agregar input para configurar el monto del descuento del referido en `app_settings`

**`src/hooks/useReferrals.tsx`:**
- Agregar funcion para consultar si el usuario actual tiene un reward de referido sin usar

**Flujo de pago (quote/checkout):**
- Verificar si el usuario tiene `referred_reward_used = false` en `referrals` y aplicar descuento automaticamente en su primer pedido

**`src/components/profile/ReferralSection.tsx`:**
- Actualizar mensaje de WhatsApp para reflejar que ambos ganan

