
## Corregir Dropdown de Ciudades en Formulario de Solicitud de Paquetes

### Problema Identificado

En `PackageRequestForm.tsx` existe la misma inconsistencia que corregimos en `PackageDetailModal.tsx`:

| Selector de países (línea 211) | Objeto citiesByCountry (línea 223) |
|--------------------------------|-----------------------------------|
| `'Estados Unidos'` | `'USA'` ✗ **NO COINCIDEN** |

Cuando el usuario selecciona "Estados Unidos", el código busca `citiesByCountry['Estados Unidos']` pero la clave es `'USA'`, retornando `undefined`.

---

### Solución

Cambiar la clave `'USA'` a `'Estados Unidos'` y agregar "Cualquier ciudad" como primera opción en todos los países (para mantener paridad con el modal de admin).

---

### Archivo a Modificar

**`src/components/PackageRequestForm.tsx`** (líneas 217-239)

**Código actual:**
```typescript
const citiesByCountry: Record<string, string[]> = {
  'Guatemala': [
    'Guatemala City', 'Antigua Guatemala', ...
  ],
  'USA': [  // ← CLAVE INCORRECTA
    'Miami', 'New York', ...
  ],
  'España': [...],
  'México': [...],
  'Otro': ['Otra ciudad']
};
```

**Código corregido:**
```typescript
const citiesByCountry: Record<string, string[]> = {
  'Guatemala': [
    'Cualquier ciudad', 'Guatemala City', 'Antigua Guatemala', 'Quetzaltenango', 'Escuintla',
    'Cobán', 'Huehuetenango', 'Mazatenango', 'Puerto Barrios',
    'Retalhuleu', 'Zacapa', 'Petén/Flores', 'Otra ciudad'
  ],
  'Estados Unidos': [  // ← CLAVE CORREGIDA
    'Cualquier ciudad', 'Miami', 'New York', 'Los Angeles', 'Houston', 'Chicago',
    'San Francisco', 'Dallas', 'Atlanta', 'Phoenix',
    'Las Vegas', 'Orlando', 'Washington D.C.', 'Otra ciudad'
  ],
  'España': [
    'Cualquier ciudad', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga',
    'Bilbao', 'Zaragoza', 'Granada', 'Palma de Mallorca',
    'San Sebastián', 'Otra ciudad'
  ],
  'México': [
    'Cualquier ciudad', 'Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún',
    'Tijuana', 'Puebla', 'León', 'Mérida', 'Querétaro',
    'Toluca', 'Otra ciudad'
  ],
  'Otro': ['Cualquier ciudad', 'Otra ciudad']
};
```

---

### Resultado Esperado

1. Usuario selecciona "Estados Unidos" en país destino
2. El dropdown de ciudades muestra: Cualquier ciudad, Miami, New York, Los Angeles, etc.
3. Usuario puede seleccionar la ciudad deseada
4. La solicitud de paquete se crea correctamente
