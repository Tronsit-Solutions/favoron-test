

## Fix: "No se pudo procesar la cotización" para Anika Erichsen

### Causa raíz
El paquete Whoop Peak (`6c7615f3`) fue matched directamente via `matched_trip_id` sin crear un registro en `package_assignments`. Cuando Anika intenta aceptar el tip, el código en `useDashboardActions.tsx` línea 412 busca `selectedPackage._assignmentId`, no lo encuentra, y lanza el error en línea 434.

Este es exactamente el bug del plan ya aprobado anteriormente.

### Solución — `src/hooks/useDashboardActions.tsx`

En el bloque `else` (líneas 431-435), en lugar de lanzar error, hacer fallback para paquetes legacy sin assignment:

```ts
} else {
  // Legacy match without assignment — update package directly
  console.log('📦 Legacy match (no assignment), updating package directly');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  await updatePackage(selectedPackage.id, {
    status: 'quote_sent',
    quote: normalizedQuoteData,
    traveler_address: travelerAddress,
    matched_trip_dates: matchedTripDates,
    quote_expires_at: expiresAt
  });
}
```

Esto permite que paquetes matched sin `package_assignments` (como el de Anika) procedan normalmente — el paquete se actualiza directamente a `quote_sent` con la cotización y datos de entrega, y el shopper recibe la notificación de pago.

### Archivos
- **Modificar**: `src/hooks/useDashboardActions.tsx` — reemplazar el `throw` en líneas 431-435 por fallback a `updatePackage`

Un cambio de ~8 líneas en un solo archivo.

