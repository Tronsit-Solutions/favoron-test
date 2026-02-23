

## Convertir el boton flotante de soporte en una pestana lateral minimalista

### Problema
El boton circular flotante de soporte en la esquina inferior derecha bloquea clicks en botones como "Hacer Match" y otros elementos de la interfaz.

### Solucion
Reemplazar el boton circular por una pestana vertical pequena pegada al borde derecho de la pantalla. Al hacer click se expande el panel de FAQ/WhatsApp. Cuando esta cerrada, solo se ve una pestanita delgada que no interfiere con el contenido.

### Detalles tecnicos

**Archivo: `src/components/SupportBubble.tsx`**

Reemplazar el boton flotante circular por una pestana lateral:

- **Estado cerrado**: Una pestana vertical delgada (~40px de ancho) pegada al borde derecho de la pantalla, a media altura, con el icono de audifonos rotado 90 grados y el texto "Soporte" vertical. Usa `right-0` en vez de `right-6` para que quede pegada al borde.
- **Estado abierto**: El panel de FAQ se despliega desde la derecha (mismo contenido actual: FAQ accordion + boton WhatsApp).
- La pestana usa `rounded-l-lg` (solo esquinas redondeadas del lado izquierdo) para verse como una "oreja" pegada al borde.
- Mover el z-index a `z-40` para reducir conflictos con otros elementos.
- El panel abierto se posiciona justo a la izquierda de la pestana.

Visualmente seria algo asi: una pestanita de ~40x100px en el borde derecho, centrada verticalmente, que al hacer click abre el panel de soporte hacia la izquierda.

