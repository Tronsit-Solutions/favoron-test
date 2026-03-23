

## Agregar notificación al shopper cuando su paquete pase a "ready_for_pickup" o "ready_for_delivery"

### Problema actual
Cuando un admin cambia el estado de un paquete a `ready_for_pickup` o `ready_for_delivery` (desde AdminActionsModal), se llama `handleStatusUpdate` en `useDashboardActions.tsx`, que es una función genérica sin notificaciones para estos estados. El shopper no recibe ningún aviso.

### Solución — `src/hooks/useDashboardActions.tsx`

Agregar un bloque en `handleStatusUpdate` (después del `await updatePackage`) que detecte cuando el nuevo estado es `ready_for_pickup` o `ready_for_delivery`, y:

1. **Crear notificación in-app** — insertar en tabla `notifications` con `type: 'delivery'`, `priority: 'high'`
2. **Enviar email** — invocar `send-notification-email` edge function

Mensajes personalizados:
- `ready_for_pickup`: "Tu paquete [descripción] está listo para recoger en nuestra oficina."
- `ready_for_delivery`: "Tu paquete [descripción] está listo para ser enviado a tu dirección."

### Detalle técnico

En `handleStatusUpdate`, después de la línea `await updatePackage(id, updateData)` (aprox. línea 1381), agregar:

```ts
// Notificar al shopper cuando el paquete está listo
if (status === 'ready_for_pickup' || status === 'ready_for_delivery') {
  const pkg = packages.find(p => p.id === id);
  if (pkg?.user_id) {
    const isPickup = status === 'ready_for_pickup';
    const title = isPickup ? '📦 Paquete listo para recoger' : '🚛 Paquete listo para envío';
    const message = isPickup
      ? `Tu paquete "${pkg.item_description || 'tu pedido'}" está listo para recoger en nuestra oficina.`
      : `Tu paquete "${pkg.item_description || 'tu pedido'}" está listo para ser enviado a tu dirección.`;

    // In-app notification
    await supabase.from('notifications').insert({
      user_id: pkg.user_id,
      title, message,
      type: 'delivery',
      priority: 'high',
    });

    // Email notification
    await supabase.functions.invoke('send-notification-email', {
      body: { user_id: pkg.user_id, title, message, type: 'delivery', priority: 'high' }
    });
  }
}
```

### Archivos
- **Modificar**: `src/hooks/useDashboardActions.tsx` — dentro de `handleStatusUpdate`, después del updatePackage exitoso

