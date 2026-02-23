

## Mostrar nombre del usuario referido en la lista de pendientes

### Problema actual
La lista de referidos solo muestra la fecha y el estado ("Pendiente"), pero no muestra el nombre del usuario referido. Esto es porque:
1. El hook `useReferrals` solo consulta la tabla `referrals` sin hacer JOIN con `profiles`
2. RLS impide que un usuario vea perfiles de otros usuarios

### Solucion
Crear una funcion RPC `get_my_referrals` con SECURITY DEFINER que devuelva los referidos junto con el nombre del usuario referido, y actualizar el componente para mostrar esa informacion.

### Cambios

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Crear funcion `get_my_referrals` que retorna referidos con nombre |
| `src/hooks/useReferrals.tsx` | Usar la nueva RPC y agregar `referred_name` al tipo `Referral` |
| `src/components/profile/ReferralSection.tsx` | Mostrar el nombre del referido en cada fila de la lista |

### Detalle tecnico

**Migracion SQL** - Nueva funcion RPC:

```text
CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE (
  id uuid,
  referred_id uuid,
  referred_name text,
  status text,
  reward_amount numeric,
  completed_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.referred_id,
    COALESCE(p.first_name || ' ' || p.last_name, 'Usuario') AS referred_name,
    r.status,
    r.reward_amount,
    r.completed_at,
    r.created_at
  FROM referrals r
  LEFT JOIN profiles p ON p.id = r.referred_id
  WHERE r.referrer_id = auth.uid()
  ORDER BY r.created_at DESC;
$$;
```

**`src/hooks/useReferrals.tsx`**:
- Agregar `referred_name: string` a la interfaz `Referral`
- Cambiar el `fetchReferrals` para usar `supabase.rpc('get_my_referrals')` en vez del query directo

**`src/components/profile/ReferralSection.tsx`**:
- En cada fila de referido, mostrar `ref.referred_name` junto a la fecha, para que el usuario vea quien se registro con su codigo

