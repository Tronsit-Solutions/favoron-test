

### Cambio en `src/components/Dashboard.tsx`

En el `useEffect` de la línea 370, agregar una verificación del query param `preview_referral_modal`. Si está presente, abrir el modal inmediatamente sin verificar localStorage ni marcarlo como visto al cerrar.

**Líneas 370-386:**

1. Al inicio del `useEffect`, verificar si `searchParams` contiene `preview_referral_modal=true`. Si es así, abrir el modal directamente (`setShowReferralAnnouncement(true)`) y hacer `return` (sin timer, sin chequear `seen`).
2. En `handleReferralAnnouncementClose`, solo guardar en localStorage si el query param NO está presente, para que el preview no "queme" la visualización única.
3. Se usará `useSearchParams` (ya disponible vía `useUrlState` o importado directamente de `react-router-dom`). Verificar si ya se importa `useSearchParams` en el componente; si no, agregarlo.

