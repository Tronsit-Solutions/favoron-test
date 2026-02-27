

## Plan: Rediseñar el modal y banner de referidos al estilo Airbnb

Basado en la referencia de Airbnb (imagen 2): diseño limpio con imagen grande arriba con esquinas redondeadas, botón X sobre la imagen, título bold grande, subtítulo gris, y un botón CTA prominente con color sólido (rosa/magenta).

### 1. Rediseñar `ReferralAnnouncementModal.tsx`

Cambiar de slideshow de 3 slides a un **modal de una sola vista** estilo Airbnb bottom-sheet:
- Imagen/ilustración grande arriba con esquinas redondeadas superiores
- Botón X circular (gris oscuro) posicionado sobre la esquina superior derecha de la imagen
- Eliminar los slides, dots y swipe — simplificar a una sola pantalla
- Título bold grande: "Gana Q{rewardAmount} por cada amigo que invites"
- Subtítulo gris: "Tu amigo recibe Q{discountAmount} de descuento. Comparte tu link y ambos ganan."
- Botón CTA rosa/magenta estilo Airbnb (`bg-gradient-to-r from-pink-600 to-rose-500`) con texto "Copiar mi link de referido"
- En mobile: aparece como bottom sheet (fijado abajo con `rounded-t-3xl`)
- En desktop: dialog centrado con `rounded-2xl max-w-md`

### 2. Rediseñar `ReferralBanner.tsx`

Adaptar al estilo card de Airbnb:
- Fondo blanco con borde sutil en lugar del gradiente colorido
- Imagen/ilustración decorativa arriba o a la izquierda
- Tipografía: título negro bold, subtítulo gris
- Botón CTA rosa/magenta estilo Airbnb en lugar del botón blanco actual
- Esquinas redondeadas grandes (`rounded-2xl`)
- Sombra suave

### Detalle técnico

- Eliminar dependencia de `react-swipeable` en el modal (ya no hay slides)
- Usar un gradiente de imagen decorativa (tipo ilustración de regalo/amigos) en la parte superior del modal
- Mantener la lógica de fetch de `app_settings` y copy del link sin cambios

