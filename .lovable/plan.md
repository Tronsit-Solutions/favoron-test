
# Plan: Corregir Carga de País en PackageRequestForm (Edit Mode)

## Problema Identificado

En `src/components/PackageRequestForm.tsx`, línea 122:

```typescript
selectedCountry: '' as string,  // ❌ Siempre vacío, incluso en edit mode
```

Cuando se edita un paquete, el país de destino no se carga desde la base de datos, por lo que al guardar se pierde esta información.

## Solución

### Archivo: `src/components/PackageRequestForm.tsx`

**Cambio en `getInitialFormState()` (línea 122)**:

```typescript
// Antes
selectedCountry: '' as string,

// Después
selectedCountry: (editMode && initialData?.package_destination_country) 
  ? initialData.package_destination_country 
  : '' as string,
```

## Resultado

- **Modo crear**: `selectedCountry` inicia vacío (comportamiento actual)
- **Modo editar**: `selectedCountry` se carga desde `initialData.package_destination_country`
- Al guardar, ambos campos (`package_destination` y `package_destination_country`) se persistirán correctamente
