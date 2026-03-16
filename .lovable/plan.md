

## Plan: Sintetizar y reorganizar slides del onboarding de viajeros (5 slides)

### Problema actual
Los slides 2 y 3 tienen textos largos que intentan cubrir demasiados conceptos en una sola pantalla. Especialmente el slide 3 mezcla cotización, pago, compra, envío y tracking.

### Propuesta: 5 slides con textos cortos

**Archivo:** `src/components/TripForm.tsx` (líneas 106-127)

```text
Slide 1: "¡Conviértete en Viajero!"  [Plane]
→ "Registra tu viaje: de dónde vienes, cuándo llegas y cuánto espacio tienes."

Slide 2: "Recibe solicitudes"  [Users]
→ "Los shoppers te enviarán solicitudes con una propina asignada. Tú decides cuáles aceptar."

Slide 3: "Cotización y pago"  [DollarSign]
→ "Envía tu cotización al shopper. Si no realiza el pago, el pedido no se completa."

Slide 4: "Recibe el paquete"  [Package]
→ "El shopper hará la compra y la enviará a tu dirección con comprobante y tracking. Si te cobran impuestos en aduana, se te reembolsarán con factura."

Slide 5: "Entrega y cobra"  [Truck]
→ "Entrega en nuestra oficina o programa recolección. Recibirás tu pago al completar la entrega."
```

### Cambios
- Reorganizar el array `travelerOnboardingSlides` de 4 a 5 slides
- Agregar import de `DollarSign` si no está ya importado
- Textos más cortos y un concepto por slide

