

## Problema: Todos los shoppers muestran "Sin nombre"

### Causa probable

La query a `profiles` con `.in("id", [...allUserIds])` probablemente falla por dos razones:

1. **RLS restrictivo**: La tabla `profiles` tiene RLS que solo permite acceso a usuarios con el permiso específico `'users'`. Si el admin logueado no tiene ese permiso, la query retorna 0 filas silenciosamente.

2. **Límite de Supabase `.in()`**: Con 1000 paquetes hay potencialmente cientos de user_ids únicos. Supabase tiene un límite práctico en la cantidad de IDs en un `.in()` (~300). Si hay más, la query puede fallar.

### Solución

**`src/hooks/useCancelledPackages.ts`**:

1. **Batching de profiles**: Dividir los user_ids en lotes de 200 y hacer múltiples queries a `profiles`.

2. **Logging de errores**: Agregar `console.warn` si la query de profiles retorna error o 0 resultados para facilitar debugging.

3. **Alternativa si RLS bloquea**: Si el problema es RLS, usar una edge function o RPC que tenga `security definer` para resolver los nombres. Sin embargo, primero verificar si el admin actual tiene el permiso `'users'` — si lo tiene, el batching debería resolver el problema.

### Cambio principal

```typescript
// Dividir en batches de 200
const userIdArray = [...allUserIds];
const BATCH_SIZE = 200;
for (let i = 0; i < userIdArray.length; i += BATCH_SIZE) {
  const batch = userIdArray.slice(i, i + BATCH_SIZE);
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone_number")
    .in("id", batch);
  if (error) console.warn("Profile fetch error:", error);
  if (profiles) {
    profiles.forEach(pr => {
      profileMap[pr.id] = {
        name: `${pr.first_name || ""} ${pr.last_name || ""}`.trim() || "Sin nombre",
        phone: pr.phone_number,
      };
    });
  }
}
```

### Archivo a modificar
- `src/hooks/useCancelledPackages.ts` — reemplazar la sección de fetch profiles (líneas 81-93) con batching

