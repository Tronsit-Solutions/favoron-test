

## Plan: Slideshow de anuncio del programa de referidos (una sola vez)

### Nuevo archivo: `src/components/dashboard/ReferralAnnouncementModal.tsx`

Crear un modal tipo slideshow con 3 slides, estilo limpio similar a las imágenes de referencia:

- **Slide 1**: "¡Nuevo! Programa de referidos" — Ícono de regalo + texto introductorio sobre el programa
- **Slide 2**: "Así funciona" — 3 pasos visuales: 1) Comparte tu link, 2) Tu amigo hace su primer pedido, 3) Ambos ganan (con los montos Q dinámicos de `app_settings`)
- **Slide 3**: "¡Empieza ahora!" — CTA para copiar el link de referido + botón de cerrar

**Diseño**:
- Fondo blanco, parte superior de cada slide con gradiente colorido (similar al banner: `from-orange-400 via-pink-500 to-purple-600`) con ícono/ilustración
- Indicadores de puntos (dots) en la parte inferior
- Botones "Siguiente" / "Empezar" según el slide
- Swipeable en móvil usando `react-swipeable` (ya instalado)
- Tamaños de reward/discount dinámicos (fetch de `app_settings`)

**Control de visibilidad (solo una vez)**:
- Al cerrar/completar el slideshow, guardar `localStorage.setItem('referral_announcement_seen_' + userId, 'true')`
- No mostrar si ya existe esa key en localStorage

### Cambios en `src/components/Dashboard.tsx`

- Importar `ReferralAnnouncementModal`
- Agregar estado `showReferralAnnouncement`
- En un `useEffect`, verificar si `localStorage` tiene `referral_announcement_seen_{userId}` → si no, mostrar modal (con delay para no chocar con otros modales como acquisition survey o profile completion)
- No mostrar si el survey de adquisición está activo o el perfil está incompleto
- Renderizar el componente junto a los otros modales (líneas ~1122-1142)

