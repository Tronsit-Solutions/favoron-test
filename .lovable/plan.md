
## Agregar los 22 departamentos de Guatemala al dropdown de destino

### Problema actual
El dropdown de ciudades para Guatemala en `PackageRequestForm.tsx` (linea 234-238) solo lista ~12 ciudades/cabeceras seleccionadas. Deberia incluir los 22 departamentos de Guatemala para dar cobertura completa.

### Cambio propuesto

**Archivo: `src/components/PackageRequestForm.tsx`**

Reemplazar la lista actual de ciudades de Guatemala (lineas 234-238) con los 22 departamentos completos, manteniendo "Cualquier ciudad" al inicio y "Otra ciudad" al final:

```text
'Guatemala': [
  'Cualquier ciudad',
  'Guatemala City',
  'Sacatepéquez',
  'Chimaltenango',
  'Escuintla',
  'Santa Rosa',
  'Sololá',
  'Totonicapán',
  'Quetzaltenango',
  'Suchitepéquez',
  'Retalhuleu',
  'San Marcos',
  'Huehuetenango',
  'Quiché',
  'Baja Verapaz',
  'Alta Verapaz',
  'Petén',
  'Izabal',
  'Zacapa',
  'Chiquimula',
  'Jalapa',
  'Jutiapa',
  'El Progreso',
  'Otra ciudad'
],
```

### Notas
- "Guatemala City" se mantiene como valor existente (representa el departamento de Guatemala) para no romper datos historicos.
- "Sacatepequez" reemplaza "Antigua Guatemala" ya que estamos estandarizando por departamento, no por ciudad. Antigua es la cabecera de Sacatepequez.
- "Coban" se elimina como entrada individual ya que queda cubierto por "Alta Verapaz".
- "Mazatenango" se elimina ya que queda cubierto por "Suchitepequez".
- "Puerto Barrios" se elimina ya que queda cubierto por "Izabal".
- "Peten/Flores" se simplifica a "Peten".
- Se mantiene "Cualquier ciudad" al inicio y "Otra ciudad" al final.
- Este cambio solo afecta el formulario de solicitud de paquetes. La lista de `GUATEMALAN_CITIES` en `cities.ts` (usada en el formulario de viajes) se mantiene sin cambios ya que tiene un proposito diferente.
