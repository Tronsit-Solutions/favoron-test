

## Contenido corregido de los Onboarding Slides

### Shoppers (4 slides, gradiente azul/primary)

**Slide 1 — "¡Tu primera compra internacional!"**
- Icono: Search
- "Describe el producto que necesitas y de dónde quieres que lo traigan. Un viajero lo llevará por ti."

**Slide 2 — "Recibe una cotización"**
- Icono: DollarSign
- "Un viajero te enviará el costo de traer tu paquete, que incluye su propina y la tarifa de servicio."

**Slide 3 — "Compra tu producto"**
- Icono: ShoppingCart
- "Una vez aceptada la cotización, compra el producto y envíalo a la dirección del viajero. Te la compartiremos automáticamente."

**Slide 4 — "¡Recibe tu paquete!"**
- Icono: Package
- "Retíralo en nuestra oficina o solicita envío a domicilio. Si el viajero pagó algún impuesto o tasa, se agregará como cargo adicional."
- Botón: "Continuar"

---

### Viajeros (4 slides, gradiente verde/traveler)

**Slide 1 — "¡Conviértete en Viajero!"**
- Icono: Plane
- "Registra tu viaje indicando de dónde vienes, cuándo llegas y cuánto espacio tienes disponible."

**Slide 2 — "Recibe solicitudes"**
- Icono: Users
- "Los shoppers te enviarán solicitudes de paquetes. Tú decides cuáles aceptar y defines tu propina."

**Slide 3 — "Cotiza con confianza"**
- Icono: DollarSign
- "Incluye tu propina en la cotización. Si llegas a pagar algún impuesto o tasa al transportar, se te reembolsará."

**Slide 4 — "Entrega y cobra"**
- Icono: Truck
- "Entrega los paquetes en nuestra oficina o programa una recolección. Recibirás tu pago al completar la entrega."
- Botón: "Continuar"

---

### Implementación
Se mantiene el mismo plan técnico ya aprobado:
- Nuevo `OnboardingBottomSheet.tsx` con diseño bottom-sheet (móvil) / modal (desktop)
- 4 slides con swipe (`react-swipeable`) y dots
- Eliminar Step 0 de `PackageRequestForm.tsx` y `TripForm.tsx`
- Reutilizar `skip_package_intro` / `skip_trip_intro` de `ui_preferences`
- Checkbox "No volver a mostrar" en último slide

El tema tributario queda mencionado sutilmente: para shoppers en el slide de entrega (cargo adicional), para viajeros en el slide de cotización (reembolso).

