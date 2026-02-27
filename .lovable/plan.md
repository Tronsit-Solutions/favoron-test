

## Plan: Restaurar colores del banner de referidos al estilo anterior

### Cambios en `src/components/dashboard/ReferralBanner.tsx`

1. **Fondo**: Cambiar de `bg-card` con borde a `bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600` con texto blanco
2. **Barra de acento**: Eliminar la barra superior rosa, ya no es necesaria con el gradiente completo
3. **Icono Gift**: Cambiar fondo de `bg-rose-50` a `bg-white/20` con icono blanco
4. **Texto**: Cambiar colores de texto a blanco (`text-white`, `text-white/80`)
5. **Decoración handshake**: Agregar icono `Handshake` de lucide-react con baja opacidad (`text-white/10`) posicionado en la esquina inferior derecha como decoración
6. **Botón CTA**: Cambiar a `bg-white text-pink-600 hover:bg-white/90` para contrastar con el fondo
7. **Badges de montos**: Resaltar Q{amount} con `bg-white/20 rounded-full px-2` para mayor visibilidad

