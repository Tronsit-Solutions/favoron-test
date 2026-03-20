

## Fix: Usuarios asignados no se muestran en el diálogo

### Causa raíz
La query usa un join implícito de PostgREST: `profiles:user_id(first_name, last_name, email)`. Esto requiere una foreign key de `user_custom_roles.user_id` hacia `profiles.id`. Pero la FK apunta a `auth.users(id)`, no a `profiles`. PostgREST no puede resolver el join, devuelve `profiles: null`, y los usuarios aparecen vacíos.

### Solución — `src/pages/AdminRoles.tsx`

Cambiar `openAssignDialog` para hacer dos queries separadas:

1. Query `user_custom_roles` filtrado por `custom_role_id` para obtener los `user_id`s
2. Query `profiles` con `.in('id', userIds)` para obtener nombres y emails
3. Combinar los resultados manualmente

```ts
const { data: assignments } = await supabase
  .from('user_custom_roles')
  .select('id, user_id')
  .eq('custom_role_id', roleId);

if (assignments && assignments.length > 0) {
  const userIds = assignments.map(a => a.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', userIds);

  // Merge assignment id + profile data
}
```

Un cambio en una sola función (~15 líneas).

