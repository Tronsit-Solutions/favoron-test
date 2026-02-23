

## Fix: Referral no se registra por restriccion de RLS

### Problema
La funcion `registerReferral` hace un SELECT a la tabla `profiles` buscando el `referral_code` del referidor. Pero las politicas RLS de `profiles` solo permiten que un usuario vea **su propio perfil** (`auth.uid() = id`). Entonces cuando luxi se registra e intenta buscar el perfil del admin por su codigo `9GYTT8`, el query devuelve `null` y el referral no se crea.

### Solucion
Crear una funcion RPC en la base de datos (`register_referral`) que se ejecuta con `SECURITY DEFINER` (permisos elevados), de modo que puede buscar el referral_code en profiles sin restricciones de RLS. Esta funcion:

1. Busca el referrer por `referral_code` en `profiles`
2. Valida que no sea auto-referido
3. Inserta el registro en `referrals`
4. Retorna si fue exitoso o no

### Cambios

**Migracion SQL** - Crear funcion RPC:

```text
CREATE OR REPLACE FUNCTION public.register_referral(
  p_referred_id uuid,
  p_referral_code text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Find referrer by code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN false;
  END IF;

  -- No self-referral
  IF v_referrer_id = p_referred_id THEN
    RETURN false;
  END IF;

  -- Insert referral (ignore duplicates)
  INSERT INTO referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, p_referred_id, 'pending')
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN true;
END;
$$;
```

**`src/hooks/useReferrals.tsx`** - Cambiar `registerReferral` para usar la funcion RPC en lugar de queries directas:

```typescript
export const registerReferral = async (referredUserId: string, referralCode: string) => {
  try {
    const { data, error } = await supabase.rpc('register_referral', {
      p_referred_id: referredUserId,
      p_referral_code: referralCode,
    });

    if (error) throw error;
    return { success: !!data };
  } catch (err) {
    console.error('Error registering referral:', err);
    return { success: false };
  }
};
```

### Despues del fix
Se puede registrar manualmente el referral de luxi ejecutando:

```text
SELECT register_referral(
  'e47d3c41-4425-4e99-9e23-9713b2685476',
  '9GYTT8'
);
```

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Crear funcion `register_referral` con SECURITY DEFINER |
| src/hooks/useReferrals.tsx | Usar `supabase.rpc('register_referral')` en vez de queries directas |

