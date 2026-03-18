

## Fix: Dropdown de municipios no aparece en DeliveryAddressSheet

### Causa raíz
El query que carga los paquetes del dashboard en `src/hooks/useOptimizedPackagesData.tsx` (línea 107) lista columnas específicas pero **no incluye `package_destination_country`**. Por eso `pkg.package_destination_country` siempre es `undefined`, y el Sheet nunca activa el dropdown.

### Solución

**Archivo: `src/hooks/useOptimizedPackagesData.tsx`**

Agregar `package_destination_country` a la lista de columnas en el `select` (después de `package_destination` en línea 116):

```
package_destination,
package_destination_country,
matched_trip_id,
```

Un cambio de una línea. Con esto, el prop `destinationCountry` llegará como `"Guatemala"` al Sheet, `isGuatemala` será `true`, y el dropdown de municipios se mostrará correctamente.

