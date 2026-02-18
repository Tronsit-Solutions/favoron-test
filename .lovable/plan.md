


## ✅ Preservar el tip asignado en el historial de rechazos del viajero

**Estado: Completado**

### Cambios realizados

1. **Función SQL `traveler_reject_assignment`** — Captura `previous_admin_assigned_tip`, `previous_quote_price` y `previous_products_tips` en `traveler_rejection` y `admin_actions_log` antes de limpiarlos.

2. **`PackageDetailModal.tsx`** — Muestra el tip ofrecido en la sección de rechazo del viajero y en cada entrada del historial de rechazos.

3. **`AdminMatchDialog.tsx`** — Banner naranja antes de la lista de viajes mostrando el último tip ofrecido y motivo de rechazo. También corregido `wasPreviouslyRejected` para usar `previous_traveler_id`.
