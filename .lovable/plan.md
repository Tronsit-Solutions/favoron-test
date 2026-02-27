

### Plan: Eliminar restricción de vista única del modal de referidos

**Cambios en `src/components/Dashboard.tsx`:**

1. Revertir el código de preview mode (quitar `useSearchParams`, `isPreviewReferralModal`)
2. En el `useEffect` del modal de referidos, eliminar el chequeo de `localStorage` (`referral_announcement_seen_`)
3. En `handleReferralAnnouncementClose`, eliminar el `localStorage.setItem` que marca como visto
4. El modal se mostrará cada vez que el usuario entre al dashboard (tras el delay de 2s, respetando las condiciones existentes de survey y perfil completo)

