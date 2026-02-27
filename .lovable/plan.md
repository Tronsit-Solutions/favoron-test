

## Plan: Agregar checkbox "No volver a mostrar" al modal de referidos

### Cambios en `src/components/dashboard/ReferralAnnouncementModal.tsx`
1. Agregar estado `dontShowAgain` (boolean)
2. En el slide 2 (antes del botón "Ahora no"), agregar un checkbox con label "No volver a mostrar"
3. Usar los componentes `Checkbox` y `Label` existentes
4. Al cerrar (`handleClose`), si `dontShowAgain` es true, guardar en localStorage la clave `referral_announcement_dismissed_${userId}`

### Cambios en `src/components/Dashboard.tsx`
1. En el `useEffect` que muestra el modal, verificar si existe la clave `referral_announcement_dismissed_${userId}` en localStorage antes de mostrar el modal
2. Si existe, no llamar `setShowReferralAnnouncement(true)`

