

## Guardar direcciones de entrega en `profiles` (columna jsonb)

### Enfoque
Agregar una columna `saved_addresses jsonb DEFAULT '[]'` a la tabla `profiles`. Cada dirección se almacena como un objeto en el array con: `id`, `label`, `streetAddress`, `cityArea`, `hotelAirbnbName`, `contactNumber`, `isDefault`.

### 1. Migración — Nueva columna en `profiles`

```sql
ALTER TABLE profiles ADD COLUMN saved_addresses jsonb DEFAULT '[]'::jsonb;
```

No se necesitan nuevas tablas ni políticas RLS — la columna hereda las políticas existentes de `profiles`. Hay que verificar que `profile_update_allowed` no bloquee este campo (no está en la lista de campos restringidos).

### 2. `DeliveryAddressSheet.tsx` — Selector de direcciones guardadas + opción de guardar

- Recibir `userId` como prop
- Al abrir, hacer query a `profiles.saved_addresses` donde `id = userId`
- Si hay direcciones guardadas, mostrar botones/chips al inicio para seleccionar una (pre-llena el formulario)
- Agregar checkbox "Guardar esta dirección" con campo de label (Casa, Oficina, etc.)
- Al confirmar con el checkbox activo, hacer `UPDATE profiles SET saved_addresses = ...` agregando la nueva dirección al array

### 3. `MultiQuoteSelector.tsx` — Pasar userId al sheet

- Pasar el `shopperId` como prop `userId` al `DeliveryAddressSheet`

### 4. Perfil del usuario — Sección para gestionar direcciones

- Agregar opción "Direcciones" (icono MapPin) en el grid de navegación de `UserProfile.tsx`
- Nuevo componente `SavedAddressesSection.tsx`: lista de direcciones con opciones de eliminar y marcar como predeterminada
- Botón "Volver al perfil"

### Estructura del jsonb

```json
[
  {
    "id": "uuid",
    "label": "Casa",
    "streetAddress": "15 Avenida 14-44, Zona 10",
    "cityArea": "guatemala_city",
    "hotelAirbnbName": "",
    "contactNumber": "+502 1234-5678",
    "isDefault": true
  }
]
```

### Flujo
1. Shopper abre DeliveryAddressSheet → ve direcciones guardadas arriba como chips
2. Selecciona una → formulario se pre-llena → confirma
3. O llena manualmente → marca "Guardar dirección" → se persiste en profiles
4. Desde perfil puede ver/eliminar direcciones guardadas

