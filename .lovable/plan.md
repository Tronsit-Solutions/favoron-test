

## Sistema Dinámico de Roles y Permisos

### Concepto
En lugar de hardcodear roles como `manager`, crear un sistema flexible donde desde el admin puedas:
1. Crear roles personalizados (ej: "Marketing", "Soporte", "Manager")
2. Asignarles permisos específicos con checkboxes (ej: ver descuentos, ver encuestas, etc.)
3. Asignar esos roles a usuarios

### Arquitectura

**No se toca el enum `user_role` existente** (admin/user/operations siguen funcionando igual). Se agrega un sistema de permisos paralelo.

#### Nuevas tablas

```text
custom_roles
├── id (uuid)
├── name (text) — "Marketing", "Soporte", etc.
├── description (text)
├── created_at, updated_at

role_permissions
├── id (uuid)
├── role_id (fk → custom_roles)
├── permission_key (text) — "discounts", "surveys", "referrals", "cx", "reports", "users", "platform_fees", "delivery_points", "banking", "applications", "whatsapp", "operations"

user_custom_roles
├── id (uuid)
├── user_id (uuid)
├── custom_role_id (fk → custom_roles)
├── assigned_by (uuid)
├── assigned_at
```

#### Permission keys (mapean 1:1 a secciones del admin)

| Key | Sección |
|---|---|
| `discounts` | Códigos Promocionales |
| `surveys` | Encuestas |
| `referrals` | Programa de Referidos |
| `cx` | Customer Experience |
| `reports` | Reportes Financieros |
| `users` | Gestión de Usuarios |
| `platform_fees` | Tarifas |
| `delivery_points` | Puntos de Entrega |
| `banking` | Info Bancaria |
| `applications` | Aplicaciones |
| `whatsapp` | WhatsApp |
| `operations` | Operaciones |

### Cambios en código

**1. Migración SQL**
- Crear 3 tablas con RLS (solo admin puede CRUD roles/permisos; usuarios autenticados pueden leer sus propios permisos)
- Crear función `has_permission(_user_id uuid, _permission text)` que verifica si el usuario tiene un custom_role con ese permiso, O si es admin (admin siempre tiene todo)

**2. Hook `useUserPermissions.ts`**
- Query `user_custom_roles` + `role_permissions` para el usuario actual
- Devuelve `hasPermission(key)` y `permissions: string[]`
- Admin automáticamente tiene todos los permisos

**3. Componente `RequirePermission.tsx`**
- Reemplaza `RequireAdmin` en las páginas que necesitan acceso parcial
- Props: `permission="discounts"` — verifica admin OR tiene ese permiso
- Redirige a `/dashboard` si no tiene acceso

**4. Nueva pestaña en AdminControl: "Roles y Permisos"**
- Card que navega a `/admin/roles`
- Página `AdminRoles.tsx` con:
  - **Lista de roles** con nombre, descripción, cantidad de usuarios
  - **Crear/editar rol**: nombre, descripción + grid de checkboxes con todos los permisos
  - **Asignar rol a usuario**: buscador de usuarios + selector de rol

**5. Actualizar páginas admin**
- `AdminDiscounts` → `<RequirePermission permission="discounts">`
- `AdminSurveys` → `<RequirePermission permission="surveys">`
- `AdminReferrals` → `<RequirePermission permission="referrals">`
- `AdminCustomerExperience` → `<RequirePermission permission="cx">`
- Las demás páginas (reports, fees, etc.) también se actualizan
- `AdminControl.tsx`: filtrar cards visibles según permisos del usuario

**6. RLS policies**
- Agregar policies para que usuarios con permiso `discounts` puedan leer/escribir `discount_codes`, etc.
- Usar la función `has_permission()` en las policies

### Resultado
- Natalia: creas rol "Marketing" → check discounts, surveys, referrals, cx → asignas a Natalia
- Futuro: cualquier nuevo rol se crea desde el UI sin tocar código

### Archivos
- **Crear**: `src/pages/AdminRoles.tsx`, `src/components/auth/RequirePermission.tsx`, `src/hooks/useUserPermissions.ts`, `src/components/admin/RoleManager.tsx`
- **Modificar**: `AdminControl.tsx`, `AdminDiscounts.tsx`, `AdminSurveys.tsx`, `AdminReferrals.tsx`, `AdminCustomerExperience.tsx`, `AdminReports.tsx`, `AdminPlatformFees.tsx`, `AdminDeliveryPoints.tsx`, `AdminApplications.tsx`, routing
- **Migraciones**: 1 (3 tablas + función + RLS)

