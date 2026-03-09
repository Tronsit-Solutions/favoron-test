

## Reemplazar descripcion de status por boton + modal en movil

En la vista movil del `CollapsibleTravelerPackageCard`, actualmente se muestra la descripcion completa del status debajo del header colapsado (el bloque `TravelerPackageStatusBadge` con `showFullDescription={true}` en lineas 321-328). Esto ocupa mucho espacio vertical.

### Cambios

**`src/components/dashboard/CollapsibleTravelerPackageCard.tsx`**

1. Agregar estado `showStatusModal` para controlar el modal
2. Reemplazar el bloque de lineas 321-328 (status message mobile) por un boton compacto con el emoji + label del status que al hacer click abre un Dialog
3. Agregar un `Dialog` al final del componente que muestre el `TravelerPackageStatusBadge` con `showFullDescription={true}` dentro

**`src/components/dashboard/traveler/TravelerPackageStatusBadge.tsx`**

4. Exportar `getTravelerStatusConfig` (ya existe) para poder usar emoji/label en el boton del card sin renderizar la descripcion completa

### Resultado
En movil: el paquete colapsado muestra solo nombre + badge + un boton pequeno "Ver estado" que abre modal con la descripcion completa. Reduce significativamente la altura de cada tarjeta.

