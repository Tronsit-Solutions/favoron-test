

## Plan: Email al shopper cuando viajero envía cotización (bid_submitted)

### Cambio único

**Archivo: `src/hooks/useDashboardActions.tsx`** (~líneas 445-458)

Después del `sendWhatsAppNotification` al shopper, agregar:

```typescript
supabase.functions.invoke('send-notification-email', {
  body: {
    user_id: selectedPackage.user_id,
    title: 'Nueva cotización recibida',
    message: `Un viajero ha enviado una cotización para tu producto "${productName}". El total de la cotización es Q${quoteTotal.toFixed(2)}. Tienes 48 horas para aceptar o rechazar esta cotización antes de que expire. Ingresa a tu dashboard para ver y comparar las cotizaciones recibidas.`,
    type: 'quote',
    priority: 'normal',
    action_url: 'https://favoron.app/dashboard'
  }
}).catch(err => console.error('Error sending quote email to shopper:', err));
```

Se reutilizan las variables `quoteTotal` y `productName` ya existentes. No se necesitan cambios en la edge function ni migraciones.

