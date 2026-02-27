

## Plan: Reordenar contenido de slides del modal de referidos

### Cambios en `src/components/dashboard/ReferralAnnouncementModal.tsx`

**Slide 1 - Intro al programa:**
- Título: "Programa de Referidos"
- Texto: Introducción general - "Ahora puedes ganar recompensas invitando a tus amigos a usar Favoron. ¡Es fácil y rápido!"
- Hero badge: "¡Nuevo!" o "Programa de Referidos"
- Icono: Gift
- Botón: "Siguiente →"

**Slide 2 - Explicación / Cómo funciona:**
- Título: "Ambos ganan"
- Texto: "Tu amigo recibe Q{discountAmount} de descuento en su primer envío, y tú ganas Q{rewardAmount}. ¡Comparte tu link!"
- Hero badge: "Comparte y gana"
- Icono: Users
- Botón: "Copiar mi link de referido"

Solo se modifica el contenido textual del slide 1; el slide 2 y toda la lógica de navegación se mantienen igual.

