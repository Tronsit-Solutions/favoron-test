

## Fix: `register_referral` function - JSONB cast error

### Problem confirmado
La función `register_referral` tiene este bug en 2 líneas:

```sql
-- FALLA: value es {"amount": 20} (jsonb object), no se puede castear directo a numeric
SELECT COALESCE((value)::numeric, 20) INTO v_reward_amount
SELECT COALESCE((value)::numeric, 20) INTO v_referred_discount
```

### Solución
Corregir ambas líneas para extraer el campo `amount` del objeto jsonb:

```sql
SELECT COALESCE((value->>'amount')::numeric, 20) INTO v_reward_amount
SELECT COALESCE((value->>'amount')::numeric, 20) INTO v_referred_discount
```

### Cambio
**1 migración SQL** que reemplaza la función `register_referral` completa con el fix del cast.

### Paso manual para Santiago
Después de aplicar la migración, registrar manualmente el referido de Santiago desde el panel admin ("Agregar referido"), ya que su registro original falló.

