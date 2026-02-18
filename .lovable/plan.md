

## Fix: Mostrar sugerencia contextual segun motivo de rechazo

### Problema
El tooltip de "Cotizacion Rechazada" siempre muestra "Asignar un tip menor a QX" sin importar el motivo del rechazo. Si el viajero rechazo por "tiempo de entrega", esa sugerencia no tiene sentido.

### Solucion
Condicionar la sugerencia en `RejectionTooltip.tsx` para que solo aparezca cuando el motivo de rechazo esta relacionado con el tip (ej: "tip_bajo", "low_tip", "Price too high", etc.). Para otros motivos, no mostrar sugerencia o mostrar una relevante al motivo.

### Cambios

**Archivo: `src/components/admin/RejectionTooltip.tsx`**

- Agregar logica para determinar si el rechazo es por tip: verificar si `rejectionReason` contiene palabras clave como `tip`, `precio`, `price`, `caro`, `expensive`, `bajo`.
- Solo mostrar el bloque de sugerencia "Asignar un tip menor" cuando el motivo sea relacionado al tip.
- Para otros motivos, omitir la sugerencia o mostrar solo el tip anterior como referencia sin la recomendacion de bajarlo.

