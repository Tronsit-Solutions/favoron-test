

## Problema

El `DeliveryAddressSheet` no muestra el dropdown de municipios porque la condición `isGuatemalaCityDept` es demasiado restrictiva. Solo activa el dropdown si `destinationCity` contiene exactamente "guatemala city" o "ciudad de guatemala". Pero en muchos paquetes, `package_destination` puede tener otros valores (como "Guatemala", el nombre del departamento, o estar vacío).

Además, si `destinationCountry` llega como `"Guatemala"` (con mayúscula) la normalización lo convierte a `"guatemala"` correctamente, pero si llega como el código `"guatemala"` del formulario de viaje, también funciona.

## Solución

**Archivo: `src/components/dashboard/DeliveryAddressSheet.tsx`**

Ampliar la condición `isGuatemalaCityDept` para que sea más permisiva — si el país es Guatemala, mostrar siempre el dropdown de municipios del departamento de Guatemala (ya que es la zona metropolitana principal donde se entregan la mayoría de paquetes):

```
// Línea 30-34: Cambiar de:
const isGuatemalaCityDept = isGuatemala && (
  destinationCity?.toLowerCase().includes('guatemala city') ||
  destinationCity?.toLowerCase().includes('ciudad de guatemala') ||
  !destinationCity
);

// A:
const isGuatemalaCityDept = isGuatemala;
```

Esto simplifica la lógica: si el destino es Guatemala (el país), siempre se muestra el dropdown de municipios. Esto tiene sentido porque el servicio de entrega opera en el área metropolitana de Guatemala independientemente de la ciudad destino registrada en el paquete.

Un solo cambio, una sola línea.

