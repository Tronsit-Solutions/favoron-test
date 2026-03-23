

## Fix: RLS error "new row violates row-level security policy" para usuarios de Operaciones

### Causa raíz

La función `has_operations_role()` busca en la tabla `user_roles` un rol llamado `'operations'`, pero el enum `user_role` solo tiene dos valores: `'admin'` y `'user'`. El valor `'operations'` **no existe en el enum**, por lo que la función siempre retorna `false` para usuarios no-admin.

Los usuarios de operaciones (como Vida Villaseñor) están asignados a través del sistema de custom roles (`custom_roles` + `user_custom_roles` + `role_permissions`), no a través de `user_roles`. Esto significa que:
- **SELECT funciona** porque hay otras policies permisivas (ej. "Users can view packages optimized")
- **UPDATE falla** porque la única policy que permite a operaciones hacer updates (`Operations can confirm office delivery`) depende de `has_operations_role()`, que nunca retorna true

### Solución — Migración SQL

Actualizar la función `has_operations_role` para verificar **ambas** fuentes de roles:

```sql
CREATE OR REPLACE FUNCTION public.has_operations_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin en user_roles
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
  OR EXISTS (
    -- Custom role con permiso 'operations'
    SELECT 1
    FROM public.user_custom_roles ucr
    JOIN public.custom_roles cr ON cr.id = ucr.custom_role_id
    JOIN public.role_permissions rp ON rp.custom_role_id = cr.id
    WHERE ucr.user_id = _user_id
      AND rp.permission_key = 'operations'
  )
$$;
```

Esto hace que la función retorne `true` si el usuario:
1. Es admin (en `user_roles`), o
2. Tiene un custom role con el permiso `'operations'`

### Archivos
- **Migración SQL**: actualizar función `has_operations_role`

No se requieren cambios en código frontend - todas las policies RLS ya usan esta función.

