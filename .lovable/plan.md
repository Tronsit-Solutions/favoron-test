

## Corregir Dropdown de Ciudades al Editar Destino de Paquete

### Problema Identificado

En `PackageDetailModal.tsx` existe una inconsistencia entre las claves del objeto `citiesByCountry` y los valores de `destinationCountries`:

| `destinationCountries` value | Clave en `citiesByCountry` |
|------------------------------|---------------------------|
| `'Guatemala'` | `'Guatemala'` ✓ |
| `'Estados Unidos'` | `'USA'` ✗ **MISMATCH** |
| `'España'` | `'España'` ✓ |
| `'México'` | `'México'` ✓ |
| `'Otro'` | `'Otro'` ✓ |

Cuando el admin selecciona "Estados Unidos", el código ejecuta:
```javascript
citiesByCountry[selectedDestinationCountry]?.map(...)
// = citiesByCountry['Estados Unidos']
// = undefined
```

Por eso el dropdown de ciudades aparece vacío.

---

### Solución

Cambiar la clave `'USA'` a `'Estados Unidos'` en el objeto `citiesByCountry` para que coincida con el valor del selector de países.

---

### Archivo a Modificar

**`src/components/admin/PackageDetailModal.tsx`** (línea 44)

```diff
const citiesByCountry: Record<string, string[]> = {
  'Guatemala': [
    'Guatemala City', 'Antigua Guatemala', 'Quetzaltenango', 'Escuintla',
    'Cobán', 'Huehuetenango', 'Mazatenango', 'Puerto Barrios',
    'Retalhuleu', 'Zacapa', 'Petén/Flores', 'Otra ciudad'
  ],
-  'USA': [
+  'Estados Unidos': [
    'Miami', 'New York', 'Los Angeles', 'Houston', 'Chicago',
    'San Francisco', 'Dallas', 'Atlanta', 'Phoenix',
    'Las Vegas', 'Orlando', 'Washington D.C.', 'Otra ciudad'
  ],
  'España': [...],
  'México': [...],
  'Otro': ['Otra ciudad']
};
```

---

### Resultado Esperado

1. Admin selecciona "Estados Unidos" como país destino
2. El dropdown de ciudades se llena con: Miami, New York, Los Angeles, Houston, etc.
3. Admin puede seleccionar la ciudad correcta
4. El paquete se guarda con el destino actualizado

