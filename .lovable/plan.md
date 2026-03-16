

## Plan: Añadir info de pago del shopper en onboarding de viajeros

### Contexto
El viajero necesita saber que después de enviar la cotización, el shopper debe pagarla. Si no paga, el pedido no se completó.

### Cambio
**Archivo:** `src/components/TripForm.tsx`

Modificar la **slide 3/4 ("Recibe tu compra")** para incluir esta información, ya que es el momento lógico después de la cotización y antes de la entrega:

**Nuevo texto slide 3/4:**
> "Después de enviar tu cotización, el shopper debe realizar el pago. Una vez pagado, el shopper hará la compra y la enviará a tu dirección. Se te compartirá el comprobante de compra y el número de tracking. Si el shopper no paga, el pedido no se completó."

Solo se modifica texto en una línea (120-121), sin cambios de lógica ni estructura.

