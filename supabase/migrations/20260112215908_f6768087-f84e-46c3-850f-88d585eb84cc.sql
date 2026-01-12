-- Eliminar payment orders pendientes (no completadas) para permitir que los viajeros vuelvan a solicitar
DELETE FROM payment_orders 
WHERE status = 'pending';

-- Resetear trip_payment_accumulator donde la payment order fue eliminada
UPDATE trip_payment_accumulator 
SET payment_order_created = false, updated_at = now()
WHERE trip_id IN (
  SELECT tpa.trip_id 
  FROM trip_payment_accumulator tpa
  LEFT JOIN payment_orders po ON po.trip_id = tpa.trip_id
  WHERE tpa.payment_order_created = true 
  AND po.id IS NULL
);