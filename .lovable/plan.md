

## Acreditar Q85.50 a Christa Zuñiga como crédito de referido

**Usuario encontrado**: Christa Zúñiga — `72d38ef8-42f9-4984-bc23-ff5671f26892` (christazuniga@gmail.com)

### Acción

Insertar un registro en la tabla `referrals` con:

```sql
INSERT INTO referrals (
  referrer_id,
  referred_id,
  status,
  reward_amount,
  reward_used,
  completed_at,
  referred_reward_amount,
  referred_reward_used
) VALUES (
  '72d38ef8-42f9-4984-bc23-ff5671f26892',  -- Christa como referrer
  '72d38ef8-42f9-4984-bc23-ff5671f26892',  -- mismo ID como placeholder (referred)
  'completed',
  85.50,
  false,
  now(),
  0,
  false
);
```

### Resultado esperado

- Christa verá un saldo disponible de **Q85.50** en su dashboard.
- Podrá aplicarlo como descuento en su próximo paquete al momento del pago.
- El crédito se marcará como `reward_used = true` cuando lo use.

### Archivo a modificar
Ninguno — es solo una operación de datos via SQL insert.

