
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
