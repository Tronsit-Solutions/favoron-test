

## Fix: Documento no se muestra en tabla de usuarios

### Causa raíz
Los datos de documento (`document_type`, `document_number`) se guardan correctamente en la tabla `profiles` durante el registro. Sin embargo, `useUserManagement` lee estos campos exclusivamente desde `user_financial_data`, donde están vacíos para todos los usuarios recientes.

Los datos en DB lo confirman: los 10 usuarios más recientes con documento tienen valores en `profiles.document_number` pero `user_financial_data.document_number` es NULL.

### Solución — `src/hooks/useUserManagement.tsx`

Agregar `document_type` y `document_number` al SELECT de `profiles` en las 3 queries (fetchUsers, searchUsersInDatabase, loadMore), y usarlos como fuente primaria con fallback a `user_financial_data`:

```ts
// En el merge de datos:
document_type: profile.document_type || financial?.document_type,
document_number: profile.document_number || financial?.document_number,
```

Esto se aplica en las líneas donde se construye `profilesWithRoles` (~líneas 120, 175, 225).

### Archivos
- **Modificar**: `src/hooks/useUserManagement.tsx` — agregar `document_type, document_number` al SELECT de profiles y priorizar esos valores sobre los de `user_financial_data`

