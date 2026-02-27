

## Plan: Modal de referidos con 2 slides y colores anteriores

### Cambios en `src/components/dashboard/ReferralAnnouncementModal.tsx`

1. **Agregar estado de slide**: `currentSlide` (0 o 1) con navegación por dots y botón "Siguiente"/"Copiar link"

2. **Slide 1 - Introducción**:
   - Hero con gradiente anterior (naranja/rosa/púrpura: `from-orange-400 via-pink-500 to-purple-600`)
   - Icono de Gift grande centrado
   - Título: "Programa de Referidos"
   - Subtítulo: "Gana Q{rewardAmount} por cada amigo que invites"
   - Botón "Siguiente" y link "Ahora no"

3. **Slide 2 - Acción**:
   - Hero con gradiente complementario
   - Explicación: "Tu amigo recibe Q{discountAmount} de descuento y tú ganas Q{rewardAmount}"
   - Botón CTA "Copiar mi link de referido"
   - Link "Ahora no"

4. **Navegación**:
   - Dots indicadores (2 puntos) debajo del contenido
   - Swipe con `react-swipeable` para cambiar entre slides
   - Mantener tamaño actual del modal (no fullscreen)

5. **Colores**: Regresar al gradiente naranja/rosa/púrpura en el hero y botones CTA con ese mismo esquema de color

