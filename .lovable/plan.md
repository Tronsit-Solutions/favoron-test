

## Migrar paquetes "archived_by_shopper" pagados

### Que se hara

Se ejecutara una migracion SQL en 3 pasos:

1. **Desactivar triggers de notificacion** para que no se envien emails ni WhatsApp
2. **Mover 53 paquetes pagados sin reembolso** a status `completed`
3. **Mover 2 paquetes pagados con reembolso** a status `cancelled`
4. **Reactivar triggers**

### Paquetes afectados

- **53 paquetes** pagados sin reembolso -> `completed`
- **2 paquetes** con reembolso -> `cancelled`:
  - Rodrigo Orantes (Q72.00)
  - Iker Ibanez (Q238.00)
- **~100 paquetes** sin cotizacion pagada se quedan como estan

### Detalle tecnico

**SQL de la migracion:**

```text
-- 1) Desactivar triggers de notificacion
ALTER TABLE public.packages DISABLE TRIGGER trigger_notify_shopper_package_status;
ALTER TABLE public.packages DISABLE TRIGGER trigger_notify_traveler_package_status;
ALTER TABLE public.packages DISABLE TRIGGER tr_notify_shopper_quote_sent;

-- 2) Migrar los 53 sin reembolso a completed
UPDATE public.packages
SET status = 'completed', updated_at = NOW()
WHERE status = 'archived_by_shopper'
  AND quote IS NOT NULL
  AND (quote->>'totalPrice')::numeric > 0
  AND id NOT IN (SELECT package_id FROM refund_orders);

-- 3) Migrar los 2 con reembolso a cancelled
UPDATE public.packages
SET status = 'cancelled', updated_at = NOW()
WHERE status = 'archived_by_shopper'
  AND quote IS NOT NULL
  AND (quote->>'totalPrice')::numeric > 0
  AND id IN (SELECT package_id FROM refund_orders);

-- 4) Reactivar triggers
ALTER TABLE public.packages ENABLE TRIGGER trigger_notify_shopper_package_status;
ALTER TABLE public.packages ENABLE TRIGGER trigger_notify_traveler_package_status;
ALTER TABLE public.packages ENABLE TRIGGER tr_notify_shopper_quote_sent;
```

### Resultado esperado

- 53 paquetes aparecen en la tabla financiera como `completed`
- 2 paquetes con reembolso aparecen como `cancelled`
- El pedido de Cristina por Q375 queda visible en la tabla financiera
- Ningun usuario recibe notificacion
- Los ~100 paquetes sin pago permanecen sin cambios

