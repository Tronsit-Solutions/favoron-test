
# Plan: Agregar lógica condicional de entrega en EditTripModal

## Problema Identificado

En el modal de edición de viajes (`EditTripModal`), la sección "Entrega de paquetes en Guatemala" siempre muestra las opciones:
- "Entrego en oficina de Favorón (zona 14)"
- "Entrega a mensajero Favorón"

Esto es incorrecto cuando el destino del viaje es fuera de Guatemala (ej: España, USA). En esos casos debería mostrar:
- "Lo envío por correo"
- "Me coordino con el shopper"

El `TripForm.tsx` (formulario de creación) ya tiene esta lógica implementada correctamente, pero el `EditTripModal` no la tiene.

## Solución

Implementar la misma lógica condicional del `TripForm` en el `EditTripModal`:

### Archivo: `src/components/EditTripModal.tsx`

**1. Agregar import del hook de delivery points:**
```typescript
import { useDeliveryPoints } from "@/hooks/useDeliveryPoints";
```

**2. Agregar lógica de detección de destino (después de la línea 168):**
```typescript
// Fetch delivery points for international destinations
const { getDeliveryPointByCity } = useDeliveryPoints();

// Determine if destination has official delivery options
const destinationDeliveryPoint = formData.toCity && formData.toCountry 
  ? getDeliveryPointByCity(formData.toCity, formData.toCountry)
  : null;

const isDestinationGuatemala = formData.toCountry?.toLowerCase() === 'guatemala';
const hasInternationalDeliveryPoint = !!destinationDeliveryPoint;
const hasOfficialDeliveryOptions = isDestinationGuatemala || hasInternationalDeliveryPoint;
```

**3. Actualizar la sección 3 de entrega (líneas 473-600):**
- Cambiar el título de la sección según el destino
- Mostrar opciones de Guatemala (oficina/mensajero) solo cuando `hasOfficialDeliveryOptions` es true
- Mostrar opciones internacionales (correo/coordinación) cuando no hay opciones oficiales

**4. Ajustar la validación del formulario:**
- Permitir los nuevos valores de `deliveryMethod`: 'correo' y 'coordinacion_shopper'
- Cuando el destino cambia, resetear el `deliveryMethod` si ya no es válido

## Cambios Específicos

| Línea | Cambio |
|-------|--------|
| 11 | Agregar import de `useDeliveryPoints` |
| ~168 | Agregar lógica de detección de destino |
| 277-283 | Al cambiar destino, resetear método de entrega si es inválido |
| 473-479 | Título dinámico según destino |
| 482-493 | Opciones condicionales de entrega |

## Flujo esperado

| Destino | Opciones mostradas |
|---------|-------------------|
| Guatemala | "Entrego en oficina de Favorón" / "Entrega a mensajero Favorón" |
| España | "Lo envío por correo" / "Me coordino con el shopper" |
| USA | "Entrego en oficina de Favorón" / "Entrega a mensajero Favorón" (si hay delivery point) |
| Otro país sin delivery point | "Lo envío por correo" / "Me coordino con el shopper" |
