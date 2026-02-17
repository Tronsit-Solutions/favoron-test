

## Agregar opcion de pickup en oficina para destinos internacionales con punto de entrega

### Problema actual
Cuando el destino del paquete es Madrid (Espana), el formulario solo muestra "Enviarlo a mi domicilio". Pero existe un Punto de Entrega configurado en Madrid (Calle de Julian Besteiro 26) que deberia aparecer como opcion de pickup gratuito.

### Solucion

Integrar el hook `useDeliveryPoints` en `PackageRequestForm.tsx` para que, cuando el destino seleccionado coincida con un punto de entrega activo, se muestre la opcion de "Recoger en oficina" con la direccion del punto.

### Cambios

**1. `src/components/PackageRequestForm.tsx`**

- Importar y usar `useDeliveryPoints` para obtener los puntos de entrega activos
- Buscar si existe un punto de entrega para la ciudad y pais seleccionados usando `getDeliveryPointByCity(city, country)`
- Cuando exista un punto de entrega para el destino:
  - Mostrar una opcion de pickup con el nombre y direccion del punto (ej: "Recoger en Punto de Entrega Madrid - Calle de Julian Besteiro 26")
  - Mantener la opcion de "Enviarlo a mi domicilio" como segunda opcion
- La logica aplica tanto para destinos internacionales como para Guatemala City (que ya tiene su opcion de pickup hardcodeada en zona 14)

**2. Logica de renderizado en Step 3 (seccion de entrega)**

Actualmente el flujo es:
- Si es devolucion: opciones de devolucion
- Si tiene destino (`isGuatemalaDestination`, que en realidad es "tiene cualquier destino"): opciones de pickup (solo Guatemala City) + delivery
- Si no tiene ciudad: mensaje "selecciona ciudad"

El cambio agrega una verificacion: si `getDeliveryPointByCity(actualDestination, selectedCountry)` retorna un punto activo, mostrar la opcion de pickup con los datos de ese punto, ademas de la opcion de delivery existente. Esto aplica para cualquier destino, no solo Guatemala City.

### Detalle tecnico

```
// Dentro de PackageRequestForm:
const { getDeliveryPointByCity } = useDeliveryPoints();

// En la seccion de delivery options:
const deliveryPoint = getDeliveryPointByCity(actualDestination, selectedCountry);

// Si hay delivery point, mostrar:
// - "Recoger en [nombre del punto]" con la direccion como subtexto
// - "Enviarlo a mi domicilio" (opcion existente)
```

El valor de `deliveryMethod` seguira siendo `'pickup'` cuando seleccionen la oficina, igual que con Guatemala City, por lo que no hay cambios necesarios en el backend ni en la logica de cotizacion.

