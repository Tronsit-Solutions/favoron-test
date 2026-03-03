

## Plan: Mejorar mensajes de empaque original en vista del viajero

### Cambios de texto

**Cuando SÍ necesita empaque original:**
- Título: "Conservar empaque original del producto"
- Subtítulo: "Se refiere al empaque de la marca, no a la caja de cartón del envío/delivery."

**Cuando NO necesita empaque original:**
- Título: "No requiere empaque original"
- Subtítulo: "Puedes descartar el empaque de la marca y enviar solo el producto."

### Archivos a modificar

1. **`src/components/QuoteDialog.tsx`** — indicador de empaque en el modal de aceptar/rechazar.
2. **`src/components/dashboard/traveler/TravelerPackageDetails.tsx`** — indicador de empaque en detalles del paquete (2 lugares: bloque products_data y bloque products fallback).

Solo se actualiza el texto. Sin cambios de lógica ni estructura.

