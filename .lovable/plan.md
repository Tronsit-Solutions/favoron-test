
## Corregir logica de seleccion de paquetes en ordenes de pago

### Problema
La logica actual en `CompactOrderRow` (linea 255) elige entre `historical_packages` (snapshot al crear la orden) y los paquetes actuales del viaje (fallback). El criterio es: si el fallback tiene MAS paquetes, lo usa. Esto causa que ordenes completadas/rechazadas muestren paquetes que no estaban incluidos en el monto original, generando discrepancias falsas (ej: orden de Q370 muestra Q630 porque ahora hay mas paquetes completados).

### Solucion
Cambiar la logica para que ordenes ya procesadas (`completed` o `rejected`) SIEMPRE usen `historical_packages`, ya que ese es el snapshot exacto de lo que se pago. El fallback a paquetes actuales solo debe usarse para ordenes `pending` cuando el snapshot historico esta vacio o incompleto.

### Cambio

**Archivo:** `src/components/admin/AdminTravelerPaymentsTab.tsx`

Reemplazar la logica de seleccion de paquetes (lineas 254-257):

```
// Logica actual (incorrecta para ordenes procesadas):
const packages = normalizedHistorical.length >= fallbackTripPackages.length ...

// Logica corregida:
const isProcessed = order.status === 'completed' || order.status === 'rejected';
const packages = isProcessed && normalizedHistorical.length > 0
  ? normalizedHistorical
  : (normalizedHistorical.length >= fallbackTripPackages.length && normalizedHistorical.length > 0
    ? normalizedHistorical
    : (fallbackTripPackages.length > 0 ? fallbackTripPackages : normalizedHistorical));
```

Esto asegura que:
- Ordenes `completed`/`rejected`: siempre usan historical_packages (el snapshot al momento del pago)
- Ordenes `pending`: mantienen el comportamiento actual de usar fallback si tiene mas paquetes (para mostrar datos actualizados)

### Impacto
- Ana Quezada mostrara correctamente Q370 (los 5 paquetes del snapshot) en vez de Q630
- La alerta roja de discrepancia desaparecera para esta orden ya que Q370 == Q370
- Ordenes pendientes seguiran mostrando datos actuales para facilitar la revision antes del pago
