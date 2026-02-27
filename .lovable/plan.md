

## Plan: Modal de referidos a pantalla completa en móvil

### Cambio en `src/components/dashboard/ReferralAnnouncementModal.tsx`

Hacer que en móvil el modal ocupe toda la pantalla (tipo onboarding fullscreen), manteniendo el estilo actual en desktop:

1. **Importar `useIsMobile`** desde `@/hooks/use-mobile`
2. **Cambiar `DialogContent` classes** condicionalmente:
   - **Móvil**: `fixed inset-0 w-full h-full max-w-none max-h-none rounded-none` — pantalla completa, sin bordes redondeados
   - **Desktop**: mantener `max-w-sm rounded-2xl` actual
3. **Ajustar layout interno en móvil**:
   - La sección del gradiente ocupa ~60% de la altura (`flex-1` o `min-h-[60vh]`) con el ícono centrado más grande (`h-24 w-24`)
   - La sección blanca inferior se ancla al fondo con `mt-auto`
   - Los botones y dots se espacian más
4. **Agrandar elementos en móvil**: título más grande (`text-2xl`), ícono más grande, pasos del slide 2 con más padding

Resultado: en móvil se siente como una experiencia tipo onboarding a pantalla completa; en desktop sigue siendo un modal compacto.

