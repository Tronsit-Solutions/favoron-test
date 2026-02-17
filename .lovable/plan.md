

## Corregir dropdown de Ciudad/Municipio segun pais de destino

### Problema
El formulario `AddressForm` siempre muestra los municipios de Guatemala (`GUATEMALA_MUNICIPALITIES`) sin importar el pais de destino. Si el destino es Madrid, Espana, el dropdown deberia mostrar provincias de Espana, no municipios guatemaltecos.

### Solucion

**1. Agregar provincias de Espana en `src/lib/cities.ts`**

Crear una nueva constante `SPAIN_PROVINCES` con las provincias principales de Espana (Madrid, Barcelona, Valencia, Sevilla, etc.) con un formato similar a `GUATEMALA_MUNICIPALITIES`.

**2. Hacer `AddressForm` dinamico segun el pais**

- Agregar una prop `destinationCountry` al componente `AddressForm`
- Segun el pais, mostrar la lista correcta de municipios/provincias:
  - Guatemala: `GUATEMALA_MUNICIPALITIES` (comportamiento actual con Q25/Q60)
  - Espana: `SPAIN_PROVINCES`
  - Otros paises: campo de texto libre en lugar de dropdown
- Cambiar las etiquetas contextuales:
  - Guatemala: "Ciudad/Municipio" con nota de precios Q25/Q60
  - Espana: "Provincia" sin nota de precios
  - Otros: "Ciudad/Provincia" como campo de texto

**3. Pasar el pais desde `PackageRequestForm`**

En la linea donde se renderiza `<AddressForm>`, agregar la prop `destinationCountry={selectedCountry}` para que el formulario sepa que lista mostrar.

### Detalle tecnico

| Archivo | Cambio |
|---------|--------|
| `src/lib/cities.ts` | Agregar constante `SPAIN_PROVINCES` con las provincias de Espana |
| `src/components/AddressForm.tsx` | Recibir prop `destinationCountry`, seleccionar lista de opciones segun pais, adaptar etiquetas y notas de precio |
| `src/components/PackageRequestForm.tsx` | Pasar `destinationCountry={selectedCountry}` al componente AddressForm |

