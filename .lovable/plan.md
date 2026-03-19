

## Expiración Automática de Assignments (bid_pending → bid_expired)

### Lógica clave
- Cada assignment en `package_assignments` recibe un `expires_at` al crearse (24h).
- Si un viajero responde (`bid_submitted`), se limpia su `expires_at`.
- Si expira sin responder, ese assignment individual pasa a `bid_expired`.
- **Solo cuando TODOS los assignments de un paquete están en estado terminal (bid_expired, bid_lost, bid_cancelled) Y ninguno en bid_submitted/bid_won**, el paquete vuelve a `approved`.
- Si al menos un viajero ya respondió (`bid_submitted`), el paquete NO vuelve a approved; queda disponible para que el shopper elija.

```text
Paquete X asignado a Viajero A y Viajero B
├─ A no responde en 24h → A = bid_expired
├─ B respondió → B = bid_submitted  
└─ Paquete sigue activo (B tiene bid pendiente para el shopper)

Paquete Y asignado a Viajero C y Viajero D
├─ C no responde → C = bid_expired
├─ D no responde → D = bid_expired
└─ Sin bids activos → Paquete vuelve a 'approved'
```

### Cambios en base de datos

1. **Agregar columna `expires_at` a `package_assignments`**

2. **Trigger en `package_assignments` INSERT**: setea `expires_at = NOW() + 24h` cuando se crea un assignment con `bid_pending`.

3. **Trigger en `package_assignments` UPDATE**: limpia `expires_at` cuando status cambia de `bid_pending` a `bid_submitted`.

4. **Actualizar `expire_unresponded_assignments()`** para también:
   - Buscar `package_assignments` con `status = 'bid_pending'` y `expires_at < NOW()`
   - Marcarlos como `bid_expired`
   - Después, para cada paquete afectado, verificar si quedan assignments activos (`bid_pending` o `bid_submitted`)
   - Si no quedan: resetear el paquete a `approved` (limpiar `matched_trip_id`, etc.)
   - Enviar notificaciones al viajero expirado y a admins (solo si el paquete vuelve a approved)

### Cambios en frontend

5. **UI de assignments en ActiveMatchesTab**: mostrar badge "⏰ Expirada" para assignments con `bid_expired` y mostrar tiempo restante para `bid_pending` con `expires_at`.

### Archivos a modificar
- Nueva migración SQL (función + trigger + columna)
- Componentes que muestran assignments para reflejar el estado `bid_expired` y countdown

