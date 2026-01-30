

## Notificación al Viajero por Comprobante de Pago Subido

### Resumen

Agregar una notificación por email al viajero cuando el admin sube el comprobante de pago de su viaje, permitiéndole ver y descargar el comprobante desde su dashboard.

---

### Flujo Actual

```text
Admin sube comprobante en FavoronPaymentReceiptUpload
       │
       ▼
Actualiza payment_orders (receipt_url, status='completed')
       │
       ▼
TRIGGER: sync_payment_receipt_trigger
       │
       ▼
Sincroniza datos a trip_payment_accumulator
       │
       ▼
(FIN - Sin notificación al viajero)
```

### Flujo Propuesto

```text
Admin sube comprobante en FavoronPaymentReceiptUpload
       │
       ▼
Actualiza payment_orders (receipt_url, status='completed')
       │
       ▼
TRIGGER: sync_payment_receipt_trigger (ACTUALIZADO)
       │
       ├──► Sincroniza datos a trip_payment_accumulator
       │
       └──► NUEVO: Notifica al viajero con prioridad 'high'
                   "Pago de viaje completado - Comprobante disponible"
```

---

### Cambio a Realizar

**Archivo**: Nueva migración SQL

Actualizar la función `sync_payment_receipt_to_accumulator()` para incluir la notificación al viajero:

| Campo | Valor |
|-------|-------|
| **Destinatario** | Viajero (`NEW.traveler_id`) |
| **Título** | "💳 Pago de viaje completado" |
| **Mensaje** | "Favorón ha completado el pago de tu viaje. Monto: Q{amount}. El comprobante está disponible en tu dashboard." |
| **Tipo** | `payment` |
| **Prioridad** | `high` (envía email) |
| **Action URL** | `/dashboard?tab=trips` |

---

### Sección Técnica

**Migración SQL a ejecutar**:

```sql
CREATE OR REPLACE FUNCTION public.sync_payment_receipt_to_accumulator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Solo actualizar cuando se complete un pago y se suba un comprobante
  IF NEW.status = 'completed' AND NEW.receipt_url IS NOT NULL 
     AND (OLD.status IS NULL OR OLD.status != 'completed' OR OLD.receipt_url IS NULL) THEN
    
    -- Actualizar el trip_payment_accumulator correspondiente
    UPDATE public.trip_payment_accumulator
    SET 
      payment_receipt_url = NEW.receipt_url,
      payment_receipt_filename = NEW.receipt_filename,
      payment_completed_at = NEW.completed_at,
      payment_completed_by = auth.uid(),
      updated_at = NOW()
    WHERE trip_id = NEW.trip_id 
      AND traveler_id = NEW.traveler_id;
      
    RAISE NOTICE 'Synced payment receipt to accumulator for trip % and traveler %', NEW.trip_id, NEW.traveler_id;
    
    -- NUEVA NOTIFICACIÓN: Notificar al viajero que el pago fue completado
    BEGIN
      PERFORM public.create_notification(
        NEW.traveler_id,
        '💳 Pago de viaje completado',
        'Favorón ha completado el pago de tu viaje. Monto: Q' || NEW.amount::text || '. El comprobante está disponible en tu dashboard.',
        'payment',
        'high',
        '/dashboard?tab=trips',
        jsonb_build_object(
          'payment_order_id', NEW.id,
          'trip_id', NEW.trip_id,
          'amount', NEW.amount,
          'receipt_url', NEW.receipt_url
        )
      );
      RAISE NOTICE 'Sent payment completion notification to traveler %', NEW.traveler_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send payment notification to traveler %: %', NEW.traveler_id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;
```

---

### Resultado Esperado

Cuando el admin sube el comprobante de pago:

1. El viajero recibe una notificación en la app
2. El viajero recibe un email (si tiene habilitadas las preferencias de `payment`)
3. El email incluye el monto pagado y un botón para ver el dashboard
4. El comprobante se muestra automáticamente en la tarjeta del viaje

