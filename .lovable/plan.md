

## Modificar botón de tips acumulados a círculo sin monto

### Cambios

**`src/components/dashboard/TripCard.tsx`** (líneas 228-238)
- Cambiar el botón de píldora con monto a un círculo simple con solo el emoji 🫰
- Eliminar el texto `formatCurrency(tipsAmount)` del botón
- Ajustar clases: `h-10 w-10 p-0 rounded-full` en vez de `h-10 px-3 rounded-full`
- Se puede eliminar el cálculo de `tipsAmount` (líneas 84-86) y el import de `getActiveTipFromPackage` si ya no se usa en otro lugar del archivo

El `TripTipsModal` ya tiene todo lo necesario: resumen de tips acumulados, desglose por paquete, progreso de entrega, y botón de solicitar cobro que se habilita solo cuando `canRequestPayment` es true (todos los paquetes entregados, acumulador existe, orden no creada y monto > 0).

