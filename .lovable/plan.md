

## Hacer el panel de detalle de ingresos más grande y legible

### Cambios

**`src/components/admin/charts/RevenueDetailSheet.tsx`**:
- Cambiar de `Sheet` (panel lateral) a `Dialog` (modal centrado) con tamaño `max-w-3xl` para aprovechar mejor el espacio
- Aumentar tamaños de fuente en las tarjetas de resumen y en la tabla de detalle
- Aumentar el `max-h` de la tabla de detalle para mostrar más registros sin scroll
- Usar padding más generoso en las celdas de la tabla

Esto convertirá el panel estrecho actual en un modal amplio donde toda la información sea claramente visible.

