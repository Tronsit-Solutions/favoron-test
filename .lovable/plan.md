

## Agregar Opción "Cualquier Ciudad" al Selector de Destino

### Resumen

Agregar la opción "Cualquier ciudad" al inicio del dropdown de ciudades en el modal de edición de paquetes del admin, permitiendo seleccionar un país sin especificar una ciudad exacta.

---

### Cambio a Realizar

**Archivo**: `src/components/admin/PackageDetailModal.tsx` (líneas 38-60)

Agregar "Cualquier ciudad" como primera opción en todos los arrays de ciudades:

```typescript
const citiesByCountry: Record<string, string[]> = {
  'Guatemala': [
    'Cualquier ciudad', 'Guatemala City', 'Antigua Guatemala', 'Quetzaltenango', 'Escuintla',
    'Cobán', 'Huehuetenango', 'Mazatenango', 'Puerto Barrios',
    'Retalhuleu', 'Zacapa', 'Petén/Flores', 'Otra ciudad'
  ],
  'Estados Unidos': [
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

| Antes | Después |
|-------|---------|
| Miami, New York, Los Angeles... | **Cualquier ciudad**, Miami, New York, Los Angeles... |

El admin podrá seleccionar "Cualquier ciudad" cuando:
- El shopper no especificó una ciudad exacta
- El paquete puede ir a cualquier lugar dentro del país
- Se necesita flexibilidad para el matching de viajes

