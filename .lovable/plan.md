

## Fix: "Días" muestra N/A porque `office_delivery` no se carga en la query admin

### Problema
El campo `office_delivery` **no está incluido** en las queries de `useAdminData.tsx` que cargan los paquetes para el dashboard admin. Por eso, cuando `CompletedPackagesTable` intenta leer `office_delivery.admin_confirmation.confirmed_at`, siempre es `undefined` y todos los paquetes muestran "N/A".

El campo `payment_receipt` sí está incluido, pero `office_delivery` fue omitido.

### Solución
Agregar `office_delivery` a las queries SELECT en **`src/hooks/useAdminData.tsx`**:

1. **Query principal de paquetes** (~línea 105): agregar `office_delivery` junto a `payment_receipt`
2. **Query de paquetes matched** (~línea 207): agregar `office_delivery` al SELECT

Ambas queries alimentan el array `packages` que llega a `CompletedPackagesTable`.

### Detalle técnico
En la línea 105, cambiar:
```
payment_receipt, products_data,
```
a:
```
payment_receipt, office_delivery, products_data,
```

En la línea ~209, agregar `office_delivery` después de `payment_receipt`.

