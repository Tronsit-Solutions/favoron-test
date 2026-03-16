

## Plan: Aclarar que impuestos son costo adicional en onboarding

### Cambio solicitado
Actualizar la slide 2/4 del onboarding de shoppers para enfatizar que los impuestos/tasas son un costo **adicional** aparte de la cotización principal.

**Slide 2/4 — "Recibe una cotización":**

Antes:
> "Un viajero te enviará el costo de traer tu paquete, que incluye su propina y la tarifa de servicio. Si el viajero pagó algún impuesto o tasa, deberás pagarlo para recibir tu paquete."

Después:
> "Un viajero te enviará el costo de traer tu paquete, que incluye su propina y la tarifa de servicio. **Adicionalmente**, si el viajero pagó algún impuesto o tasa, deberás **cubrir ese costo** para recibir tu paquete."

Cambios clave:
- Añadida la palabra "Adicionalmente" al inicio de la segunda oración
- Cambiado "pagarlo" por "cubrir ese costo" para mayor claridad

### Archivo a modificar
- `src/components/PackageRequestForm.tsx` (línea 156, propiedad `description` del segundo slide)

