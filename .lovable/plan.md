

## Agregar Q60 de crédito de referidor a Héctor Beteta

**Usuario encontrado:** Héctor Beteta (`hectorbetetab@gmail.com`, ID: `62453e32-...`)

### Acción
Insertar un registro en la tabla `referrals` con:
- `referrer_id` = Héctor Beteta (él recibe el crédito)
- `referred_id` = usuario admin (como placeholder, ya que el campo es NOT NULL)
- `status` = `completed`
- `reward_amount` = 60
- `reward_used` = false
- `completed_at` = now()

Esto hará que el hook `useReferralCredit` detecte Q60 disponibles para Héctor, que podrá aplicar como descuento en su próximo pedido.

### Archivo a modificar
Ninguno — es solo una inserción de datos en la base de datos.

