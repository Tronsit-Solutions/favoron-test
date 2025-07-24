-- Actualizar trips que tienen payment orders completadas a status completed_paid
UPDATE trips 
SET status = 'completed_paid' 
WHERE id IN (
  SELECT DISTINCT trip_id 
  FROM payment_orders 
  WHERE status = 'completed'
) AND status != 'completed_paid';