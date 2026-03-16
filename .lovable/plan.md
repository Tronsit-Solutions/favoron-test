

## Plan: Actualizar contenido del onboarding de shoppers

### Cambios solicitados

**Slide 1/4:**
- Título: `"¡Estás a punto de pedir tu primer Favorón!"` (antes: `"¡Tu primera compra internacional!"`)

**Slide 2/4:**
- Añadir: `"Si el viajero pagó algún impuesto o tasa, deberás pagarlo para recibir tu paquete."`
- Descripción completa: `"Un viajero te enviará el costo de traer tu paquete, que incluye su propina y la tarifa de servicio. Si el viajero pagó algún impuesto o tasa, deberás pagarlo para recibir tu paquete."`

**Slide 3/4:**
- Eliminar: `"Te la compartiremos automáticamente."`
- Descripción: `"Una vez aceptada la cotización, compra el producto y envíalo a la dirección del viajero."`

**Slide 4/4:**
- Eliminar: `"Si el viajero pagó algún impuesto o tasa, se agregará como cargo adicional."`
- Descripción: `"Retíralo en nuestra oficina o solicita envío a domicilio. ¡Así de fácil!"`

### Archivo a modificar
- `src/components/PackageRequestForm.tsx` (líneas 147-168, array `shopperOnboardingSlides`)

