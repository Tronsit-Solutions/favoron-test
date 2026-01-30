
## Corregir selector de país de origen en modal de edición de paquetes

### Problema identificado
El modal `PackageDetailModal.tsx` usa una lista estática de países de origen que NO incluye Guatemala:
```typescript
const purchaseOrigins = [
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Otro', label: 'Otro' }
];
```

El formulario de creación (`PackageRequestForm.tsx`) SÍ tiene la lógica correcta con dos listas separadas.

### Solución
Agregar la misma lógica condicional del formulario de creación al modal de edición:

1. **Crear dos listas de orígenes** en `PackageDetailModal.tsx`:
   - `onlinePurchaseOrigins`: USA, España, México, Otro (compras de tiendas extranjeras)
   - `personalPackageOrigins`: Guatemala, USA, España, México, Otro (paquetes que pueden estar localmente)

2. **Usar el campo `request_type` del paquete** para determinar qué lista mostrar:
   - Si `request_type === 'personal'` -> mostrar `personalPackageOrigins` (incluye Guatemala)
   - Si `request_type === 'online'` -> mostrar `onlinePurchaseOrigins` (sin Guatemala)

### Detalle técnico

**Archivo a modificar:** `src/components/admin/PackageDetailModal.tsx`

**Cambios:**
```typescript
// Reemplazar la constante actual (líneas 13-18)
// De:
const purchaseOrigins = [
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Otro', label: 'Otro' }
];

// A:
const onlinePurchaseOrigins = [
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Otro', label: 'Otro' }
];

const personalPackageOrigins = [
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Otro', label: 'Otro' }
];
```

**En el render del Select (~línea 1156):**
```typescript
// Cambiar de:
{purchaseOrigins.map((origin) => ...)}

// A:
{(pkg?.request_type === 'personal' ? personalPackageOrigins : onlinePurchaseOrigins).map((origin) => ...)}
```

### Resultado esperado
- Pedidos personales: mostrarán Guatemala, Estados Unidos, España, México, Otro
- Compras online: mostrarán Estados Unidos, España, México, Otro (sin Guatemala)

Esto mantiene paridad con el formulario de creación de paquetes y respeta la lógica de negocio donde los pedidos personales pueden originarse localmente.
