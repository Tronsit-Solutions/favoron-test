

## Plan: Compactar tarjetas en estado `received_by_traveler`

### Problema
Las tarjetas en estado `received_by_traveler` son más altas que las demás porque muestran: (1) un bloque vertical con icono circular + texto + botón "Marcar como entregado", y (2) un botón separado "Ver dirección de oficina" con border-top. Esto genera inconsistencia visual.

### Solución
Cambiar el layout de `received_by_traveler` en `TravelerPackagePriorityActions.tsx` a un diseño compacto de una sola fila (similar al de `in_transit`):

- **Sin admin_confirmation**: Una fila con texto "¡Paquete listo para entregar!" a la izquierda y los botones "Marcar como entregado" + "Ver dirección" a la derecha, en línea.
- **Con admin_confirmation**: Una fila con "✅ Entrega confirmada" a la izquierda y botón disabled + "Ver dirección" a la derecha.
- Eliminar el icono circular decorativo (w-6 h-6) y el border-t separator del botón de oficina para estos estados.
- El botón de confirmación de entrega expandido (con warning + confirmar/cancelar) se mantiene igual cuando se activa.

### Archivo
`src/components/dashboard/traveler/TravelerPackagePriorityActions.tsx` — Extraer `received_by_traveler` del bloque vertical genérico y darle su propio bloque inline como `in_transit`.

