

## Fix: Boost no se muestra en TripTipsModal — RLS bloquea lectura de boost_codes

### Causa raíz
La tabla `boost_codes` tiene RLS habilitado pero **no tiene ninguna policy de SELECT**. Cuando el `TripTipsModal` intenta consultar `boost_codes` para obtener el tipo/valor del boost, Supabase retorna vacío. El catch silencioso setea `boostInfo = null` y el desglose no se muestra.

### Solución
Crear una migration que agregue una policy de SELECT en `boost_codes` para usuarios autenticados. Solo necesitan leer códigos activos (no necesitan ver todos):

```sql
CREATE POLICY "Authenticated users can read active boost codes"
ON public.boost_codes
FOR SELECT
TO authenticated
USING (is_active = true);
```

### Archivos
- **Crear**: migración SQL con la policy de SELECT para `boost_codes`

### Resultado
Con esta policy, el `TripTipsModal` podrá leer el boost code del viaje y mostrar el desglose: Tips de shoppers + 🚀 Tip Booster (5%) + Total a cobrar.

