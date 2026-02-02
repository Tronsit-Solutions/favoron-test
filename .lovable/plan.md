
# Plan: Agregar País a Destino de Paquetes

## Análisis

Actualmente `package_destination` almacena solo la ciudad. La tabla `trips` usa columnas separadas (`to_country`, `to_city`), por lo que la solución más simple y consistente es seguir ese mismo patrón.

## Solución Recomendada: Nueva columna `package_destination_country`

Esta aproximación es preferible a JSONB porque:
- Consistente con el patrón existente en `trips`
- No requiere parseo de JSON en las consultas
- Queries más eficientes con índices simples
- Retrocompatible (registros existentes quedan con country = NULL)
- Más fácil de migrar datos existentes

## Cambios Necesarios

### 1. Migración de Base de Datos

```sql
-- Agregar nueva columna para país de destino
ALTER TABLE packages 
ADD COLUMN package_destination_country TEXT DEFAULT 'guatemala';

-- Comentario para documentación
COMMENT ON COLUMN packages.package_destination_country IS 'Country key matching src/lib/countries.ts values (e.g., guatemala, estados-unidos, espana)';
```

### 2. Actualizar Tipos TypeScript

**Archivo**: `src/integrations/supabase/types.ts`

La columna se agregará automáticamente al regenerar tipos, pero el campo `package_destination_country` aparecerá en el tipo `packages`.

### 3. Actualizar Formulario de Solicitud

**Archivo**: `src/components/PackageRequestForm.tsx`

Modificar `handleManualSubmit` para incluir el país seleccionado:

```typescript
const submitData: any = {
  ...formData,
  // ... campos existentes ...
  packageDestination: finalDestination,
  packageDestinationCountry: selectedCountry, // NUEVO: agregar país
  purchaseOrigin: finalOrigin,
  // ...
};
```

### 4. Actualizar Dashboard Actions

**Archivo**: `src/hooks/useDashboardActions.tsx` (líneas 61-79)

Agregar el campo del país al crear el paquete:

```typescript
const dbPackageData = {
  // ... campos existentes ...
  package_destination: packageData.packageDestination,
  package_destination_country: packageData.packageDestinationCountry || 'guatemala', // NUEVO
  purchase_origin: packageData.purchaseOrigin,
  // ...
};
```

### 5. Actualizar Lógica de Matching

**Archivo**: `src/components/admin/AdminMatchDialog.tsx`

Actualizar la lógica de filtrado de viajes para usar el nuevo campo de país:

```typescript
// Antes: inferir país de la ciudad
const packageDestinationNormalized = normalizeCountry(selectedPackage?.package_destination || '');

// Después: usar el campo de país directamente
const packageDestinationCountry = selectedPackage?.package_destination_country || 
  normalizeCountry(selectedPackage?.package_destination || ''); // fallback para registros viejos
```

### 6. Actualizar Displays en Admin

**Archivos afectados**:
- `src/components/admin/AdminApprovalsTab.tsx` - Mostrar país + ciudad
- `src/components/admin/AdminPackagesTab.tsx` - Mostrar país + ciudad  
- `src/components/admin/ProductDetailModal.tsx` - Mostrar país + ciudad

Ejemplo de display:
```tsx
<span>
  Destino: {getCountryLabel(pkg.package_destination_country) || pkg.package_destination_country} - {pkg.package_destination}
</span>
```

## Resumen de Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Agregar columna `package_destination_country` |
| `types.ts` | Auto-generado con nueva columna |
| `PackageRequestForm.tsx` | Pasar país en submit data |
| `useDashboardActions.tsx` | Guardar país en DB |
| `AdminMatchDialog.tsx` | Usar país para matching |
| `AdminApprovalsTab.tsx` | Mostrar país + ciudad |
| `AdminPackagesTab.tsx` | Mostrar país + ciudad |

## Compatibilidad Hacia Atrás

Los paquetes existentes tendrán `package_destination_country = 'guatemala'` por defecto, lo cual es correcto para la mayoría de casos históricos. La lógica de matching incluirá fallback para inferir el país de la ciudad si el campo está vacío.
