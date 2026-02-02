

# Plan: Corregir Selector de Destino para Devoluciones

## Problema Identificado

Cuando el usuario crea una **devolución** (return), el selector de país de destino incluye "Guatemala" como opción, lo cual es incorrecto. Las devoluciones son envíos de Guatemala → Internacional, por lo que el destino NUNCA puede ser Guatemala.

El usuario seleccionó:
- Origen: Guatemala (correcto)
- Destino País: Guatemala (INCORRECTO - debería ser Estados Unidos u otro país)
- Destino Ciudad: Cualquier ciudad

## Solución

### Archivo: `src/components/PackageRequestForm.tsx`

**Cambio 1 - Línea 1133**: Filtrar "Guatemala" del selector de países cuando es una devolución:

```tsx
{/* Antes */}
{destinationCountries.map((country) => (

{/* Después */}
{destinationCountries
  .filter(country => !isReturn || country.value !== 'Guatemala')
  .map((country) => (
```

**Cambio 2 - Efecto colateral**: Resetear `selectedCountry` si el usuario tenía Guatemala seleccionado y luego marca "es devolución":

Agregar efecto después de línea ~214:
```tsx
// Resetear país de destino si es devolución y tenía Guatemala seleccionado
useEffect(() => {
  if (isReturn && selectedCountry === 'Guatemala') {
    setSelectedCountry('');
    handleInputChange('packageDestination', '');
    handleInputChange('packageDestinationOther', '');
  }
}, [isReturn, selectedCountry]);
```

## Resultado Visual

| Tipo | Destinos disponibles |
|------|---------------------|
| Pedido Normal | Guatemala, Estados Unidos, España, México, Otro |
| Devolución | Estados Unidos, España, México, Otro (SIN Guatemala) |

## Datos Existentes

El paquete "PEluche" en la base de datos tiene `package_destination_country = 'guatemala'` incorrecto. Esto deberá corregirse manualmente o el usuario deberá rechazar y recrear la solicitud con el destino correcto.

