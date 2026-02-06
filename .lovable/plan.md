

## Agregar mas paises al dropdown de origen de paquetes

### Situacion actual
Los paises de origen estan definidos en dos archivos con listas limitadas:
- `PackageRequestForm.tsx` (formulario publico)
- `PackageDetailModal.tsx` (modal de admin)

Ambos solo incluyen: Estados Unidos, Espana, Mexico, Otro (y Guatemala para pedidos personales).

### Solucion
Agregar Colombia y otros paises frecuentes a ambas listas, manteniendo el formato actual para compatibilidad.

### Cambios tecnicos

#### 1. src/components/PackageRequestForm.tsx (lineas 257-272)

```tsx
// Para compra online - sin Guatemala (tiendas extranjeras)
const onlinePurchaseOrigins = [
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Colombia', label: 'Colombia' },      // NUEVO
  { value: 'Panamá', label: 'Panamá' },          // NUEVO
  { value: 'El Salvador', label: 'El Salvador' }, // NUEVO
  { value: 'Honduras', label: 'Honduras' },      // NUEVO
  { value: 'China', label: 'China' },            // NUEVO
  { value: 'Otro', label: 'Otro' }
];

// Para pedido personal - con Guatemala (paquete puede estar localmente)
const personalPackageOrigins = [
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Colombia', label: 'Colombia' },      // NUEVO
  { value: 'Panamá', label: 'Panamá' },          // NUEVO
  { value: 'El Salvador', label: 'El Salvador' }, // NUEVO
  { value: 'Honduras', label: 'Honduras' },      // NUEVO
  { value: 'China', label: 'China' },            // NUEVO
  { value: 'Otro', label: 'Otro' }
];
```

#### 2. src/components/admin/PackageDetailModal.tsx (lineas 15-29)

Mismos cambios que arriba para mantener consistencia entre el formulario publico y el admin.

### Paises a agregar
- **Colombia** - Solicitado por el usuario
- **Panama** - Frecuente para compras en la region
- **El Salvador** - Pais vecino con comercio frecuente
- **Honduras** - Pais vecino
- **China** - Origen comun de compras online

### Compatibilidad
- Se mantiene el formato `{ value: 'Pais', label: 'Pais' }` existente
- No afecta datos existentes en la base de datos
- "Otro" permanece al final para casos no cubiertos
