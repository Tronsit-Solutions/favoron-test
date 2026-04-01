

## Plan: Email a viajeros al asignar paquete (con aviso de 24h)

### Cambio único

**Archivo: `src/hooks/useDashboardActions.tsx`** (~líneas 1356-1367)

Después del `sendWhatsAppNotification` existente, agregar:

```typescript
supabase.functions.invoke('send-notification-email', {
  body: {
    user_id: matchedTrip.user_id,
    title: 'Nuevo paquete asignado',
    message: `Se te ha asignado un nuevo paquete con destino ${destination}. La propina asignada es Q${adminTip?.toFixed(2) || '0.00'}. Tienes 24 horas para aceptar esta asignación antes de que expire. Revisa tu dashboard para más detalles.`,
    type: 'package',
    priority: 'normal',
    action_url: 'https://favoron.app/dashboard'
  }
}).catch(err => console.error('Error sending assignment email to traveler:', err));
```

No se requieren cambios en la edge function ni migraciones. Se reutiliza `send-notification-email` existente.

