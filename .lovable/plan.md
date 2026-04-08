

## Agregar campo "Nombre del Shopper" para admins

### Resumen
Agregar una columna `shopper_name_override` a la tabla `packages` y un campo de texto en el formulario de paquetes visible solo para administradores. Cuando tiene valor, las etiquetas usarán este nombre en lugar del perfil del admin.

### Cambios

**1. Migración SQL**
```sql
ALTER TABLE packages ADD COLUMN shopper_name_override TEXT DEFAULT NULL;
```

**2. `src/components/PackageRequestForm.tsx`**
- Extraer `userRole` de `useAuth()` (línea 40)
- Agregar estado `shopperNameOverride` (string)
- En `renderStep1()` (~línea 706), agregar al inicio un campo Input con label "Nombre del Shopper (pedido a nombre de)" — solo visible si `userRole?.role === 'admin'`
- Estilo con borde amber para distinguir como campo admin
- Incluir `shopperNameOverride` en `submitData` (~línea 441)

**3. `src/hooks/useDashboardActions.tsx`**
- Línea ~82: agregar `shopper_name_override: packageData.shopperNameOverride || null` en `dbPackageData`

**4. `src/hooks/useOperationsData.tsx`**
- Línea ~226: cambiar lógica de `shopper_name` para priorizar `row.shopper_name_override` si existe

**5. `src/components/admin/PackageLabel.tsx` y `src/lib/pdfLabelDrawer.ts`**
- En `getShopperName()`: priorizar `pkg.shopper_name_override` antes de las demás fuentes

### Impacto
- Cambio aditivo, no rompe nada existente
- Columna nullable con default null = registros existentes intactos
- Sin cambios en RLS (usa INSERT existente del usuario)

